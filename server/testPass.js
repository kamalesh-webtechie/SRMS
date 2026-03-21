const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const testPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'admin@srms.edu' }).select('+password');
        if (!user) {
            console.log('Admin user not found');
            process.exit(1);
        }

        const passwordsToTest = ['adminpassword123', 'adminpassword123 ', 'Adminpassword123'];
        for (const pass of passwordsToTest) {
            const isMatch = await user.matchPassword(pass);
            console.log(`Password: "${pass}", Match: ${isMatch}`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Password test failed:', err);
        process.exit(1);
    }
};

testPassword();
