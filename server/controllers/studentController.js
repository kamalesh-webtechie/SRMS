const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Department = require('../models/Department');
const Section = require('../models/Section');
const logAction = require('../utils/logger');
const bcrypt = require('bcryptjs');

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
    console.log(`Starting HIGH-SPEED bulk upload for ${studentsData?.length} students...`);
    console.time('highSpeedBulkUpload');
    
    if (!Array.isArray(studentsData) || studentsData.length === 0) {
        console.timeEnd('highSpeedBulkUpload');
        return res.status(400).json({ message: 'Invalid data format. Expected non-empty array.' });
    }

    const errors = [];
    const validRows = [];
    const processedEmails = new Set();
    const processedRegNos = new Set();
    let createdCount = 0;

    try {
        // 1. Pre-fetch ALL Departments and Sections (Fast Lookup)
        const [allDepts, allSections] = await Promise.all([
            Department.find({}).lean(),
            Section.find({ isActive: true }).lean()
        ]);

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

        const findSection = (deptId, batch, name) => {
            if (!deptId || !batch || !name) return null;
            const normalizedName = String(name).trim().toLowerCase();
            const normalizedBatch = String(batch).trim().replace(/\s/g, '').toLowerCase();
            return allSections.find(s => {
                const sBatch = s.batch.replace(/\s/g, '').toLowerCase();
                return s.departmentId.toString() === deptId.toString() && 
                       sBatch === normalizedBatch && 
                       s.name.toLowerCase() === normalizedName;
            });
        };

        // 2. Pre-fetch existing Users/Profiles to check duplicates in ONE query
        const emailsToCheck = studentsData.map(d => String(d.email || '').trim().toLowerCase()).filter(e => e);
        const regNosToCheck = studentsData.map(d => String(d.registerNumber || '').trim()).filter(r => r);

        const [existingUsers, existingProfiles] = await Promise.all([
            User.find({ 
                $or: [
                    { email: { $in: emailsToCheck } },
                    { username: { $in: regNosToCheck } }
                ] 
            }).select('email username').lean(),
            StudentProfile.find({ registerNumber: { $in: regNosToCheck } }).select('registerNumber').lean()
        ]);

        const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));
        const existingUsernames = new Set(existingUsers.map(u => u.username));
        const existingRegNos = new Set(existingProfiles.map(p => p.registerNumber));

        // 3. Validation and Normalization Phase
        const salt = await bcrypt.genSalt(10);
        const hashCache = new Map();

        for (let i = 0; i < studentsData.length; i++) {
            const data = studentsData[i];
            const rowIndex = i + 1;

            // Normalize
            const name = String(data.name || '').trim();
            const regNo = String(data.registerNumber || '').trim();
            const rollNo = String(data.rollNumber || '').trim();
            const dobOrig = data.dob;
            const batch = String(data.batch || '').trim();
            const deptName = String(data.department || '').trim();
            const sectionName = String(data.section || '').trim();
            let email = String(data.email || '').trim().toLowerCase();

            // Mandatory Field Check
            if (!regNo || !name || !rollNo || !dobOrig || !deptName || !sectionName || !batch) {
                const missing = [];
                if (!name) missing.push('Name');
                if (!regNo) missing.push('Register Number');
                if (!rollNo) missing.push('Roll Number');
                if (!dobOrig) missing.push('Date of Birth');
                if (!deptName) missing.push('Department');
                if (!sectionName) missing.push('Section');
                if (!batch) missing.push('Batch');
                errors.push(`Row ${rowIndex}: Missing mandatory fields: ${missing.join(', ')}`);
                continue;
            }

            // Fallback Email
            if (!email) email = `${regNo.toLowerCase()}@srms.edu`;

            // Duplicate Check (Internal to this file)
            if (processedEmails.has(email) || processedRegNos.has(regNo)) {
                errors.push(`Row ${rowIndex}: Duplicate Email or Register Number within this file.`);
                continue;
            }

            // Duplicate Check (Against Database)
            if (existingEmails.has(email) || existingUsernames.has(regNo) || existingRegNos.has(regNo)) {
                errors.push(`Row ${rowIndex}: Email or Register Number already exists in the system.`);
                continue;
            }

            // Academic Lookups
            const dept = findDept(deptName);
            if (!dept) {
                errors.push(`Row ${rowIndex}: Department '${deptName}' not found.`);
                continue;
            }

            const section = findSection(dept._id, batch, sectionName);
            if (!section) {
                errors.push(`Row ${rowIndex}: Section '${sectionName}' for batch '${batch}' not found in ${dept.name}.`);
                continue;
            }

            // Map and Save for Insert Phase
            processedEmails.add(email);
            processedRegNos.add(regNo);

            validRows.push({
                rowIndex,
                userData: {
                    name,
                    email,
                    username: regNo,
                    role: 'student',
                    dob: dobOrig // Needed for password generation
                },
                profileData: {
                    registerNumber: regNo,
                    rollNumber: rollNo,
                    department: dept.name,
                    departmentId: dept._id,
                    semester: section.semester,
                    sectionId: section._id,
                    batch,
                    dob: dobOrig,
                    currentYear: section.year || 'I',
                    gender: (data.gender && ['male', 'm'].includes(String(data.gender).trim().toLowerCase())) 
                        ? 'Male' 
                        : (data.gender && ['female', 'f'].includes(String(data.gender).trim().toLowerCase()))
                            ? 'Female'
                            : 'Other',
                    whatsappNumber: String(data.whatsappNumber || '').trim(),
                    address: String(data.address || '').trim(),
                    bloodGroup: String(data.bloodGroup || '').trim(),
                    guardianName: String(data.guardianName || '').trim(),
                    guardianContact: String(data.guardianContact || '').trim(),
                    contactNumber: String(data.contactNumber || '').trim(),
                }
            });
        }

        if (validRows.length === 0) {
            console.timeEnd('highSpeedBulkUpload');
            return res.status(200).json({ 
                message: `No rows were valid for import. Errors: ${errors.length}`, 
                errors, 
                createdCount: 0, 
                errorCount: errors.length 
            });
        }

        // 4. Batch Password Hashing
        console.log(`Hashing passwords for ${validRows.length} students...`);
        for (const row of validRows) {
            let password = 'password123';
            if (row.userData.dob) {
                try {
                    const dateObj = new Date(row.userData.dob);
                    if (!isNaN(dateObj.getTime())) {
                        const d = String(dateObj.getDate()).padStart(2, '0');
                        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                        const y = dateObj.getFullYear();
                        password = `${d}${m}${y}`;
                    }
                } catch (e) { }
            }

            if (hashCache.has(password)) {
                row.userData.password = hashCache.get(password);
            } else {
                const hashedPassword = await bcrypt.hash(password, salt);
                hashCache.set(password, hashedPassword);
                row.userData.password = hashedPassword;
            }
        }

        // 5. Bulk Insert Phase
        console.log(`Inserting ${validRows.length} users...`);
        let createdUsers = [];
        try {
            createdUsers = await User.insertMany(validRows.map(r => r.userData), { ordered: false });
        } catch (e) {
            if (e.name === 'BulkWriteError' || e.name === 'MongoBulkWriteError') {
                const createdIds = e.result.insertedIds ? Object.values(e.result.insertedIds) : [];
                createdUsers = await User.find({ _id: { $in: createdIds } }).select('username _id').lean();
            } else throw e;
        }

        // Map User IDs back to Profile Data
        const userMap = new Map(); // username -> _id
        createdUsers.forEach(u => userMap.set(u.username, u._id));

        const profilesToInsert = validRows
            .filter(r => userMap.has(r.userData.username))
            .map(r => ({
                ...r.profileData,
                user: userMap.get(r.userData.username)
            }));

        console.log(`Inserting ${profilesToInsert.length} profiles...`);
        let createdProfilesCount = 0;
        try {
            const result = await StudentProfile.insertMany(profilesToInsert, { ordered: false });
            createdProfilesCount = result.length;
        } catch (e) {
            if (e.name === 'BulkWriteError' || e.name === 'MongoBulkWriteError') {
                createdProfilesCount = e.result.nInserted || 0;
            } else throw e;
        }

        createdCount = createdProfilesCount;

        // 6. Audit Logging
        try {
            await logAction({
                action: 'BULK_UPLOAD_HIGH_SPEED',
                actorId: req.user?._id || 'unknown',
                actorName: req.user?.name || 'unknown',
                targetEntity: 'Student',
                details: { count: createdCount, errorCount: errors.length },
                req
            });
        } catch (auditError) {
            console.error('Audit Logging Failed:', auditError);
        }

        console.timeEnd('highSpeedBulkUpload');
        res.status(200).json({ 
            message: `High-speed import complete. Created: ${createdCount}. Errors: ${errors.length}`, 
            errors,
            createdCount,
            errorCount: errors.length
        });

    } catch (error) {
        console.timeEnd('highSpeedBulkUpload');
        console.error('CRITICAL HIGH-SPEED BULK UPLOAD ERROR:', error);
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
