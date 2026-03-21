const mongoose = require('mongoose');

const resultPublicationSchema = new mongoose.Schema({
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    year: {
        type: String, // I, II, III, IV
        required: true,
        enum: ['I', 'II', 'III', 'IV']
    },
    examType: {
        type: String,
        required: true,
        enum: ['Internal 1', 'Internal 2', 'Semester']
    },
    publishedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    publishedAt: {
        type: Date,
        default: Date.now
    },
    isPublished: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Unique index: departmentId + year + examType
resultPublicationSchema.index({ departmentId: 1, year: 1, examType: 1 }, { unique: true });

module.exports = mongoose.model('ResultPublication', resultPublicationSchema);
