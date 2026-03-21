const express = require('express');
const {
    createSubject,
    getSubjects,
    updateSubject,
    deleteSubject,
    updateMarks,
    getStudentMarks,
    publishResults,
    getBatchMarks,
    getStudentResultSheet
} = require('../controllers/academicController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Subjects
router.route('/subjects')
    .post(protect, authorize('admin'), createSubject)
    .get(protect, getSubjects);

router.route('/subjects/:id')
    .put(protect, authorize('admin'), updateSubject)
    .delete(protect, authorize('admin'), deleteSubject);

// Marks
router.route('/marks/batch')
    .get(protect, getBatchMarks);

router.route('/marks')
    .post(protect, authorize('admin', 'faculty'), updateMarks);

router.route('/marks/:studentId')
    .get(protect, getStudentMarks);

// Publish
router.put('/publish', protect, authorize('admin'), publishResults);

// Full Result Sheet (Student Specific)
router.get('/results/student/:id', protect, getStudentResultSheet);

module.exports = router;
