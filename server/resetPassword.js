const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const resetStudentPassword = async (email, newPassword) => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found');
            process.exit(1);
        }

        user.password = newPassword;
        await user.save();

        console.log(`Password for ${email} reset successfully to ${newPassword}`);
        process.exit(0);
    } catch (error) {
        console.error('Error resetting password:', error);
        process.exit(1);
    }
};

const email = process.argv[2] || 'teststudent@test.com';
const password = process.argv[3] || 'Password123!';

resetStudentPassword(email, password);
