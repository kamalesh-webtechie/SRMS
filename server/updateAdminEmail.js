const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const updateAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const result = await User.updateOne(
            { role: 'admin' },
            { $set: { email: 'gradex.test@gmail.com' } }
        );
        if (result.modifiedCount > 0) {
            console.log('Admin email updated to gradex.test@gmail.com');
        } else {
            console.log('No admin found to update or email already set.');
        }
        process.exit(0);
    } catch (err) {
        console.error('Update failed:', err);
        process.exit(1);
    }
};

updateAdmin();
