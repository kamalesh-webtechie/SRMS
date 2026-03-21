const express = require('express');
const router = express.Router();
const { analyzePerformance, mapImportHeaders } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/analyze', protect, analyzePerformance);
router.post('/map-headers', protect, mapImportHeaders);

module.exports = router;
