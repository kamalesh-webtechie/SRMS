const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    createTimeTable,
    getTimeTables,
    getStudentTimeTable,
    getFacultyTimeTable,
    updateTimeTable,
    deleteTimeTable,
    bulkUploadTimeTable
} = require('../controllers/timetableController');

// Admin & HOD routes
router.post('/create', protect, authorize('admin', 'hod'), createTimeTable);
router.post('/bulk', protect, authorize('admin', 'hod'), bulkUploadTimeTable);
router.get('/', protect, authorize('admin', 'hod'), getTimeTables);
router.put('/update/:id', protect, authorize('admin', 'hod'), updateTimeTable);
router.delete('/delete/:id', protect, authorize('admin', 'hod'), deleteTimeTable);

// Student route
router.get('/student', protect, authorize('student'), getStudentTimeTable);

// Faculty route
router.get('/faculty', protect, authorize('faculty'), getFacultyTimeTable);

module.exports = router;
