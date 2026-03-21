const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ role: 'admin' });
        if (user) {
            console.log('Admin found:', user.email);
        } else {
            const anyUser = await User.findOne();
            if (anyUser) {
                console.log('User found:', anyUser.email, 'Role:', anyUser.role);
            } else {
                console.log('No users found');
            }
        }
        process.exit(0);
    } catch (err) {
        console.error('Failed to find user:', err);
        process.exit(1);
    }
};

test();
