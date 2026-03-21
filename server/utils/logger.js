const AuditLog = require('../models/AuditLog');

const logAction = async ({ action, actorId, actorName, targetEntity, targetId, details, status = 'SUCCESS', req }) => {
    try {
        await AuditLog.create({
            action,
            actorId,
            actorName,
            targetEntity,
            targetId,
            details,
            status,
            ipAddress: req?.ip || 'unknown'
        });
    } catch (error) {
        console.error('Audit Log Error:', error);
    }
};

module.exports = logAction;
