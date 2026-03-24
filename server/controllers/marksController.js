const mongoose = require('mongoose');
const Mark = require('../models/Mark');
const TeachingAssignment = require('../models/TeachingAssignment');
const FacultyProfile = require('../models/FacultyProfile');
const StudentProfile = require('../models/StudentProfile');
const Section = require('../models/Section');
const Department = require('../models/Department');

// Helper to resolve department name/ID/code to ObjectId
const resolveDeptId = async (param) => {
    if (!param || param === 'undefined') return null;
    if (mongoose.Types.ObjectId.isValid(param)) return new mongoose.Types.ObjectId(param);
    
    const dept = await Department.findOne({
        $or: [
            { name: new RegExp(`^${param}$`, 'i') },
            { code: new RegExp(`^${param}$`, 'i') }
        ]
    });
    return dept ? dept._id : null;
};
const logAction = require('../utils/logger');

// @desc    Get assigned subjects and sections for faculty
// @route   GET /api/academic/marks/faculty-assignments
// @access  Private/Faculty
const getFacultyAssignments = async (req, res) => {
    try {
        const facultyProfile = await FacultyProfile.findOne({ user: req.user._id });
        if (!facultyProfile) {
            return res.status(404).json({ message: 'Faculty profile not found' });
        }

        const assignments = await TeachingAssignment.find({ facultyId: facultyProfile._id })
            .populate('subjectId', 'name code semester')
            .populate({
                path: 'sectionId',
                select: 'name batch year semester departmentId',
                populate: { path: 'departmentId', select: 'name code' }
            });

        res.status(200).json(assignments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get students for a section
// @route   GET /api/academic/marks/students/:sectionId
// @access  Private/Faculty or Admin
const getSectionStudents = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const students = await StudentProfile.find({ sectionId })
            .populate('user', 'name email')
            .sort({ registerNumber: 1 });
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Save marks entry (Faculty)
// @route   POST /api/academic/marks/entry
// @access  Private/Faculty
const saveMarksEntry = async (req, res) => {
    try {
        const { subjectId, sectionId, semester, examType, records, maxMarks } = req.body;
        const facultyId = req.user._id;

        // 1. Validate Teaching Assignment
        const facultyProfile = await FacultyProfile.findOne({ user: facultyId });
        const assignment = await TeachingAssignment.findOne({
            facultyId: facultyProfile._id,
            subjectId,
            sectionId
        });

        if (!assignment) {
            return res.status(403).json({ message: 'You are not assigned to this subject/section' });
        }

        // 2. Check if locked
        let markDoc = await Mark.findOne({
            facultyId,
            subjectId,
            sectionId,
            semester,
            examType
        });

        if (markDoc && markDoc.isLocked) {
            return res.status(403).json({ message: 'Marks are locked and cannot be edited' });
        }

        // 3. Save or Update
        if (!markDoc) {
            markDoc = new Mark({
                facultyId,
                subjectId,
                sectionId,
                semester,
                examType,
                maxMarks,
                records
            });
        } else {
            markDoc.records = records;
            markDoc.maxMarks = maxMarks;
        }

        await markDoc.save();

        // Audit Log
        await logAction({
            action: 'SAVE_MARKS',
            actorId: req.user._id,
            actorName: req.user.name,
            targetEntity: 'Mark',
            targetId: markDoc._id,
            details: { subjectId, sectionId, semester, examType, count: records.length },
            req
        });

        res.status(200).json({ message: 'Marks saved successfully', markDoc });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Lock marks (Faculty)
// @route   PUT /api/academic/marks/:id/lock
// @access  Private/Faculty
const lockMarks = async (req, res) => {
    try {
        const markDoc = await Mark.findById(req.params.id);
        if (!markDoc) return res.status(404).json({ message: 'Marks record not found' });

        // Verify ownership
        if (markDoc.facultyId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to lock these marks' });
        }

        markDoc.isLocked = true;
        markDoc.status = 'submitted_to_hod';
        await markDoc.save();

        // Audit Log
        await logAction({
            action: 'LOCK_MARKS',
            actorId: req.user._id,
            actorName: req.user.name,
            targetEntity: 'Mark',
            targetId: markDoc._id,
            details: { examType: markDoc.examType },
            req
        });

        res.status(200).json({ message: 'Marks locked successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get marks for Admin Management
// @route   GET /api/academic/marks/admin-view
// @access  Private/Admin
const getAdminMarksView = async (req, res) => {
    try {
        const { sectionId, semester, examType } = req.query;

        const query = {};
        if (sectionId && mongoose.Types.ObjectId.isValid(sectionId)) {
            query.sectionId = sectionId;
        }

        if (req.user && req.user.role === 'hod') {
            const resolvedDeptId = await resolveDeptId(req.user.departmentId);
            const sections = await Section.find({ 
                $or: [
                    { departmentId: resolvedDeptId },
                    // Fallback to name match if ID fetch is inconclusive
                    { department: new RegExp(`^${req.user.department}$`, 'i') }
                ]
            });
            const sectionIds = sections.map(s => s._id.toString());
            // If sectionId was provided, ensure it belongs to HOD's department
            if (query.sectionId && !sectionIds.includes(query.sectionId.toString())) {
                return res.status(403).json({ message: 'Access denied for this section' });
            }
            if (!query.sectionId) {
                query.sectionId = { $in: sectionIds };
            }
        }

        if (semester) query.semester = Number(semester);
        if (examType) query.examType = examType;

        if (Object.keys(query).length === 0) {
            return res.status(200).json([]);
        }

        const marks = await Mark.find(query)
            .populate('subjectId', 'name code')
            .populate('facultyId', 'name')
            .populate('records.studentId', 'registerNumber');

        res.status(200).json(marks);
    } catch (error) {
        console.error("Admin View Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Forward marks to Admin (HOD)
// @route   PUT /api/academic/marks/:id/forward
// @access  Private/HOD
const forwardMarksToAdmin = async (req, res) => {
    try {
        const markDoc = await Mark.findById(req.params.id);
        if (!markDoc) return res.status(404).json({ message: 'Marks record not found' });

        markDoc.status = 'ready_to_publish';
        await markDoc.save();

        res.status(200).json({ message: 'Marks forwarded to Admin' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getFacultyAssignments,
    getSectionStudents,
    saveMarksEntry,
    lockMarks,
    getAdminMarksView,
    forwardMarksToAdmin
};
