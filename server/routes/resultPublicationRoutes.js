const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    publishResultYearly,
    unpublishResult,
    getPublicationsSorted,
    getPublicationPreview
} = require('../controllers/resultPublicationController');

router.use(protect);
router.use(authorize('admin'));

router.get('/preview', getPublicationPreview);

router.route('/')
    .get(getPublicationsSorted)
    .post(publishResultYearly);

router.put('/:id/unpublish', unpublishResult);

module.exports = router;
