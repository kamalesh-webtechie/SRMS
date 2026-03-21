const TimeTable = require('../models/TimeTable');
const User = require('../models/User');

// Helper to convert HH:MM to minutes
const toMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

// Helper to check if two time slots overlap
const overlaps = (start1, end1, start2, end2) => {
    return toMinutes(start1) < toMinutes(end2) && toMinutes(start2) < toMinutes(end1);
};

// @desc    Create new timetable
// @route   POST /api/timetable/create
// @access  Private/Admin
exports.createTimeTable = async (req, res) => {
    try {
        const { department, batch, year, section, semester, days } = req.body;

        // Validation: Check for section clash in existing timetables
        const existingTable = await TimeTable.findOne({ department, batch, year, section, semester });
        if (existingTable) {
            return res.status(400).json({
                success: false,
                message: 'Timetable already exists for this section. Use update instead.'
            });
        }

        // Check if HOD is assigning to their own department
        if (req.user.role === 'hod' && department !== req.user.department) {
            return res.status(403).json({
                success: false,
                message: 'You can only create timetables for your own department'
            });
        }

        // Conflict Detection: Faculty Clash
        for (const dayData of days) {
            for (const period of dayData.periods) {
                if (period.type === 'class') {
                    // Check if faculty is busy elsewhere at the same time
                    const facultyClash = await TimeTable.findOne({
                        'days': {
                            $elemMatch: {
                                day: dayData.day,
                                'periods': {
                                    $elemMatch: {
                                        facultyId: period.facultyId,
                                        type: 'class',
                                        $or: [
                                            { startTime: { $lt: period.endTime }, endTime: { $gt: period.startTime } }
                                        ]
                                    }
                                }
                            }
                        }
                    });

                    if (facultyClash) {
                        return res.status(400).json({
                            success: false,
                            message: `Faculty clash on ${dayData.day} at ${period.startTime}-${period.endTime}`
                        });
                    }
                }
            }
        }

        // Sanitize periods: Remove empty facultyId strings to prevent CastError
        const sanitizedDays = days.map(dayData => ({
            ...dayData,
            periods: dayData.periods.map(period => {
                const p = { ...period };
                if (p.facultyId && typeof p.facultyId === 'object') {
                    p.facultyId = p.facultyId._id;
                }
                if (p.facultyId === "") delete p.facultyId;
                if (p.subject === "") delete p.subject;
                return p;
            })
        }));

        const timetable = await TimeTable.create({
            department,
            batch,
            year,
            section,
            semester,
            days: sanitizedDays
        });

        res.status(201).json({
            success: true,
            data: timetable
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all timetables
// @route   GET /api/timetable
// @access  Private/Admin
exports.getTimeTables = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'hod') {
            query.department = req.user.department;
        }
        const timetables = await TimeTable.find(query).populate('days.periods.facultyId', 'name');
        res.status(200).json({
            success: true,
            data: timetables
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get student timetable
// @route   GET /api/timetable/student
// @access  Private/Student
exports.getStudentTimeTable = async (req, res) => {
    try {
        // Assuming req.user is populated by auth middleware
        const student = await User.findById(req.user.id);
        // We need to find the student's profile to get dept/batch/section/sem
        // In this system, it seems StudentProfile is separate
        const StudentProfile = require('../models/StudentProfile');
        const studentProfile = await StudentProfile.findOne({ user: req.user.id })
            .populate('sectionId');

        if (!studentProfile) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }

        const query = {
            department: studentProfile.department,
            batch: studentProfile.batch,
            year: studentProfile.currentYear,
            semester: studentProfile.semester.toString()
        };

        // Handle section - if sectionId exists, use its name, otherwise fallback to profile.section
        if (studentProfile.sectionId && studentProfile.sectionId.name) {
            query.section = studentProfile.sectionId.name;
        } else if (studentProfile.section) {
            query.section = studentProfile.section;
        }

        const timetable = await TimeTable.findOne(query).populate('days.periods.facultyId', 'name');

        res.status(200).json({
            success: true,
            data: timetable
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get faculty timetable
// @route   GET /api/timetable/faculty
// @access  Private/Faculty
exports.getFacultyTimeTable = async (req, res) => {
    try {
        const facultyId = req.user.id;
        const timetables = await TimeTable.find({
            'days.periods.facultyId': facultyId
        }).populate('days.periods.facultyId', 'name');

        // Filter out only periods assigned to this faculty
        const facultySchedule = timetables.map(tt => ({
            department: tt.department,
            batch: tt.batch,
            year: tt.year,
            section: tt.section,
            semester: tt.semester,
            days: tt.days.map(d => ({
                day: d.day,
                periods: d.periods.filter(p => p.facultyId && p.facultyId._id.toString() === facultyId.toString())
            })).filter(d => d.periods.length > 0)
        })).filter(tt => tt.days.length > 0);

        res.status(200).json({
            success: true,
            data: facultySchedule
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update timetable
// @route   PUT /api/timetable/update/:id
// @access  Private/Admin
exports.updateTimeTable = async (req, res) => {
    try {
        const { id } = req.params;
        const { days, department } = req.body;

        const existingTT = await TimeTable.findById(id);
        if (!existingTT) {
            return res.status(404).json({
                success: false,
                message: 'Timetable not found'
            });
        }

        // Integrity Check: HOD can only update their own department's timetable
        if (req.user.role === 'hod') {
            if (existingTT.department !== req.user.department) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to update this department\'s timetable'
                });
            }
            if (department && department !== req.user.department) {
                return res.status(403).json({
                    success: false,
                    message: 'You cannot change the department to one outside your own'
                });
            }
        }

        // Conflict Detection: Faculty Clash (excluding the current timetable)
        for (const dayData of days) {
            for (const period of dayData.periods) {
                if (period.type === 'class') {
                    const facultyClash = await TimeTable.findOne({
                        _id: { $ne: id },
                        'days': {
                            $elemMatch: {
                                day: dayData.day,
                                'periods': {
                                    $elemMatch: {
                                        facultyId: period.facultyId,
                                        type: 'class',
                                        $or: [
                                            {
                                                $and: [
                                                    { startTime: { $lt: period.endTime } },
                                                    { endTime: { $gt: period.startTime } }
                                                ]
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    });

                    if (facultyClash) {
                        return res.status(400).json({
                            success: false,
                            message: `Faculty clash on ${dayData.day} at ${period.startTime}-${period.endTime}`
                        });
                    }
                }
            }
        }

        // Sanitize periods: Remove empty facultyId strings to prevent CastError
        const sanitizedDays = days.map(dayData => ({
            ...dayData,
            periods: dayData.periods.map(period => {
                const p = { ...period };
                if (p.facultyId && typeof p.facultyId === 'object') {
                    p.facultyId = p.facultyId._id;
                }
                if (p.facultyId === "") delete p.facultyId;
                if (p.subject === "") delete p.subject;
                return p;
            })
        }));

        const timetable = await TimeTable.findByIdAndUpdate(id, { ...req.body, days: sanitizedDays }, { new: true });

        res.status(200).json({
            success: true,
            data: timetable
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete timetable
// @route   DELETE /api/timetable/delete/:id
// @access  Private/Admin
exports.deleteTimeTable = async (req, res) => {
    try {
        await TimeTable.findByIdAndDelete(req.params.id);
        res.status(200).json({
            success: true,
            message: 'Timetable deleted'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
