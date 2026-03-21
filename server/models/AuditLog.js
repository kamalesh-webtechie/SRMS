const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: ['CREATE_USER', 'UPDATE_USER', 'DELETE_USER', 'LOGIN', 'LOGOUT', 'UPDATE_MARKS', 'BULK_UPLOAD', 'UPDATE_ATTENDANCE']
    },
    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    actorName: {
        type: String,
    },
    targetEntity: {
        type: String, // e.g., 'Student', 'Marks', 'Course'
    },
    targetId: {
        type: String
    },
    details: {
        type: Object,
        default: {}
    },
    ipAddress: String,
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILURE'],
        default: 'SUCCESS'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
