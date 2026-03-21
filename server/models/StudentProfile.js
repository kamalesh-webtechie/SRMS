const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    registerNumber: {
        type: String,
        required: true,
        unique: true
    },
    department: {
        type: String,
        required: true
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: false // Temporal false to allow transition
    },
    semester: {
        type: Number,
        required: true,
        min: 1,
        max: 8
    },
    batch: {
        type: String, // e.g., "2023-2027"
        required: true
    },
    currentYear: {
        type: String,
        enum: ['I', 'II', 'III', 'IV'],
        default: 'I'
    },
    contactNumber: {
        type: String
    },
    whatsappNumber: {
        type: String
    },
    email: { // Optional override
        type: String
    },
    address: {
        type: String
    },
    bloodGroup: {
        type: String
    },
    dob: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: true
    },
    profilePhotoUrl: {
        type: String,
        default: ''
    },
    profilePhoto: {
        type: String // Legacy support
    },
    rollNumber: {
        type: String
    },
    guardianName: {
        type: String
    },
    guardianContact: {
        type: String
    },
    sectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
        required: false
    },
    hasNewResult: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Virtual for getting section details
studentProfileSchema.virtual('section', {
    ref: 'Section',
    localField: 'sectionId',
    foreignField: '_id',
    justOne: true
});

// Virtual for getting department details
studentProfileSchema.virtual('dept', {
    ref: 'Department',
    localField: 'departmentId',
    foreignField: '_id',
    justOne: true
});

// Apply virtuals
studentProfileSchema.set('toObject', { virtuals: true });
studentProfileSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
