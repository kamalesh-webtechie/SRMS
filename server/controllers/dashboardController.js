const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const FacultyProfile = require('../models/FacultyProfile');
const Department = require('../models/Department');

// @desc    Get Admin Dashboard Statistics
// @route   GET /api/dashboard/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
    try {
        const totalStudents = await StudentProfile.countDocuments();
        const totalFaculty = await FacultyProfile.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalDepartments = await Department.countDocuments();

        res.status(200).json({
            totalStudents,
            totalFaculty,
            totalUsers,
            totalDepartments,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getAdminStats,
};
