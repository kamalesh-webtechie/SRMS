const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const testHashing = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const email = 'hash_test_admin@example.com';
        const password = 'adminpassword123';

        await User.deleteOne({ email });

        const user = await User.create({
            name: 'Hash Test Admin',
            email,
            password,
            role: 'student'
        });

        const isMatch = await user.matchPassword(password);
        console.log(`Password: "${password}", Match: ${isMatch}`);

        process.exit(0);
    } catch (err) {
        console.error('Hashing test failed:', err);
        process.exit(1);
    }
};

testHashing();
