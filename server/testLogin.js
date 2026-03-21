const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const axios = require('axios');

dotenv.config();

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Create a test user
        const email = 'testuser_' + Date.now() + '@example.com';
        const password = 'password123';
        const name = 'Test User';
        const role = 'student';

        const user = await User.create({
            name,
            email,
            password,
            role
        });
        console.log('User created:', user.email);

        // Try to login via API
        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email,
                password
            });
            console.log('Login successful:', response.data);
        } catch (loginErr) {
            console.error('Login failed:', loginErr.response ? loginErr.response.data : loginErr.message);
        }

        // Clean up
        await User.deleteOne({ _id: user._id });
        console.log('User cleaned up');

        process.exit(0);
    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
};

test();
