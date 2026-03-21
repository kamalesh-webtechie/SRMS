const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    publishResultYearly,
    unpublishResult,
    getPublicationsSorted
} = require('../controllers/resultPublicationController');

router.use(protect);
router.use(authorize('admin'));

router.route('/')
    .get(getPublicationsSorted)
    .post(publishResultYearly);

router.put('/:id/unpublish', unpublishResult);

module.exports = router;
