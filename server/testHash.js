const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const testHashing = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const email = 'hash_test@example.com';
        const password = 'testpassword123';

        // Delete if exists
        await User.deleteOne({ email });

        console.log('Creating user with password:', password);
        const user = await User.create({
            name: 'Hash Test',
            email,
            password,
            role: 'student'
        });

        console.log('User created. Hashed password in DB:', user.password);

        const isMatch = await user.matchPassword(password);
        console.log('Match with original password:', isMatch);

        const userFound = await User.findOne({ email }).select('+password');
        const isMatch2 = await userFound.matchPassword(password);
        console.log('Match with found user:', isMatch2);

        process.exit(0);
    } catch (err) {
        console.error('Hashing test failed:', err);
        process.exit(1);
    }
};

testHashing();
