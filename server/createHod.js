const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Department = require('./models/Department');

const createHod = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/srms');

        // Find a department
        const dept = await Department.findOne();
        if (!dept) {
            console.log('No departments found. Please create a department first as Admin.');
            process.exit(1);
        }

        // Check if an HOD exists for this department
        let hodUser = await User.findOne({ role: 'hod', departmentId: dept._id });

        if (hodUser) {
            console.log(`An HOD already exists for department ${dept.name}.`);
            console.log(`Email: ${hodUser.email}`);
            console.log('You can login with this email (if you know the password), or we can reset the password to "password123".');
            
            // For convenience, reset password to "password123"
            const salt = await bcrypt.genSalt(10);
            hodUser.password = await bcrypt.hash('password123', salt);
            await hodUser.save();
            console.log(`Password has been reset to: password123`);
        } else {
            console.log(`No HOD found for ${dept.name}, creating one...`);

            // Check if email already exists
            const email = `hod.${dept.code ? dept.code.toLowerCase() : 'dept'}@srms.edu`;
            const existingUser = await User.findOne({ email });
            
            if (existingUser) {
                 console.log(`User with email ${email} already exists but is not an HOD for this department.`);
                 process.exit(1);
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);

            hodUser = await User.create({
                name: `HOD - ${dept.name}`,
                email,
                password: hashedPassword,
                role: 'hod',
                departmentId: dept._id
            });

            // Set hodId on department
            dept.hodId = hodUser._id;
            await dept.save();

            console.log(`Successfully created HOD for ${dept.name}`);
            console.log(`Email: ${email}`);
            console.log(`Password: password123`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error creating HOD:', error);
        process.exit(1);
    }
};

createHod();
