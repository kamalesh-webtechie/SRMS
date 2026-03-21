const mongoose = require('mongoose');

const markSchema = new mongoose.Schema({
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    sectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
        required: true
    },
    semester: {
        type: Number,
        required: true
    },
    examType: {
        type: String,
        required: true,
        enum: ['Internal 1', 'Internal 2', 'Semester']
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['draft', 'submitted_to_hod', 'ready_to_publish', 'published'],
        default: 'draft'
    },
    maxMarks: {
        type: Number,
        default: 100
    },
    records: [
        {
            studentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'StudentProfile',
                required: true
            },
            marks: {
                type: Number,
                required: true,
                min: 0
            }
        }
    ]
}, {
    timestamps: true
});

// Unique index: facultyId + subjectId + sectionId + semester + examType
markSchema.index({ facultyId: 1, subjectId: 1, sectionId: 1, semester: 1, examType: 1 }, { unique: true });

module.exports = mongoose.model('Mark', markSchema);
