const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Department = require('./models/Department');

dotenv.config();

async function check() {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/srms';
        await mongoose.connect(uri);
        const depts = await Department.find();
        console.log('--- DEPARTMENTS ---');
        depts.forEach(d => {
            console.log(`ID: ${d._id}, Name: "${d.name}"`);
        });
        console.log('-------------------');
        process.exit(0);
    } catch (err) {
        console.error('Error during check:', err);
        process.exit(1);
    }
}

check();
