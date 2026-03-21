const express = require('express');
const { getSettings, updateSettings, getServerTime } = require('../controllers/systemController');
const { protect, authorize, optionalProtect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/now', protect, getServerTime);

router.route('/')
    .get(optionalProtect, getSettings) // Allow public access so login page can show logo
    .put(protect, authorize('admin'), updateSettings);

module.exports = router;
