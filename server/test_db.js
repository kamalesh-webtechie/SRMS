const mongoose = require('mongoose');
require('dotenv').config();

const testConnect = async () => {
    console.log('Testing connection to:', process.env.MONGO_URI.replace(/:([^@]+)@/, ':****@'));
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('SUCCESS: Connected to MongoDB Atlas!');
        process.exit(0);
    } catch (err) {
        console.error('FAILURE: Could not connect.');
        console.error('Error Name:', err.name);
        console.error('Error Message:', err.message);
        process.exit(1);
    }
};

testConnect();
