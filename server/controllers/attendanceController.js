const Attendance = require('../models/Attendance');
const StudentProfile = require('../models/StudentProfile');
const Subject = require('../models/Subject');
const LateAttendanceReport = require('../models/LateAttendanceReport'); // Import new model
const SystemSettings = require('../models/SystemSettings'); // Import Settings
const TeacherAssignment = require('../models/TeachingAssignment'); // Fix import name if needed
const TeachingAssignment = require('../models/TeachingAssignment');
const FacultyProfile = require('../models/FacultyProfile');
const Department = require('../models/Department'); // Added for department code mapping
const logAction = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * Normalizes a department name or code into the canonical Code (e.g., "Computer Science" -> "CSE")
 * @param {string} input - The department name or code
 * @returns {Promise<string>} - The canonical code
 */
const resolveDeptCode = async (input) => {
    if (!input) return 'Unknown';
    // If it's already a short code (3-4 chars uppercase), return it
    if (/^[A-Z]{2,5}$/.test(input)) return input;

    const dept = await Department.findOne({
        $or: [
            { name: new RegExp(`^${input}$`, 'i') },
            { code: new RegExp(`^${input}$`, 'i') }
        ]
    });
    return dept ? dept.code : input;
};

// @desc    Mark attendance for a batch of students
// @route   POST /api/attendance
// @access  Private/Faculty
const markAttendance = async (req, res) => {
    try {
        const { subjectId, sectionId, date, records } = req.body;

        if (!records || records.length === 0) {
            return res.status(400).json({ message: 'No attendance records provided' });
        }

        if (!sectionId) {
            return res.status(400).json({ message: 'Section ID is required' });
        }

        // --- Late Detection Logic ---
        let isLate = false;
        let lateMinutes = 0;
        let lockSettings = null;

        const settings = await SystemSettings.findOne(); // Fetch settings

        // Determine Lock Time (Server Time Based)
        let lockTimeStr = '23:59';
        if (settings) {
            if (settings.attendanceSettings && settings.attendanceSettings.attendanceLockTime) {
                lockTimeStr = settings.attendanceSettings.attendanceLockTime;
            } else if (settings.attendanceLockTime) {
                lockTimeStr = settings.attendanceLockTime;
            }
        }

        const now = new Date();
        const [lockH, lockM] = lockTimeStr.split(':').map(Number);

        // Lock threshold for the TARGET DATE
        // If date is TODAY, check time.
        // If date is PAST, it is definitely LATE (if we consider lock time as Daily Cutoff).
        // Prompt says: "Late must be calculated using: attendance session date, configured attendance lock time".

        const attendanceDate = new Date(date);
        const cutoffTime = new Date(attendanceDate); // Start with attendance date
        cutoffTime.setHours(lockH, lockM, 0, 0);

        // If marking for Today:
        const todayStr = now.toISOString().split('T')[0];
        const recordDateStr = attendanceDate.toISOString().split('T')[0];

        if (recordDateStr < todayStr) {
            // Marking for past date is LATE (assuming daily lock)
            isLate = true;
            // Late by how much? Difference between NOW and Cutoff of that day
            const diffMs = now - cutoffTime;
            lateMinutes = Math.floor(diffMs / 60000);
        } else if (recordDateStr === todayStr) {
            // Marking for today
            // Check specific time
            // Compare NOW vs Cutoff (Today's lock time)
            // But cutoffTime is based on `attendanceDate` (which is today).
            // BUT wait, `attendanceDate` from client might be 00:00:00. 
            // `cutoffTime` set to LockHour:LockMin is correct.

            // We need to compare NOW with cutoffTime. 
            // Note: `now` includes current Time. `cutoffTime` includes Lock Time on Today.

            if (now > cutoffTime) {
                isLate = true;
                const diffMs = now - cutoffTime;
                lateMinutes = Math.floor(diffMs / 60000);
            }
        } else {
            // Future date? Allowed? Usually not prevented here but not Late.
            isLate = false;
        }

        // -----------------------------

        // Validate Teaching Assignment for Faculty
        let assignmentId = null;
        if (req.user.role === 'faculty') {
            const profile = await FacultyProfile.findOne({ user: req.user._id });
            if (!profile) return res.status(403).json({ message: 'Faculty profile not found' });

            const assignment = await TeachingAssignment.findOne({
                facultyId: profile._id,
                subjectId,
                sectionId
            });

            if (!assignment) {
                return res.status(403).json({ message: 'You are not assigned to this class section.' });
            }
            assignmentId = assignment._id;
        }

        // --- Standardized Department Resolution ---
        if (!subjectId) return res.status(400).json({ message: 'Subject ID is required' });
        const subject = await Subject.findById(subjectId);
        const departmentValue = await resolveDeptCode(subject?.department);

        if (!subjectId || !sectionId || !date) {
            return res.status(400).json({ message: 'Missing required fields: subjectId, sectionId, or date' });
        }

        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
            return res.status(400).json({ message: 'Invalid date format' });
        }
        dateObj.setHours(0, 0, 0, 0);

        console.log(`Processing attendance for ${records.length} students on ${dateObj.toISOString()}`);

        const operations = records.map(record => {
            // Ensure studentId is a valid ObjectId and filter out any internal mongoose fields
            let studentObjectId;
            try {
                studentObjectId = new mongoose.Types.ObjectId(record.studentId);
            } catch (e) {
                throw new Error(`Invalid student ID format for student: ${record.studentId}`);
            }

            return {
                updateOne: {
                    filter: {
                        student: studentObjectId,
                        subject: new mongoose.Types.ObjectId(subjectId),
                        date: dateObj
                    },
                    update: {
                        $set: {
                            student: studentObjectId,
                            studentId: studentObjectId,
                            subject: new mongoose.Types.ObjectId(subjectId),
                            subjectId: new mongoose.Types.ObjectId(subjectId),
                            sectionId: new mongoose.Types.ObjectId(sectionId),
                            classId: new mongoose.Types.ObjectId(sectionId),
                            facultyId: req.user.role === 'faculty' ? new mongoose.Types.ObjectId(req.user._id) : null,
                            assignmentId: assignmentId ? new mongoose.Types.ObjectId(assignmentId) : null,
                            department: departmentValue,
                            attendanceDate: dateObj,
                            date: dateObj,
                            status: record.status,
                            remarks: record.remarks || '',
                            markedBy: new mongoose.Types.ObjectId(req.user._id)
                        }
                    },
                    upsert: true
                }
            };
        });

        const result = await Attendance.bulkWrite(operations);
        console.log("BULK WRITE SUCCESS:", result.upsertedCount, "inserted,", result.modifiedCount, "updated");

        // Audit Log
        await logAction({
            action: 'UPDATE_ATTENDANCE',
            actorId: req.user._id,
            actorName: req.user.name,
            targetEntity: 'Subject',
            targetId: subjectId,
            details: { date: dateObj, count: records.length, sectionId, isLate, department: departmentValue },
            req
        });

        // --- Late Report Generation ---
        let adminReportCreated = false;
        if (isLate && req.user.role === 'faculty') { // Only faculty generate reports
            try {
                console.log(`[LATE ATTENDANCE] facultyId=${req.user._id} assignmentId=${assignmentId} lateBy=${lateMinutes}m`);

                await LateAttendanceReport.create({
                    facultyId: req.user._id,
                    classId: sectionId,
                    subjectId: subjectId,
                    assignmentId: assignmentId,
                    attendanceDate: dateObj,
                    submittedAt: now,
                    lateByMinutes: lateMinutes,
                    reason: 'Submitted after lock time',
                    status: 'PENDING'
                });
                adminReportCreated = true;
            } catch (reportErr) {
                console.error("Failed to create Late Attendance Report:", reportErr);
                // Silent failure as per req? "response must include a warning flag"
            }
        }
        // ------------------------------

        res.status(200).json({
            message: 'Attendance marked successfully',
            late: isLate,
            adminReportCreated
        });

    } catch (error) {
        console.error("CRITICAL ATTENDANCE SAVE ERROR DETAILS:", {
            message: error.message,
            stack: error.stack,
            code: error.code,
            details: error
        });
        res.status(500).json({
            message: 'Server Error',
            details: error.message,
            code: error.code
        });
    }
};

// @desc    Get attendance stats for a subject
// @route   GET /api/attendance/subject/:subjectId
const getSubjectAttendance = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { date } = req.query;

        let query = { subject: subjectId };

        if (date) {
            const dateObj = new Date(date);
            dateObj.setHours(0, 0, 0, 0);
            query.date = dateObj;

            const records = await Attendance.find(query).populate('student', 'enrollment');
            return res.status(200).json(records);
        }

        res.status(200).json({ message: 'Select a date' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get My Attendance
// @route   GET /api/attendance/me
const getMyAttendance = async (req, res) => {
    try {
        const studentProfile = await StudentProfile.findOne({ user: req.user._id });
        if (!studentProfile) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        const stats = await Attendance.aggregate([
            { $match: { student: studentProfile._id } },
            {
                $group: {
                    _id: '$subject',
                    totalClasses: { $sum: 1 },
                    presentCount: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Present'] }, 1, 0]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'subjects',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'subjectDetails'
                }
            },
            { $unwind: '$subjectDetails' },
            {
                $project: {
                    subjectName: '$subjectDetails.name',
                    subjectCode: '$subjectDetails.code',
                    totalClasses: 1,
                    presentCount: 1,
                    percentage: { $multiply: [{ $divide: ['$presentCount', '$totalClasses'] }, 100] }
                }
            }
        ]);

        res.status(200).json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Attendance Report for Admin
// @route   GET /api/attendance/report/daily
// @access  Private/Admin
const getDailyAttendanceReport = async (req, res) => {
    try {
        const { startDate, endDate, department: deptParam, year, sectionId, reportType } = req.query;
        if (!deptParam) return res.status(400).json({ message: 'Department is required' });

        const department = await resolveDeptCode(deptParam);

        const start = new Date(startDate || new Date());
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate || startDate || new Date());
        end.setHours(23, 59, 59, 999);

        const matchQuery = {
            department: department,
            attendanceDate: { $gte: start, $lte: end }
        };

        if (year) matchQuery['sectionInfo.year'] = year; // We'll need to join for this if filtering by year in summary
        if (sectionId) matchQuery.sectionId = new mongoose.Types.ObjectId(sectionId);

        if (reportType === 'absentees') {
            // Detailed list of all absentees in the range
            const absentees = await Attendance.find({
                ...matchQuery,
                status: 'Absent'
            })
                .populate({
                    path: 'student',
                    select: 'user registerNumber batch currentYear',
                    populate: { path: 'user', select: 'name' }
                })
                .populate('subject', 'name code')
                .populate('sectionId', 'name year')
                .sort({ attendanceDate: -1, 'student.user.name': 1 });

            const flatAbsentees = absentees.map(r => ({
                date: r.attendanceDate,
                studentName: r.student?.user?.name,
                registerNumber: r.student?.registerNumber,
                batch: r.student?.batch,
                year: r.sectionId?.year || r.student?.currentYear,
                section: r.sectionId?.name,
                subjectName: r.subject?.name,
                subjectCode: r.subject?.code,
                facultyName: r.markedBy?.name // Will need population if names needed
            }));

            return res.status(200).json(flatAbsentees);
        }

        // Default: Summary Report
        const report = await Attendance.aggregate([
            {
                $match: {
                    department: department,
                    attendanceDate: { $gte: start, $lte: end }
                }
            },
            ...(sectionId ? [{ $match: { sectionId: new mongoose.Types.ObjectId(sectionId) } }] : []),
            {
                $lookup: {
                    from: 'sections',
                    localField: 'sectionId',
                    foreignField: '_id',
                    as: 'sectionInfo'
                }
            },
            { $unwind: '$sectionInfo' },
            ...(year ? [{ $match: { 'sectionInfo.year': year } }] : []),
            {
                $group: {
                    _id: {
                        subject: '$subject',
                        sectionId: '$sectionId',
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$attendanceDate" } }
                    },
                    totalPresent: {
                        $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
                    },
                    totalAbsent: {
                        $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] }
                    },
                    totalOD: {
                        $sum: { $cond: [{ $eq: ['$status', 'On-duty'] }, 1, 0] }
                    },
                    markedBy: { $first: '$markedBy' }
                }
            },
            {
                $lookup: {
                    from: 'subjects',
                    localField: '_id.subject',
                    foreignField: '_id',
                    as: 'subjectInfo'
                }
            },
            { $unwind: '$subjectInfo' },
            {
                $lookup: {
                    from: 'sections',
                    localField: '_id.sectionId',
                    foreignField: '_id',
                    as: 'sectionDetails'
                }
            },
            { $unwind: '$sectionDetails' },
            {
                $lookup: {
                    from: 'users',
                    localField: 'markedBy',
                    foreignField: '_id',
                    as: 'facultyInfo'
                }
            },
            { $unwind: { path: '$facultyInfo', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    date: '$_id.date',
                    departmentName: department,
                    year: '$sectionDetails.year',
                    section: '$sectionDetails.name',
                    subjectName: '$subjectInfo.name',
                    subjectCode: '$subjectInfo.code',
                    totalPresent: 1,
                    totalAbsent: 1,
                    totalOD: 1,
                    markedByName: '$facultyInfo.name',
                    subjectId: '$_id.subject',
                    sectionId: '$_id.sectionId'
                }
            },
            {
                $sort: {
                    date: -1,
                    year: 1,
                    section: 1
                }
            }
        ]);

        res.status(200).json(report);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Late Attendance Reports for Admin
// @route   GET /api/admin/late-attendance-reports
// @access  Private/Admin
const getLateReports = async (req, res) => {
    try {
        const reports = await LateAttendanceReport.find({ status: 'PENDING' })
            .populate('facultyId', 'name email')
            .populate('subjectId', 'name code')
            .populate('classId', 'name batch') // Assuming classId is Section
            .sort({ createdAt: -1 });

        res.status(200).json(reports);
    } catch (error) {
        console.error("Error fetching late reports:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    markAttendance,
    getSubjectAttendance,
    getMyAttendance,
    getDailyAttendanceReport,
    getDepartmentDailySummary,
    getLateReports,
    getAttendanceStudentDetails,
    getFacultySubjectWiseAttendance
};

// @desc    Get student details for a specific attendance report row (Admin View)
// @route   GET /api/attendance/report/student-details
// @access  Private/Admin
async function getAttendanceStudentDetails(req, res) {
    // Attendance student details and subject-wise views are generated directly from the Attendance collection
    try {
        const { subjectId, date, department: deptParam, sectionId } = req.query;
        if ((!subjectId && !sectionId) || !date || !deptParam) {
            return res.status(400).json({ message: 'subjectId or sectionId, date and department are required' });
        }

        const department = await resolveDeptCode(deptParam);

        const dateObj = new Date(date);
        dateObj.setHours(0, 0, 0, 0);

        const query = {
            subject: subjectId,
            attendanceDate: dateObj,
            department: department
        };

        if (sectionId) query.sectionId = sectionId;

        const records = await Attendance.find(query)
            .populate({
                path: 'student',
                select: 'registerNumber user',
                populate: {
                    path: 'user',
                    select: 'name'
                }
            });

        const present = records
            .filter(r => r.status === 'Present')
            .map(r => ({
                studentId: r.student?._id,
                name: r.student?.user?.name || 'N/A',
                registerNumber: r.student?.registerNumber
            }));

        const absent = records
            .filter(r => r.status === 'Absent')
            .map(r => ({
                studentId: r.student?._id,
                name: r.student?.user?.name || 'N/A',
                registerNumber: r.student?.registerNumber
            }));

        const onDuty = records
            .filter(r => r.status === 'On-duty')
            .map(r => ({
                studentId: r.student?._id,
                name: r.student?.user?.name || 'N/A',
                registerNumber: r.student?.registerNumber
            }));

        res.status(200).json({ present, absent, onDuty });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
}

// @desc    Get subject-wise attendance for faculty
// @route   GET /api/attendance/faculty/subject-wise
// @access  Private/Faculty
async function getFacultySubjectWiseAttendance(req, res) {
    // Attendance student details and subject-wise views are generated directly from the Attendance collection
    try {
        const { assignmentId, date } = req.query;
        if (!assignmentId || !date) {
            return res.status(400).json({ message: 'assignmentId and date are required' });
        }

        // Security: Ensure faculty owns this assignment
        const assignment = await TeachingAssignment.findById(assignmentId).populate('subjectId sectionId');
        if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

        // Check if faculty owns assignment (unless admin)
        if (req.user.role === 'faculty') {
            const facultyProfile = await FacultyProfile.findOne({ user: req.user._id });
            if (assignment.facultyId.toString() !== facultyProfile._id.toString()) {
                return res.status(403).json({ message: 'Unauthorized access to this assignment' });
            }
        }

        const dateObj = new Date(date);
        dateObj.setHours(0, 0, 0, 0);

        const records = await Attendance.find({
            assignmentId: assignmentId,
            attendanceDate: dateObj
        }).populate('student', 'name registerNumber');

        const students = records.map(r => ({
            studentId: r.student?._id,
            name: r.student?.name,
            registerNumber: r.student?.registerNumber,
            status: r.status
        }));

        res.status(200).json({
            subjectName: assignment.subjectId?.name,
            classLabel: `${assignment.sectionId?.name} - ${assignment.sectionId?.batch}`,
            date: date,
            presentCount: students.filter(s => s.status === 'Present').length,
            absentCount: students.filter(s => s.status === 'Absent').length,
            students
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
}

async function getDepartmentDailySummary(req, res) {
    try {
        const { date, department: deptParam } = req.query;
        if (!date || !deptParam) return res.status(400).json({ message: 'Date and department are required' });

        const department = await resolveDeptCode(deptParam);

        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        // Aggregate unique student status per day (Priority: Present > On-duty > Absent)
        const summary = await Attendance.aggregate([
            { $match: { department, attendanceDate: { $gte: start, $lte: end } } },
            {
                $addFields: {
                    priority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ['$status', 'Present'] }, then: 3 },
                                { case: { $eq: ['$status', 'On-duty'] }, then: 2 },
                                { case: { $eq: ['$status', 'Absent'] }, then: 1 }
                            ],
                            default: 0
                        }
                    }
                }
            },
            { $sort: { priority: -1 } },
            {
                $group: {
                    _id: { student: '$student', date: '$attendanceDate' },
                    status: { $first: '$status' },
                    sectionId: { $first: '$sectionId' }
                }
            },
            {
                $lookup: {
                    from: 'sections',
                    localField: 'sectionId',
                    foreignField: '_id',
                    as: 'section'
                }
            },
            { $unwind: '$section' },
            {
                $group: {
                    _id: { sectionId: '$sectionId', year: '$section.year', name: '$section.name' },
                    totalPresent: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
                    totalAbsent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
                    totalOD: { $sum: { $cond: [{ $eq: ['$status', 'On-duty'] }, 1, 0] } }
                }
            },
            {
                $project: {
                    _id: 0,
                    sectionId: '$_id.sectionId',
                    year: '$_id.year',
                    sectionName: '$_id.name',
                    departmentName: department,
                    totalPresent: 1,
                    totalAbsent: 1,
                    totalOD: 1,
                    date: { $literal: date }
                }
            },
            { $sort: { year: 1, sectionName: 1 } }
        ]);

        res.status(200).json(summary);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
}
