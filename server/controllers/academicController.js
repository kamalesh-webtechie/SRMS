const Subject = require('../models/Subject');
const Mark = require('../models/Mark');
const StudentProfile = require('../models/StudentProfile');
const Department = require('../models/Department');
const Section = require('../models/Section');
const ResultPublication = require('../models/ResultPublication');

// @desc    Create a new subject
// @route   POST /api/academic/subjects
// @access  Private/Admin
const createSubject = async (req, res) => {
    try {
        const payload = { ...req.body };
        if (req.user.role === 'hod') {
            payload.departmentId = req.user.departmentId;
            const dept = await Department.findById(req.user.departmentId);
            if (dept) payload.department = dept.name;
        }
        const subject = await Subject.create(payload);
        res.status(201).json(subject);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all subjects (optionally filter by sem/dept)
// @route   GET /api/academic/subjects
// @access  Private
const getSubjects = async (req, res) => {
    try {
        const { semester, department } = req.query;
        let query = {};
        if (semester) query.semester = semester;

        if (req.user && req.user.role === 'hod') {
            query.$or = [
                { departmentId: req.user.departmentId },
                { isCommon: true }
            ];
        } else if (department) {
            query.$or = [
                { department: department },
                { isCommon: true }
            ];
        }

        const subjects = await Subject.find(query);
        res.status(200).json(subjects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a subject
// @route   PUT /api/academic/subjects/:id
// @access  Private/Admin
const updateSubject = async (req, res) => {
    try {
        const { code } = req.body;

        // Check if code is being updated and if it conflicts
        if (code) {
            const existingSubject = await Subject.findOne({ code, _id: { $ne: req.params.id } });
            if (existingSubject) {
                return res.status(400).json({ message: 'Subject code already exists' });
            }
        }

        const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        res.status(200).json(subject);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a subject
// @route   DELETE /api/academic/subjects/:id
// @access  Private/Admin
const deleteSubject = async (req, res) => {
    try {
        const subject = await Subject.findByIdAndDelete(req.params.id);

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        res.status(200).json({ message: 'Subject deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get marks for a specific subject, exam, and list of students (for Faculty View)
// @route   GET /api/academic/marks/batch
// @access  Private
const TeachingAssignment = require('../models/TeachingAssignment');
const FacultyProfile = require('../models/FacultyProfile');

// @desc    Get marks for a specific subject, exam, section (Faculty View)
// @route   GET /api/academic/marks/batch
// @access  Private
const getBatchMarks = async (req, res) => {
    try {
        const { subjectId, examType, sectionId } = req.query;
        if (!subjectId || !examType) {
            return res.status(400).json({ message: 'Subject ID and Exam Type required' });
        }

        const query = { subject: subjectId, examType };
        if (sectionId) query.sectionId = sectionId;

        const marks = await Mark.find(query);
        res.status(200).json(marks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const logAction = require('../utils/logger');

// @desc    Enter/Update marks for a student
// @route   POST /api/academic/marks
// @access  Private/Faculty/Admin
const updateMarks = async (req, res) => {
    try {
        const { studentId, subjectId, sectionId, examType, marksObtained, maxMarks, semester } = req.body;

        if (!sectionId) return res.status(400).json({ message: 'Section ID is required' });

        // Validate Teaching Assignment for Faculty
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
        }

        // Check if locked
        const existingMark = await Mark.findOne({ student: studentId, subject: subjectId, examType });
        if (existingMark && existingMark.isLocked) {
            return res.status(403).json({ message: 'Marks entry is locked for this student.' });
        }

        const mark = await Mark.findOneAndUpdate(
            { student: studentId, subject: subjectId, examType },
            {
                marksObtained,
                maxMarks,
                semester,
                sectionId, // Save sectionId
                isPublished: false
            },
            { new: true, upsert: true }
        );

        // Audit Log
        await logAction({
            action: 'UPDATE_MARKS',
            actorId: req.user._id,
            actorName: req.user.name,
            targetEntity: 'Mark',
            targetId: mark._id,
            details: { studentId, subjectId, marksObtained, sectionId },
            req
        });

        res.status(200).json(mark);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update marks' });
    }
}

// @desc    Get marks for a student
// @route   GET /api/academic/marks/:studentId
// @access  Private
const getStudentMarks = async (req, res) => {
    try {
        const marks = await Mark.find({ student: req.params.studentId })
            .populate('subject')
            .populate('student');
        res.status(200).json(marks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Publish results (Admin Only)
// @route   PUT /api/academic/publish
// @access  Private/Admin
const publishResults = async (req, res) => {
    try {
        const { sectionId, examType } = req.body;

        if (!sectionId) {
            return res.status(400).json({ message: 'Section ID is required' });
        }

        // 1. Find the section to get common details for logging (optional but good)
        const section = await Section.findById(sectionId).populate('departmentId');
        if (!section) return res.status(404).json({ message: 'Section not found' });

        // 2. Update marks for this specific section and exam type
        // Note: we filter by sectionId and examType. 
        // We only publish marks that have been approved by HOD (ready_to_publish).
        const result = await Mark.updateMany(
            { sectionId, examType, status: 'ready_to_publish' },
            { isPublished: true, isLocked: true, status: 'published' }
        );

        if (result.matchedCount === 0) {
            return res.status(400).json({ message: 'No marks approved by HOD are ready to be published for this section.' });
        }

        // 3. Update profiles of students in this section to show they have new results
        await StudentProfile.updateMany(
            { sectionId },
            { hasNewResult: true }
        );

        // Audit Log
        await logAction({
            action: 'PUBLISH_RESULTS',
            actorId: req.user._id,
            actorName: req.user.name,
            targetEntity: 'BatchResults',
            details: {
                sectionName: section.name,
                department: section.departmentId?.name,
                semester: section.semester,
                examType,
                count: result.modifiedCount
            },
            req
        });

        res.status(200).json({ message: `Results published successfully for ${result.modifiedCount} records in ${section.departmentId?.name} - Year ${section.year} - Section ${section.name} (Semester ${section.semester}).` });
    } catch (error) {
        console.error("Publish Error:", error);
        res.status(500).json({ message: error.message });
    }
}

const getYearFromSemester = (semester) => {
    if (semester <= 2) return 'I';
    if (semester <= 4) return 'II';
    if (semester <= 6) return 'III';
    if (semester <= 8) return 'IV';
    return null;
};

// @desc    Get full result sheet for a student (Public/Student View)
// @route   GET /api/academic/results/student/:id
// @access  Private
const getStudentResultSheet = async (req, res) => {
    try {
        const studentId = req.params.id;

        // 1. Get Student Profile
        const student = await StudentProfile.findById(studentId)
            .populate('user', 'name email')
            .populate('sectionId');
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // 2. Resolve Department ID
        let deptId = student.departmentId;
        if (!deptId) {
            const dept = await Department.findOne({ name: student.department });
            if (dept) deptId = dept._id;
        }
        if (!deptId) return res.status(400).json({ message: 'Student department mapping missing.' });

        // 3. Get Active Publications for this Department
        const publications = await ResultPublication.find({
            departmentId: deptId,
            isPublished: true
        });

        // 4. Find all Mark documents where this student appears in records
        // We look for any mark document containing the student's ID in its records array
        const markDocs = await Mark.find({
            'records.studentId': studentId
        }).populate('subjectId');

        // 5. Group by Semester and Filter by Publication
        const resultsBySem = {};

        markDocs.forEach(doc => {
            const sem = doc.semester;
            const eType = doc.examType;

            // Map semester -> year for publication check
            const year = getYearFromSemester(sem);

            // Check if publication exists for this department + year + examType
            const isPublished = publications.find(p => p.year === year && p.examType === eType);

            if (!isPublished) return; // SKIP unpublished marks

            if (!resultsBySem[sem]) {
                resultsBySem[sem] = {
                    semester: sem,
                    subjects: [],
                    internals: [],
                    totalCredits: 0,
                    totalPoints: 0,
                    sgpa: 0
                };
            }

            // Extract this specific student's marks from the document
            const studentEntry = doc.records.find(r => r.studentId.toString() === studentId.toString());
            if (!studentEntry) return;

            const m = studentEntry.marks;
            const max = doc.maxMarks || 100;
            const normalizedMark = max > 0 ? (m / max) * 100 : 0;

            let gradePoint = 0;
            let grade = 'U';

            if (normalizedMark >= 90) { gradePoint = 10; grade = 'O'; }
            else if (normalizedMark >= 81) { gradePoint = 9; grade = 'A+'; }
            else if (normalizedMark >= 71) { gradePoint = 8; grade = 'A'; }
            else if (normalizedMark >= 61) { gradePoint = 7; grade = 'B+'; }
            else if (normalizedMark >= 51) { gradePoint = 6; grade = 'B'; }
            else if (normalizedMark >= 45) { gradePoint = 5; grade = 'C'; }
            else { gradePoint = 0; grade = 'U'; }

            const credits = doc.subjectId.credits || 0;

            if (eType === 'Semester') {
                resultsBySem[sem].totalCredits += credits;
                resultsBySem[sem].totalPoints += (gradePoint * credits);

                resultsBySem[sem].subjects.push({
                    subjectCode: doc.subjectId.code,
                    subjectName: doc.subjectId.name,
                    credits: credits,
                    marks: m,
                    maxMarks: max,
                    grade: grade,
                    gradePoint: gradePoint,
                    status: grade === 'U' ? 'Fail' : 'Pass'
                });
            } else {
                resultsBySem[sem].internals.push({
                    subjectCode: doc.subjectId.code,
                    subjectName: doc.subjectId.name,
                    examType: eType,
                    marks: m,
                    maxMarks: max,
                    grade: grade
                });
            }
        });

        // 6. Finalize SGPA and Sort
        let totalCumulativePoints = 0;
        let totalCumulativeCredits = 0;
        let totalPassedPoints = 0;
        let totalPassedCredits = 0;

        const semesters = Object.values(resultsBySem)
            .map(sem => {
                const credits = Number(sem.totalCredits);
                const points = Number(sem.totalPoints);
                sem.sgpa = credits > 0 ? (points / credits).toFixed(2) : "0.00";
                
                totalCumulativePoints += points;
                totalCumulativeCredits += credits;

                // Also calculate points excluding Failures for the alternate CGPA
                sem.subjects.forEach(sub => {
                    if (sub.grade !== 'U') {
                        totalPassedPoints += (sub.gradePoint * sub.credits);
                        totalPassedCredits += sub.credits;
                    }
                });

                return sem;
            })
            .sort((a, b) => a.semester - b.semester);

        const cgpa = totalCumulativeCredits > 0 
            ? (totalCumulativePoints / totalCumulativeCredits).toFixed(2) 
            : "0.00";

        const cgpaExcludingFailures = totalPassedCredits > 0
            ? (totalPassedPoints / totalPassedCredits).toFixed(2)
            : "0.00";

        // 7. Reset 'New Result' Flag
        const hasNew = student.hasNewResult;
        if (hasNew) {
            student.hasNewResult = false;
            await student.save();
        }

        res.status(200).json({
            student: {
                name: student.user.name,
                registerNumber: student.registerNumber,
                department: student.department,
                section: student.sectionId, // Populated section object
                hasNewResult: hasNew,
                cgpa: cgpa,
                cgpaExcludingFailures: cgpaExcludingFailures
            },
            academicHistory: semesters
        });

    } catch (error) {
        console.error("Student Result View Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
}

module.exports = {
    createSubject,
    getSubjects,
    updateSubject,
    deleteSubject,
    updateMarks,
    getStudentMarks,
    publishResults,
    getBatchMarks,
    getStudentResultSheet
};
