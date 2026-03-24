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

        const { 
            address, bloodGroup, dob, profilePhoto, email, 
            whatsappNumber, contactNumber, guardianName, guardianContact 
        } = req.body;

        if (address !== undefined) student.address = address;
        if (bloodGroup !== undefined) student.bloodGroup = bloodGroup;
        if (dob !== undefined) student.dob = dob;
        if (profilePhoto !== undefined) student.profilePhoto = profilePhoto;
        if (email !== undefined) student.email = email;
        if (whatsappNumber !== undefined) student.whatsappNumber = whatsappNumber;
        if (contactNumber !== undefined) student.contactNumber = contactNumber;
        if (guardianName !== undefined) student.guardianName = guardianName;
        if (guardianContact !== undefined) student.guardianContact = guardianContact;

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
    const studentsData = req.body;
    console.log(`Starting optimized bulk upload for ${studentsData?.length} students...`);
    console.time('bulkUpload');
    
    if (!Array.isArray(studentsData)) {
        console.timeEnd('bulkUpload');
        return res.status(400).json({ message: 'Invalid data format. Expected array.' });
    }

    let createdCount = 0;
    let errors = [];

    try {
        // 1. Pre-fetch ALL Departments and Sections for fast memory lookup
        const [allDepts, allSections] = await Promise.all([
            Department.find({}).lean(),
            Section.find({ isActive: true }).lean()
        ]);

        console.log(`Pre-fetched ${allDepts.length} departments and ${allSections.length} active sections.`);

        // Helper to find department by name or code (extremely lenient)
        const findDept = (input) => {
            if (!input) return null;
            const normalized = String(input).trim().toLowerCase();
            return allDepts.find(d => 
                d.name.toLowerCase() === normalized || 
                (d.code && d.code.toLowerCase() === normalized) ||
                normalized.includes(d.name.toLowerCase()) ||
                d.name.toLowerCase().includes(normalized)
            );
        };

        // Helper to find section (lenient with batch format)
        const findSection = (deptId, batch, name) => {
            if (!deptId || !batch || !name) return null;
            const normalizedName = String(name).trim().toLowerCase();
            const normalizedBatch = String(batch).trim().replace(/\s/g, '').toLowerCase(); // Remove all spaces
            
            return allSections.find(s => {
                const sBatch = s.batch.replace(/\s/g, '').toLowerCase();
                return s.departmentId.toString() === deptId.toString() && 
                       sBatch === normalizedBatch && 
                       s.name.toLowerCase() === normalizedName;
            });
        };

        // 2. Process students in parallel chunks
        const CHUNK_SIZE = 10;
        for (let i = 0; i < studentsData.length; i += CHUNK_SIZE) {
            const chunk = studentsData.slice(i, i + CHUNK_SIZE);
            
            const chunkPromises = chunk.map(async (data, index) => {
                const rowIndex = i + index + 1;
                try {
                    // Normalize and trim
                    data.email = data.email ? String(data.email).trim() : '';
                    data.name = data.name ? String(data.name).trim() : '';
                    data.registerNumber = data.registerNumber ? String(data.registerNumber).trim() : '';
                    data.batch = data.batch ? String(data.batch).trim() : '';
                    data.department = data.department ? String(data.department).trim() : '';
                    data.section = data.section ? String(data.section).trim() : '';

                    if (!data.email || !data.registerNumber) {
                        return { error: `Row ${rowIndex}: Missing Email (${data.email || 'N/A'}) or Register Number (${data.registerNumber || 'N/A'}).` };
                    }

                    // Validation Lookups
                    const dept = findDept(data.department);
                    if (!dept) {
                        const available = allDepts.map(d => `${d.name} (${d.code || 'No Code'})`).join(', ');
                        return { error: `Row ${rowIndex}: Department '${data.department}' not found. Available: [${available}]` };
                    }

                    const section = findSection(dept._id, data.batch, data.section);
                    if (!section) {
                        const deptSections = allSections.filter(s => s.departmentId.toString() === dept._id.toString());
                        const availableSections = deptSections.map(s => `${s.name} in ${s.batch}`).join(', ');
                        return { error: `Row ${rowIndex}: Section '${data.section}' for batch '${data.batch}' not found in ${dept.name}. Available for this dept: [${availableSections || 'None'}]` };
                    }

                    // Check duplicate email or register number (username)
                    const existingUser = await User.findOne({ 
                        $or: [
                            { email: data.email },
                            { username: data.registerNumber }
                        ] 
                    });
                    
                    if (existingUser) {
                        const conflict = existingUser.email === data.email ? 'Email' : 'Register Number';
                        return { error: `Row ${rowIndex}: ${conflict} already exists for another user.` };
                    }

                    // Password Generation
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

                    // Create User
                    const user = await User.create({
                        name: data.name,
                        email: data.email,
                        password: password,
                        role: 'student',
                        username: data.registerNumber
                    });

                    try {
                        let normalizedGender = 'Other';
                        const inputGender = data.gender ? String(data.gender).trim().toLowerCase() : '';
                        if (['male', 'm'].includes(inputGender)) normalizedGender = 'Male';
                        else if (['female', 'f'].includes(inputGender)) normalizedGender = 'Female';

                        await StudentProfile.create({
                            user: user._id,
                            registerNumber: data.registerNumber,
                            rollNumber: data.rollNumber,
                            department: dept.name,
                            departmentId: dept._id,
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
                        return { success: true };
                    } catch (profileError) {
                        await User.findByIdAndDelete(user._id);
                        return { error: `Row ${rowIndex}: Profile error - ${profileError.message}` };
                    }
                } catch (err) {
                    console.error(`Row ${rowIndex} error:`, err);
                    return { error: `Row ${rowIndex}: Server error during processing.` };
                }
            });

            const chunkResults = await Promise.all(chunkPromises);
            chunkResults.forEach(res => {
                if (res.success) createdCount++;
                if (res.error) {
                    errors.push(res.error);
                    console.warn(res.error);
                }
            });
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
        console.log(`Optimized Bulk upload complete. Created: ${createdCount}, Errors: ${errors.length}`);
        res.status(200).json({ 
            message: `Processed. Created: ${createdCount}. Errors: ${errors.length}`, 
            errors,
            createdCount,
            errorCount: errors.length
        });

    } catch (error) {
        console.timeEnd('bulkUpload');
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
