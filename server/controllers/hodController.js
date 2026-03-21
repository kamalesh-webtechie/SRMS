const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const FacultyProfile = require('../models/FacultyProfile');
const TeachingAssignment = require('../models/TeachingAssignment');
const Subject = require('../models/Subject');

// @desc    Get HOD Dashboard Statistics
// @route   GET /api/hod/dashboard
// @access  Private/HOD
const getHodDashboardStats = async (req, res) => {
    try {
        if (req.user.role !== 'hod' || !req.user.departmentId) {
            return res.status(403).json({ message: 'Not authorized as HOD for a department' });
        }

        const departmentId = req.user.departmentId;
        
        // Fetch department to get the name string as well (for legacy records)
        const department = await User.findById(req.user._id).populate('departmentId');
        const deptName = department.departmentId ? department.departmentId.name : null;

        // Build robust query that checks for both ID and name string
        const buildDeptQuery = (id, name) => {
            const conditions = [{ departmentId: id }];
            if (name) {
                conditions.push({ department: name });
                
                // Add known variations for specific departments
                if (name === "Computer Science and Engineering") {
                    conditions.push({ department: "Computer Science Engineering" });
                }
            }
            return { $or: conditions };
        };

        const deptQuery = buildDeptQuery(departmentId, deptName);
        const subjectQuery = { 
            $or: [
                ...deptQuery.$or,
                { isCommon: true }
            ]
        };

        // Count total students in department
        const totalStudents = await StudentProfile.countDocuments(deptQuery);

        // Count total faculties in department
        const totalFaculties = await FacultyProfile.countDocuments(deptQuery);

        // Count total subjects in department
        const totalSubjects = await Subject.countDocuments(subjectQuery);

        res.json({
            success: true,
            data: {
                totalStudents,
                totalFaculties,
                totalSubjects
            }
        });
    } catch (error) {
        console.error('Error fetching HOD dashboard stats:', error);
        res.status(500).json({ message: 'Server error fetching HOD stats' });
    }
};

module.exports = {
    getHodDashboardStats
};
