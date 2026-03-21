const express = require('express');
const router = express.Router();
const {
    createSection,
    getSections,
    getSectionsByDepartment,
    updateSection,
    deleteSection
} = require('../controllers/sectionController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('admin', 'hod', 'faculty'), getSections) // Faculty might need to see sections
    .post(protect, authorize('admin', 'hod'), createSection);

// Route without semester
router.get('/by-department/:departmentId', protect, getSectionsByDepartment);
// Route with semester
router.get('/by-department/:departmentId/:semester', protect, getSectionsByDepartment);

router.route('/:id')
    .put(protect, authorize('admin', 'hod'), updateSection)
    .delete(protect, authorize('admin', 'hod'), deleteSection);

module.exports = router;
