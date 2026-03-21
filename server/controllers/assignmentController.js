const TeachingAssignment = require('../models/TeachingAssignment');
const Section = require('../models/Section');
const Subject = require('../models/Subject');
const FacultyProfile = require('../models/FacultyProfile');
const Mark = require('../models/Mark');
const StudentProfile = require('../models/StudentProfile');

// Create new assignment
const createAssignment = async (req, res) => {
    try {
        const { facultyId, subjectId, sectionId, semester, academicYear } = req.body;

        // Security check for HOD
        if (req.user.role === 'hod') {
            const section = await Section.findById(sectionId);
            if (!section || String(section.departmentId) !== String(req.user.departmentId)) {
                return res.status(403).json({ message: 'Unauthorized: You can only assign faculty to sections in your own department.' });
            }
        }

        const assignment = await TeachingAssignment.create({
            facultyId,
            subjectId,
            sectionId,
            semester,
            academicYear: academicYear || new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString()
        });

        // Populate to get faculty name for the frontend message
        const populated = await TeachingAssignment.findById(assignment._id)
            .populate({
                path: 'facultyId',
                populate: { path: 'user', select: 'name' }
            });

        res.status(201).json(populated);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'This faculty member is already assigned to the selected subject and section.' });
        }
        res.status(400).json({ message: error.message });
    }
};

// Get all assignments (Admin/HOD)
const getAssignments = async (req, res) => {
    try {
        let filter = {};
        if (req.user && req.user.role === 'hod') {
            const sections = await Section.find({ departmentId: req.user.departmentId });
            filter.sectionId = { $in: sections.map(s => s._id) };
        }

        const assignments = await TeachingAssignment.find(filter)
            .populate({
                path: 'facultyId',
                populate: { path: 'user', select: 'name email' } // Nested populate for User in FacultyProfile
            })
            .populate('subjectId', 'name code')
            .populate({
                path: 'sectionId',
                select: 'name semester batch departmentId year',
                populate: { path: 'departmentId', select: 'name code' }
            })
            .sort({ academicYear: -1 });
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get assignments for a specific faculty (Faculty view)
const getFacultyAssignments = async (req, res) => {
    try {
        let facultyProfileId = req.params.facultyId;

        // If user is not admin, ensure they are requesting their own assignments
        // And resolving their FacultyProfile ID from their User ID
        if (req.user.role !== 'admin') {
            const profile = await FacultyProfile.findOne({ user: req.user._id });
            if (!profile) {
                return res.status(404).json({ message: 'Faculty profile not found for this user' });
            }
            facultyProfileId = profile._id;
        }

        const assignments = await TeachingAssignment.find({ facultyId: facultyProfileId })
            .populate('subjectId', 'name code')
            .populate({
                path: 'sectionId',
                select: 'name semester batch departmentId year',
                populate: { path: 'departmentId', select: 'name code' }
            })
            .sort({ academicYear: -1 });
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getFacultyStats = async (req, res) => {
    try {
        let facultyProfileId;
        const profile = await FacultyProfile.findOne({ user: req.user._id });
        if (!profile) {
            return res.status(404).json({ message: 'Faculty profile not found' });
        }
        facultyProfileId = profile._id;

        // 1. Get assignments to find subjects and sections
        const assignments = await TeachingAssignment.find({ facultyId: facultyProfileId });

        const subjectIds = assignments.map(a => a.subjectId);
        const sectionIds = [...new Set(assignments.map(a => a.sectionId.toString()))];

        // 2. Count total unique students
        const studentCount = await StudentProfile.countDocuments({ sectionId: { $in: sectionIds } });

        // 3. Calculate Average Performance from Marks
        // We look for marks entered by this faculty
        const marks = await Mark.find({ facultyId: req.user._id });

        let totalMarksObtained = 0;
        let totalPossibleMarks = 0;
        let recordCount = 0;

        marks.forEach(markDoc => {
            const max = markDoc.maxMarks || 100;
            markDoc.records.forEach(record => {
                totalMarksObtained += record.marks;
                totalPossibleMarks += max;
                recordCount++;
            });
        });

        const avgPerformance = totalPossibleMarks > 0
            ? Math.round((totalMarksObtained / totalPossibleMarks) * 100)
            : 0;

        res.json({
            totalSubjects: subjectIds.length,
            totalStudents: studentCount,
            avgPerformance: avgPerformance
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteAssignment = async (req, res) => {
    try {
        const assignment = await TeachingAssignment.findById(req.params.id).populate('sectionId');
        if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

        // Security check for HOD
        if (req.user.role === 'hod') {
            if (!assignment.sectionId || String(assignment.sectionId.departmentId) !== String(req.user.departmentId)) {
                return res.status(403).json({ message: 'Unauthorized: You can only delete assignments within your department.' });
            }
        }

        await TeachingAssignment.findByIdAndDelete(req.params.id);
        res.json({ message: 'Assignment removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createAssignment,
    getAssignments,
    getFacultyAssignments,
    deleteAssignment,
    getFacultyStats
};
