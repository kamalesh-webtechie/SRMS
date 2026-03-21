const express = require('express');
const {
    createStudent,
    getAllStudents,
    deleteStudent,
    updateStudent,
    bulkUploadStudents,
    updateStudentProfile,
    getStudentsBySection,
    deleteStudents,
    uploadProfilePhoto,
    removeProfilePhoto
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Bulk Upload (Admin)
router.post('/bulk', protect, authorize('admin'), bulkUploadStudents);
router.post('/delete-many', protect, authorize('admin'), deleteStudents);

// Get Students by Section
router.get('/by-section/:sectionId', protect, authorize('admin', 'faculty'), getStudentsBySection);

// Self Profile Update (Student)
// Self Profile Update (Student)
router.put('/profile', protect, authorize('student'), updateStudentProfile);
router.put('/profile/photo', protect, authorize('student'), upload.single('photo'), uploadProfilePhoto);
router.delete('/profile/photo', protect, authorize('student'), removeProfilePhoto);

router.route('/')
    .post(protect, authorize('admin'), upload.single('profilePhoto'), createStudent)
    .get(protect, authorize('admin', 'faculty', 'hod'), getAllStudents);

router.route('/:id')
    .put(protect, authorize('admin'), upload.single('profilePhoto'), updateStudent)
    .delete(protect, authorize('admin'), deleteStudent);

module.exports = router;
