const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Department = require('../models/Department');
const Section = require('../models/Section');
const logAction = require('../utils/logger');

// @desc    Register a new student
// @route   POST /api/students
// @access  Private/Admin
const createStudent = async (req, res) => {
    try {
        const {
            name,
            email,
            registerNumber,
            department,
            semester,
            batch,
            contactNumber,
            guardianName,
            guardianContact,
            dob,
            sectionId,
            currentYear,
            gender,
            whatsappNumber,
            address,
            bloodGroup
        } = req.body;

        const profilePhotoUrl = req.file ? `/${req.file.path.replace(/\\/g, '/')}` : '';

        // Auto-generate password from DOB (format ddMMyyyy)
        if (!dob) {
            return res.status(400).json({ message: 'Date of Birth is required for password generation' });
        }

        let password = 'password123';
        try {
            const dateObj = new Date(dob);
            const d = String(dateObj.getDate()).padStart(2, '0');
            const m = String(dateObj.getMonth() + 1).padStart(2, '0');
            const y = dateObj.getFullYear();
            password = `${d}${m}${y}`;
        } catch (e) {
            console.error("Date parsing error for password", e);
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Check if Register Number exists
        const registerNumberExists = await StudentProfile.findOne({ registerNumber });
        if (registerNumberExists) {
            return res.status(400).json({ message: 'Register Number already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: 'student',
            username: registerNumber // username = register number
        });

        if (user) {
            // Create Student Profile
            const profile = await StudentProfile.create({
                user: user._id,
                registerNumber,
                department,
                semester,
                batch,
                contactNumber,
                guardianName,
                guardianContact,
                dob,
                currentYear,
                gender,
                profilePhotoUrl,
                profilePhoto: profilePhotoUrl, // Legacy support
                sectionId: sectionId || undefined, // Use undefined to skip if empty/null
                whatsappNumber,
                address,
                bloodGroup
            });

            // Audit
            await logAction({
                action: 'CREATE_USER',
                actorId: req.user._id,
                actorName: req.user.name,
                targetEntity: 'Student',
                targetId: user._id,
                details: { registerNumber, name },
                req
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
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

// @desc    Get all students
// @route   GET /api/students
// @access  Private/Admin/Faculty
const getAllStudents = async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === 'hod') {
            const dept = await Department.findById(req.user.departmentId);
            if (dept) filter.department = dept.name;
        } else if (req.query.departmentId) {
            const dept = await Department.findById(req.query.departmentId);
            if (dept) filter.department = dept.name;
        }

        const students = await StudentProfile.find(filter)
            .populate('user', 'name email status')
            .populate('section', 'name') // Populate virtual section
            .sort({ registerNumber: 1 })
            .lean();

        res.status(200).json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
}

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private/Admin
const deleteStudent = async (req, res) => {
    try {
        const profile = await StudentProfile.findById(req.params.id);

        if (!profile) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        if (profile.user) {
            await User.findByIdAndDelete(profile.user);
        }

        await profile.deleteOne();

        res.status(200).json({ message: 'Student removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
}

// @desc    Update student (Admin)
// @route   PUT /api/students/:id
// @access  Private/Admin
const updateStudent = async (req, res) => {
    try {
        const {
            name,
            email,
            registerNumber,
            department,
            semester,
            batch,
            contactNumber,
            guardianName,
            guardianContact,
            dob,
            sectionId,
            currentYear,
            gender,
            whatsappNumber,
            address,
            bloodGroup
        } = req.body;

        const profilePhotoUrl = req.file ? `/${req.file.path.replace(/\\/g, '/')}` : null;

        const profile = await StudentProfile.findById(req.params.id).populate('user');

        if (!profile) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        if (!profile.user) {
            // Handle orphan profile
            return res.status(500).json({ message: 'Integrity Error: User profile missing.' });
        }

        // Check for duplicate email (excluding current user)
        if (email && email !== profile.user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            profile.user.email = email;
        }

        // Update username if register number changes
        if (registerNumber && registerNumber !== profile.registerNumber) {
            // Check if register number is unique (already done below for profile, but need to check for User username too?)
            // Actually, I'll update the username here.
            const usernameExists = await User.findOne({ username: registerNumber });
            if (usernameExists && usernameExists._id.toString() !== profile.user._id.toString()) {
                return res.status(400).json({ message: 'Username/Register Number already taken' });
            }
            profile.user.username = registerNumber;
        }

        // Check for duplicate register number (excluding current)
        if (registerNumber && registerNumber !== profile.registerNumber) {
            const registerNumberExists = await StudentProfile.findOne({ registerNumber });
            if (registerNumberExists) {
                return res.status(400).json({ message: 'Register number already exists' });
            }
            profile.registerNumber = registerNumber;
        }

        // Update user details
        if (name) profile.user.name = name;
        await profile.user.save();

        // Update profile details
        if (department) profile.department = department;
        if (semester) profile.semester = semester;
        if (batch) profile.batch = batch;
        if (contactNumber) profile.contactNumber = contactNumber;
        if (guardianName) profile.guardianName = guardianName;
        if (guardianContact) profile.guardianContact = guardianContact;
        if (dob) profile.dob = dob;
        if (currentYear) profile.currentYear = currentYear;
        if (gender) profile.gender = gender;
        if (whatsappNumber) profile.whatsappNumber = whatsappNumber;
        if (address) profile.address = address;
        if (bloodGroup) profile.bloodGroup = bloodGroup;
        if (profilePhotoUrl) {
            profile.profilePhotoUrl = profilePhotoUrl;
            profile.profilePhoto = profilePhotoUrl;
        }

        // Handle sectionId carefully
        if (sectionId) {
            profile.sectionId = sectionId;
        } else if (sectionId === '' || sectionId === null) {
            profile.sectionId = undefined; // Unset if explicitly cleared
        }

        await profile.save();

        const updatedProfile = await StudentProfile.findById(profile._id)
            .populate('user', 'name email status')
            .populate('section', 'name');

        res.status(200).json(updatedProfile);
    } catch (error) {
        console.error("Update Student Error:", error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

// @desc    Update student profile (Self update for student)
// @route   PUT /api/students/profile
// @access  Private/Student
const updateStudentProfile = async (req, res) => {
    try {
        const student = await StudentProfile.findOne({ user: req.user._id }).populate('section', 'name');
        if (!student) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        const { address, bloodGroup, dob, profilePhoto, email, whatsappNumber } = req.body;

        if (address) student.address = address;
        if (bloodGroup) student.bloodGroup = bloodGroup;
        if (dob) student.dob = dob;
        if (profilePhoto) student.profilePhoto = profilePhoto;
        if (email) student.email = email;
        if (whatsappNumber) student.whatsappNumber = whatsappNumber;

        await student.save();
        res.status(200).json(student);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
}

// @desc    Bulk upload students (Admin)
// @route   POST /api/students/bulk
// @access  Private/Admin
const bulkUploadStudents = async (req, res) => {
    console.log(`Starting bulk upload for ${req.body?.length} students...`);
    console.time('bulkUpload');
    let createdCount = 0;
    let errors = [];

    try {
        const studentsData = req.body;

        if (!Array.isArray(studentsData)) {
            console.timeEnd('bulkUpload');
            return res.status(400).json({ message: 'Invalid data format. Expected array.' });
        }

        for (let i = 0; i < studentsData.length; i++) {
            const data = studentsData[i];
            try {
                if (i % 50 === 0) console.log(`Processing student ${i + 1}/${studentsData.length}...`);

                // Normalize and trim all input data
                data.email = data.email ? String(data.email).trim() : '';
                data.name = data.name ? String(data.name).trim() : '';
                data.registerNumber = data.registerNumber ? String(data.registerNumber).trim() : '';
                data.batch = data.batch ? String(data.batch).trim() : '';
                data.department = data.department ? String(data.department).trim() : '';
                data.section = data.section ? String(data.section).trim() : '';

                if (!data.email || !data.registerNumber) {
                    errors.push(`Row ${i + 1} missing required Email or Register Number.`);
                    continue;
                }

                // Check duplicate email
                const exists = await User.findOne({ email: data.email });
                if (exists) {
                    errors.push(`Email ${data.email} already exists`);
                    continue;
                }

                // Find Department (Case-insensitive)
                const deptName = data.department;
                const dept = await Department.findOne({
                    name: { $regex: new RegExp(`^${deptName}$`, 'i') }
                });

                if (!dept) {
                    errors.push(`Department '${data.department}' not found for ${data.name || data.email}.`);
                    continue;
                }

                // Find Section (Case-insensitive)
                const sectionName = data.section;
                const section = await Section.findOne({
                    departmentId: dept._id,
                    batch: data.batch,
                    name: { $regex: new RegExp(`^${sectionName}$`, 'i') }
                });

                if (!section) {
                    errors.push(`Section '${data.section}' in batch '${data.batch}' not found for department '${dept.name}'`);
                    continue;
                }

                // Password Generation Logic for Bulk
                let password = 'password123';
                if (data.dob) {
                    try {
                        const dateObj = new Date(data.dob);
                        if (!isNaN(dateObj.getTime())) {
                            const d = String(dateObj.getDate()).padStart(2, '0');
                            const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                            const y = dateObj.getFullYear();
                            password = `${d}${m}${y}`;
                        }
                    } catch (e) { }
                }

                const user = await User.create({
                    name: data.name,
                    email: data.email,
                    password: password,
                    role: 'student',
                    username: data.registerNumber
                });

                try {
                    // Extract and normalize gender
                    let normalizedGender = 'Other';
                    const inputGender = data.gender ? String(data.gender).trim().toLowerCase() : '';
                    if (['male', 'm'].includes(inputGender)) normalizedGender = 'Male';
                    else if (['female', 'f'].includes(inputGender)) normalizedGender = 'Female';
                    else if (inputGender === 'other') normalizedGender = 'Other';

                    await StudentProfile.create({
                        user: user._id,
                        registerNumber: data.registerNumber,
                        rollNumber: data.rollNumber,
                        department: dept.name,
                        semester: section.semester,
                        sectionId: section._id,
                        batch: data.batch,
                        contactNumber: data.contactNumber,
                        dob: data.dob,
                        gender: normalizedGender,
                        currentYear: section.year || 'I',
                        whatsappNumber: data.whatsappNumber ? String(data.whatsappNumber).trim() : '',
                        address: data.address ? String(data.address).trim() : '',
                        bloodGroup: data.bloodGroup ? String(data.bloodGroup).trim() : '',
                        guardianName: data.guardianName ? String(data.guardianName).trim() : '',
                        guardianContact: data.guardianContact ? String(data.guardianContact).trim() : '',
                    });
                    createdCount++;
                } catch (profileError) {
                    // Rollback user creation if profile fails
                    await User.findByIdAndDelete(user._id);
                    throw profileError;
                }
            } catch (err) {
                console.error(`Error processing row ${i + 1} (${data.email || 'unknown'}):`, err.message);
                errors.push(`Failed for ${data.email || 'unknown'}: ${err.message}`);
            }
        }

        // Audit Bulk Action
        try {
            await logAction({
                action: 'BULK_UPLOAD',
                actorId: req.user?._id || 'unknown',
                actorName: req.user?.name || 'unknown',
                targetEntity: 'Student',
                details: { count: createdCount, errorCount: errors.length },
                req
            });
        } catch (auditError) {
            console.error('Audit Logging Failed:', auditError);
        }

        console.timeEnd('bulkUpload');
        console.log(`Bulk upload complete. Created: ${createdCount}, Errors: ${errors.length}`);
        res.status(200).json({ message: `Processed. Created: ${createdCount}. Errors: ${errors.length}`, errors });

    } catch (error) {
        if (typeof console.timeEnd === 'function') {
            try { console.timeEnd('bulkUpload'); } catch (e) { }
        }
        console.error('CRITICAL BULK UPLOAD ERROR:', error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

// @desc    Delete multiple students
// @route   POST /api/students/delete-many
// @access  Private/Admin
const deleteStudents = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No student IDs provided' });
        }

        // Find profiles to get user IDs
        const profiles = await StudentProfile.find({ _id: { $in: ids } });
        const userIds = profiles.map(p => p.user).filter(id => id);

        // Delete Users
        if (userIds.length > 0) {
            await User.deleteMany({ _id: { $in: userIds } });
        }

        // Delete Profiles
        const result = await StudentProfile.deleteMany({ _id: { $in: ids } });

        res.status(200).json({ message: `${result.deletedCount} students removed` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
}

// @desc    Get students by section
// @route   GET /api/students/by-section/:sectionId
// @access  Private/Faculty/Admin
const getStudentsBySection = async (req, res) => {
    try {
        const students = await StudentProfile.find({ sectionId: req.params.sectionId })
            .populate('user', 'name email status')
            .populate('section', 'name semester batch')
            .sort({ registerNumber: 1 })
            .lean();

        res.status(200).json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
}

// @desc    Upload profile photo
// @route   PUT /api/students/profile/photo
// @access  Private/Student
const uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a file' });
        }

        const profilePhotoUrl = `/${req.file.path.replace(/\\/g, '/')}`; // Normalize path

        const student = await StudentProfile.findOne({ user: req.user._id });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }

        student.profilePhotoUrl = profilePhotoUrl;
        // Optionally update legacy field too
        student.profilePhoto = profilePhotoUrl;

        await student.save();

        res.status(200).json({
            success: true,
            profilePhotoUrl
        });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ success: false, message: 'Profile photo upload failed' });
    }
}

// @desc    Remove profile photo
// @route   DELETE /api/students/profile/photo
// @access  Private/Student
const removeProfilePhoto = async (req, res) => {
    try {
        const student = await StudentProfile.findOne({ user: req.user._id });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }

        student.profilePhotoUrl = '';
        student.profilePhoto = ''; // Legacy

        await student.save();

        res.status(200).json({
            success: true,
            message: 'Profile photo removed'
        });
    } catch (error) {
        console.error("Remove Photo Error:", error);
        res.status(500).json({ success: false, message: 'Failed to remove profile photo' });
    }
}

module.exports = {
    createStudent,
    getAllStudents,
    deleteStudent,
    deleteStudents,
    updateStudent,
    updateStudentProfile,
    bulkUploadStudents,
    getStudentsBySection,
    uploadProfilePhoto,
    removeProfilePhoto
};
