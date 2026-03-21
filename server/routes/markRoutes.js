const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getFacultyAssignments,
    getSectionStudents,
    saveMarksEntry,
    lockMarks,
    getAdminMarksView,
    forwardMarksToAdmin
} = require('../controllers/marksController');

router.use(protect);

// Faculty routes
router.get('/faculty-assignments', authorize('faculty'), getFacultyAssignments);
router.post('/entry', authorize('faculty'), saveMarksEntry);
router.put('/:id/lock', authorize('faculty'), lockMarks);

// Shared/Admin/HOD routes
router.get('/students/:sectionId', authorize('faculty', 'hod', 'admin'), getSectionStudents);
router.get('/admin-view', authorize('faculty', 'hod', 'admin'), getAdminMarksView);

// HOD Routes
router.put('/:id/forward', authorize('hod'), forwardMarksToAdmin);

module.exports = router;
