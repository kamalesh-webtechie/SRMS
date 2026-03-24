const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const findHOD = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const hods = await User.find({ role: 'hod' });
        if (hods.length > 0) {
            console.log(`Found ${hods.length} HOD user(s):`);
            hods.forEach(hod => {
                console.log(`- Name: ${hod.name}`);
                console.log(`  Email: ${hod.email}`);
                console.log(`  User ID: ${hod._id}`);
                console.log(`  Status: ${hod.status}`);
            });
        } else {
            console.log('No HOD users found in the database.');
        }
        process.exit(0);
    } catch (err) {
        console.error('Failed to find HOD:', err);
        process.exit(1);
    }
};

findHOD();
