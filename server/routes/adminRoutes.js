const express = require('express');
const router = express.Router();
const { getLateReports } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/late-attendance-reports', protect, authorize('admin'), getLateReports);

module.exports = router;
