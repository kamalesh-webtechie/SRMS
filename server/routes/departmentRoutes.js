const express = require('express');
const router = express.Router();
const {
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment
} = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getDepartments)
    .post(protect, authorize('admin'), createDepartment);

router.route('/:id')
    .put(protect, authorize('admin'), updateDepartment)
    .delete(protect, authorize('admin'), deleteDepartment);

module.exports = router;
