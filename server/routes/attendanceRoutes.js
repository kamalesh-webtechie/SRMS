const express = require('express');
const router = express.Router();
const {
    markAttendance,
    getSubjectAttendance,
    getMyAttendance,
    getDailyAttendanceReport,
    getDepartmentDailySummary,
    getAttendanceStudentDetails,
    getFacultySubjectWiseAttendance
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('faculty', 'admin'), markAttendance);
router.get('/report/daily', protect, authorize('admin', 'hod'), getDailyAttendanceReport);
router.get('/report/daily-summary', protect, authorize('admin', 'hod'), getDepartmentDailySummary);
router.get('/report/student-details', protect, authorize('admin', 'hod'), getAttendanceStudentDetails);
router.get('/faculty/subject-wise', protect, authorize('faculty'), getFacultySubjectWiseAttendance);
router.get('/subject/:subjectId', protect, authorize('faculty', 'admin'), getSubjectAttendance);
router.get('/me', protect, getMyAttendance);

module.exports = router;
