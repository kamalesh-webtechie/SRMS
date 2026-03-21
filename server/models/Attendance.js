const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentProfile',
        required: true
    },
    studentId: { // Duplicate for direct filtering as per req
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentProfile'
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    subjectId: { // Duplicate for direct filtering as per req
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    },
    sectionId: { // Often referred to as classId in requirements
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
        required: true
    },
    classId: { // For consistency with requirement
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section'
    },
    date: { // Existing date field
        type: Date,
        required: true
    },
    attendanceDate: { // Normalized date field requested for reporting
        type: Date,
        required: true
    },
    department: { // Stored directly for reporting speed as per req
        type: String,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Excused', 'On-duty'],
        required: true
    },
    remarks: {
        type: String,
        trim: true
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Faculty
        required: true
    },
    facultyId: { // Direct field for faculty visibility
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignmentId: { // Linked assignment for audit trail
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TeachingAssignment'
    }
}, {
    timestamps: true
});

// Composite index to prevent duplicate attendance for same student, subject, and date
attendanceSchema.index({ student: 1, subject: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
