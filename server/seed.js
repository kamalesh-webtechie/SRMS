const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
    try {
        await connectDB();

        const admin = await User.findOne({ role: 'admin' });

        if (!admin) {
            await User.create({
                name: 'System Admin',
                email: 'gradex.test@gmail.com',
                password: 'adminpassword123', // In production, this would be more secure
                role: 'admin',
                status: 'active'
            });
            console.log('Admin user created successfully');
        } else {
            console.log('Admin already exists');
        }
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

seedAdmin();
