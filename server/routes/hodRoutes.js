const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getHodDashboardStats } = require('../controllers/hodController');

router.use(protect);
router.use(authorize('hod'));

router.get('/dashboard', getHodDashboardStats);

module.exports = router;
