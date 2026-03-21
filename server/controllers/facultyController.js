const User = require('../models/User');
const FacultyProfile = require('../models/FacultyProfile');
const Department = require('../models/Department');

// @desc    Register a new faculty member
// @route   POST /api/faculty
// @access  Private/Admin
const createFaculty = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            employeeId,
            department,
            designation,
            specialization
        } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Check if employee ID exists
        const empIdExists = await FacultyProfile.findOne({ employeeId });
        if (empIdExists) {
            return res.status(400).json({ message: 'Employee ID already exists' });
        }

        // Get department ObjectId
        const deptDoc = await Department.findOne({ name: department });
        if (!deptDoc) {
            return res.status(400).json({ message: 'Invalid department' });
        }

        const isHod = designation === 'Head of Department (HOD)' || designation === 'HOD';

        // Check if HOD already exists for this department
        if (isHod) {
            const existingHod = await User.findOne({ departmentId: deptDoc._id, role: 'hod' });
            if (existingHod) {
                return res.status(400).json({ message: `An HOD already exists for ${deptDoc.name}` });
            }
        }

        // Create User
        const user = await User.create({
            name,
            email,
            password,
            role: isHod ? 'hod' : 'faculty',
            departmentId: deptDoc._id
        });

        if (isHod && user) {
            deptDoc.hodId = user._id;
            await deptDoc.save();
        }

        if (user) {
            // Create Faculty Profile
            const profile = await FacultyProfile.create({
                user: user._id,
                employeeId,
                department,
                designation,
                specialization: specialization ? specialization.split(',').map(s => s.trim()) : []
            });

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profile
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all faculty members
// @route   GET /api/faculty
// @access  Private/Admin
const getAllFaculty = async (req, res) => {
    try {
        let filter = {};
        
        if (req.query.departmentId) {
            const dept = await Department.findById(req.query.departmentId);
            if (dept) {
                filter.department = dept.name; // Filter by string name
            } else {
                return res.status(404).json({ message: 'Department not found' });
            }
        }

        const faculty = await FacultyProfile.find(filter)
            .populate('user', 'name email status') // Get user details
            .sort({ createdAt: -1 });

        res.status(200).json(faculty);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
}

// @desc    Delete faculty
// @route   DELETE /api/faculty/:id
// @access  Private/Admin
const deleteFaculty = async (req, res) => {
    try {
        const profile = await FacultyProfile.findById(req.params.id);

        if (!profile) {
            return res.status(404).json({ message: 'Faculty profile not found' });
        }

        // Delete User first
        await User.findByIdAndDelete(profile.user);

        // Delete Profile
        await profile.deleteOne();

        res.status(200).json({ message: 'Faculty removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
}

// @desc    Update faculty
// @route   PUT /api/faculty/:id
// @access  Private/Admin
const updateFaculty = async (req, res) => {
    try {
        const {
            name,
            email,
            employeeId,
            department,
            designation,
            specialization
        } = req.body;

        const profile = await FacultyProfile.findById(req.params.id).populate('user');

        if (!profile) {
            return res.status(404).json({ message: 'Faculty profile not found' });
        }

        // Check if employee ID is being changed and if it already exists
        if (employeeId && employeeId !== profile.employeeId) {
            const empIdExists = await FacultyProfile.findOne({ employeeId });
            if (empIdExists) {
                return res.status(400).json({ message: 'Employee ID already exists' });
            }
            profile.employeeId = employeeId;
        }

        // Check if email is being changed and if it already exists
        if (email && email !== profile.user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: 'Email already exists' });
            }
            profile.user.email = email;
        }

        // Handle department change (need new ObjectId)
        let deptDoc = null;
        if (department && department !== profile.department) {
            deptDoc = await Department.findOne({ name: department });
            if (!deptDoc) return res.status(400).json({ message: 'Invalid department' });
            profile.user.departmentId = deptDoc._id;
            profile.department = department;
        } else {
            deptDoc = await Department.findOne({ name: profile.department });
        }

        // Handle designation/role change
        if (designation && designation !== profile.designation) {
            const isHod = designation === 'Head of Department (HOD)' || designation === 'HOD';
            const wasHod = profile.user.role === 'hod';

            if (isHod && !wasHod) {
                // Switching TO HOD
                const existingHod = await User.findOne({ departmentId: profile.user.departmentId, role: 'hod' });
                if (existingHod && String(existingHod._id) !== String(profile.user._id)) {
                    return res.status(400).json({ message: `An HOD already exists for this department` });
                }
                profile.user.role = 'hod';
                if (deptDoc) {
                    deptDoc.hodId = profile.user._id;
                    await deptDoc.save();
                }
            } else if (!isHod && wasHod) {
                // Switching FROM HOD to Faculty
                profile.user.role = 'faculty';
                if (deptDoc && String(deptDoc.hodId) === String(profile.user._id)) {
                    deptDoc.hodId = null;
                    await deptDoc.save();
                }
            }
            profile.designation = designation;
        }

        // Update user details
        if (name) profile.user.name = name;
        await profile.user.save();

        // Update profile details
        if (department) profile.department = department;
        if (designation) profile.designation = designation;
        if (specialization) {
            profile.specialization = typeof specialization === 'string'
                ? specialization.split(',').map(s => s.trim())
                : specialization;
        }

        await profile.save();

        // Populate and return updated profile
        const updatedProfile = await FacultyProfile.findById(profile._id).populate('user', 'name email status');

        res.status(200).json(updatedProfile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
}

module.exports = {
    createFaculty,
    getAllFaculty,
    deleteFaculty,
    updateFaculty
};
