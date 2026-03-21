const express = require('express');
const router = express.Router();
const {
    createAssignment,
    getAssignments,
    getFacultyAssignments,
    deleteAssignment,
    getFacultyStats
} = require('../controllers/assignmentController'); // Fixed import path
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, authorize('admin', 'hod'), createAssignment)
    .get(protect, authorize('admin', 'hod'), getAssignments);

router.get('/faculty/stats', protect, getFacultyStats);
router.get('/faculty/:facultyId', protect, getFacultyAssignments);
router.delete('/:id', protect, authorize('admin', 'hod'), deleteAssignment);

module.exports = router;
