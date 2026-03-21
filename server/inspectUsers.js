const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const inspect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({}).select('+password');
        console.log('Total users:', users.length);
        users.forEach(u => {
            console.log(`- Email: ${u.email}, Role: ${u.role}, Status: ${u.status}, HasPassword: ${!!u.password}`);
            if (u.password) {
                console.log(`  Password hash start: ${u.password.substring(0, 10)}...`);
            }
        });
        process.exit(0);
    } catch (err) {
        console.error('Inspection failed:', err);
        process.exit(1);
    }
};

inspect();
