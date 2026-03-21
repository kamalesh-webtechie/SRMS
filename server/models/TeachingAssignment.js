const mongoose = require('mongoose');

const teachingAssignmentSchema = new mongoose.Schema({
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FacultyProfile',
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
        required: true,
        min: 1,
        max: 8
    },
    academicYear: {
        type: String, // e.g., "2023-2024"
        required: true
    }
}, {
    timestamps: true
});

// Unique index to prevent duplicate assignments for the same academic year
// Meaning a faculty can't be assigned the SAME subject + section TWICE in the SAME year.
teachingAssignmentSchema.index({ facultyId: 1, subjectId: 1, sectionId: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('TeachingAssignment', teachingAssignmentSchema);
