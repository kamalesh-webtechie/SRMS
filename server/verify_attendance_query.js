const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function verify() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/srms');
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const attendanceColl = db.collection('attendances');

        // Emulate the frontend query:
        // Dept: CIVIL, Date: 2026-03-01
        const department = "CIVIL";
        const startDate = "2026-03-01";
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(startDate);
        end.setHours(23, 59, 59, 999);

        console.log(`\n--- Querying Attendance for Dept: ${department}, Date: ${startDate} ---`);
        const records = await attendanceColl.find({
            department: department,
            attendanceDate: { $gte: start, $lte: end }
        }).toArray();

        console.log(`Found ${records.length} records.`);

        if (records.length > 0) {
            console.log('Sample record summary:');
            // This mirrors the backend aggregate logic
            const sample = records[0];
            console.log(`- Date: ${sample.attendanceDate}, SubjectId: ${sample.subjectId}, SectionId: ${sample.sectionId}, Status: ${sample.status}`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

verify();
