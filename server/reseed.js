const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const reseed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const email = 'admin@srms.edu';

        await User.deleteOne({ email });
        console.log('Deleted existing admin');

        await User.create({
            name: 'System Admin',
            email: 'admin@srms.edu',
            password: 'adminpassword123',
            role: 'admin',
            status: 'active'
        });
        console.log('Re-seeded admin successfully with password: adminpassword123');

        process.exit(0);
    } catch (err) {
        console.error('Reseed failed:', err);
        process.exit(1);
    }
};

reseed();
