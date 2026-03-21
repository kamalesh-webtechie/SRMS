const mongoose = require('mongoose');

const lateAttendanceReportSchema = new mongoose.Schema({
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Using sectionId as classId for clarity, OR could just be classId string if not relational
    // Requirement said: classId, subjectId, assignmentId...
    // I'll map sectionId to classId field name for stricter adherence or use sectionId
    // Prompt: classId
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
        required: true
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TeachingAssignment',
        required: false // Might be discretionary
    },
    attendanceDate: {
        type: Date,
        required: true
    },
    submittedAt: {
        type: Date,
        required: true
    },
    lateByMinutes: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        default: 'Late submission detected automatically'
    },
    status: {
        type: String,
        enum: ['PENDING', 'REVIEWED'],
        default: 'PENDING'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('LateAttendanceReport', lateAttendanceReportSchema);
