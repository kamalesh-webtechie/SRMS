const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   POST /api/announcements
// @desc    Create a new announcement (Admin only)
// @access  Private (Admin)
const upload = require('../middleware/announcementUpload');

// @route   POST /api/announcements
// @desc    Create a new announcement (Admin/HOD)
// @access  Private
router.post('/', protect, authorize('admin', 'hod'), upload.single('attachment'), async (req, res) => {
    try {
        const { title, message, targetRoles, priority, expiresAt } = req.body;

        // Validate targetRoles
        if (!targetRoles || targetRoles.length === 0) {
            return res.status(400).json({ message: 'Please select at least one target role' });
        }

        const attachmentUrl = req.file ? `/${req.file.path.replace(/\\/g, '/')}` : '';

        let roles = targetRoles;
        if (typeof targetRoles === 'string') {
            roles = [targetRoles];
        } else if (!Array.isArray(targetRoles)) {
            roles = [];
        }

        const announcement = new Announcement({
            title,
            message,
            targetRoles: roles,
            priority: priority || 'normal',
            expiresAt: expiresAt || null,
            expiresAt: expiresAt || null,
            attachmentUrl,
            createdBy: req.user._id
        });

        if (req.user.role === 'hod') {
            announcement.departmentId = req.user.departmentId;
        }

        await announcement.save();
        res.status(201).json(announcement);
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ message: 'Server error while creating announcement' });
    }
});

// @route   GET /api/announcements
// @desc    Get all announcements (Admin/HOD)
// @access  Private
router.get('/', protect, authorize('admin', 'hod'), async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === 'hod') {
            filter = { departmentId: req.user.departmentId };
        }
        const announcements = await Announcement.find(filter)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(announcements);
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ message: 'Server error while fetching announcements' });
    }
});

// @route   GET /api/announcements/my-announcements
// @desc    Get announcements for current user's role
// @access  Private
router.get('/my-announcements', protect, async (req, res) => {
    try {
        const userRole = req.user.role;
        const currentDate = new Date();

        let filter = {
            targetRoles: userRole,
            isActive: true,
            $or: [
                { expiresAt: null },
                { expiresAt: { $gt: currentDate } }
            ]
        };

        if (req.user.departmentId) {
            filter.$and = [
                {
                    $or: [
                        { departmentId: req.user.departmentId },
                        { departmentId: { $exists: false } },
                        { departmentId: null }
                    ]
                }
            ];
        }

        const announcements = await Announcement.find(filter)
            .populate('createdBy', 'name')
            .sort({ priority: -1, createdAt: -1 })
            .limit(10);

        res.json(announcements);
    } catch (error) {
        console.error('Error fetching user announcements:', error);
        res.status(500).json({ message: 'Server error while fetching announcements' });
    }
});

// @route   PUT /api/announcements/:id
// @desc    Update an announcement (Admin/HOD)
// @access  Private
router.put('/:id', protect, authorize('admin', 'hod'), upload.single('attachment'), async (req, res) => {
    try {
        const { title, message, targetRoles, priority, expiresAt } = req.body;

        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        if (req.user.role === 'hod' && String(announcement.departmentId) !== String(req.user.departmentId)) {
            return res.status(403).json({ message: 'Unauthorized to edit this announcement' });
        }

        // Update fields
        if (title) announcement.title = title;
        if (message) announcement.message = message;
        if (targetRoles) {
            let roles = targetRoles;
            if (typeof targetRoles === 'string') {
                roles = [targetRoles];
            } else if (!Array.isArray(targetRoles)) {
                roles = [];
            }
            announcement.targetRoles = roles;
        }
        if (priority) announcement.priority = priority;
        if (expiresAt !== undefined) announcement.expiresAt = expiresAt || null;

        if (req.file) {
            announcement.attachmentUrl = `/${req.file.path.replace(/\\/g, '/')}`;
        }

        await announcement.save();
        res.json(announcement);
    } catch (error) {
        console.error('Error updating announcement:', error);
        res.status(500).json({ message: 'Server error while updating announcement' });
    }
});

// @route   DELETE /api/announcements/:id
// @desc    Delete an announcement (Admin/HOD)
// @access  Private
router.delete('/:id', protect, authorize('admin', 'hod'), async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        if (req.user.role === 'hod' && String(announcement.departmentId) !== String(req.user.departmentId)) {
            return res.status(403).json({ message: 'Unauthorized to delete this announcement' });
        }

        await announcement.deleteOne();
        res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).json({ message: 'Server error while deleting announcement' });
    }
});

module.exports = router;
