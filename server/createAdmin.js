const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config();

/**
 * Script to create an initial Admin user if none exists.
 * Run with: node createAdmin.js
 */
const createAdmin = async () => {
    try {
        await connectDB();

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        
        // Configuration for the admin
        const adminData = {
            name: 'System Admin',
            email: 'gradex.test@gmail.com', // YOU CAN CHANGE THIS
            password: 'AdminPassword123!',   // YOU CAN CHANGE THIS
            role: 'admin',
            status: 'active'
        };

        if (existingAdmin) {
            console.log('------------------------------------------');
            console.log('Admin user already exists. Updating password...');
            existingAdmin.password = adminData.password;
            existingAdmin.email = adminData.email; // Also ensure email is correct
            await existingAdmin.save();
            console.log('Admin credentials updated successfully!');
            console.log('Email:', existingAdmin.email);
            console.log('Password:', adminData.password);
            console.log('------------------------------------------');
            process.exit(0);
        }

        const admin = await User.create(adminData);


        console.log('------------------------------------------');
        console.log('Admin user created successfully!');
        console.log('Email:', admin.email);
        console.log('Password:', adminData.password);
        console.log('Role:', admin.role);
        console.log('------------------------------------------');
        console.log('You can now log in at: https://srms-sage.vercel.app/login/admin');
        
        process.exit();
    } catch (error) {
        console.error('------------------------------------------');
        console.error('Error creating admin:', error.message);
        console.error('------------------------------------------');
        process.exit(1);
    }
}

createAdmin();
