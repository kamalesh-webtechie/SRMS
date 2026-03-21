const express = require('express');
const { createFaculty, getAllFaculty, deleteFaculty, updateFaculty } = require('../controllers/facultyController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .post(protect, authorize('admin'), createFaculty)
    .get(protect, authorize('admin', 'hod'), getAllFaculty);

router.route('/:id')
    .put(protect, authorize('admin'), updateFaculty)
    .delete(protect, authorize('admin'), deleteFaculty);

module.exports = router;
