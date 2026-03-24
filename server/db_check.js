const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function listDocs() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/srms_db');
        console.log('Connected to:', mongoose.connection.name);
        
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        const Attendance = mongoose.connection.db.collection('attendances');
        const count = await Attendance.countDocuments();
        console.log('Attendance count:', count);

        const Departments = mongoose.connection.db.collection('departments');
        const dCount = await Departments.countDocuments();
        console.log('Departments count:', dCount);

        if (count > 0) {
            const sample = await Attendance.findOne();
            console.log('Sample Attendance:', JSON.stringify(sample, null, 2));
        }

        if (dCount > 0) {
            const dSample = await Departments.findOne();
            console.log('Sample Department:', JSON.stringify(dSample, null, 2));
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

listDocs();
