const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const findHOD = async () => {
    try {
        console.log('Starting HOD search...');
        const uri = process.env.MONGO_URI;
        if (!uri) {
            console.error('MONGO_URI is missing from .env');
            process.exit(1);
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        console.log('Connected');

        const hod = await User.findOne({ role: 'hod' });
        if (hod) {
            console.log('--- HOD FOUND ---');
            console.log(`Email: ${hod.email}`);
            console.log(`Name: ${hod.name}`);
            console.log(`Role: ${hod.role}`);
            console.log('--- END ---');
        } else {
            console.log('No user with role "hod" found.');
            const anyUser = await User.findOne();
            if (anyUser) {
                console.log(`Found a user with role "${anyUser.role}": ${anyUser.email}`);
            }
        }
        process.exit(0);
    } catch (err) {
        console.error('SEARCH FAILED:', err.message);
        process.exit(1);
    }
};

findHOD();
