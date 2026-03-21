const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    targetRoles: [{
        type: String,
        enum: ['admin', 'hod', 'faculty', 'student'],
        required: true
    }],
    priority: {
        type: String,
        enum: ['normal', 'high'],
        default: 'normal'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    expiresAt: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },
    attachmentUrl: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Index for efficient querying
announcementSchema.index({ targetRoles: 1, isActive: 1, expiresAt: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);
