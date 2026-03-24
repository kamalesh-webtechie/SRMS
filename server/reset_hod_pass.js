const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dotenv.config();

const findAndResetHOD = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const hods = await User.find({ role: 'hod' });
        if (hods.length > 0) {
            console.log(`Found ${hods.length} HOD user(s):`);
            for (const hod of hods) {
                console.log(`- Email: ${hod.email}, Name: ${hod.name}, Role: ${hod.role}`);
                
                // Reset password to password123 as requested by user
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('password123', salt);
                hod.password = hashedPassword;
                await hod.save();
                console.log(`  Password for ${hod.email} has been reset to: password123`);
            }
        } else {
            console.log('No HOD users found. Checking for any users to list their roles...');
            const users = await User.find().limit(5);
            users.forEach(u => console.log(`- ${u.email} (${u.role})`));
        }
        process.exit(0);
    } catch (err) {
        console.error('Operation failed:', err);
        process.exit(1);
    }
};

findAndResetHOD();
