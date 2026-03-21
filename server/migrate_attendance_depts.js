const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/srms');
        console.log('Connected to MongoDB');

        const Department = mongoose.model('Department', new mongoose.Schema({ name: String, code: String }, { strict: false }));
        const Attendance = mongoose.model('Attendance', new mongoose.Schema({ department: String }, { strict: false }));

        const deptMapping = {
            "Computer Science and Engineering": "CSE",
            "Electronics and Communication Engineering": "ECE",
            "Electrical and Electronics Engineering": "EEE",
            "Civil Engineering": "CIVIL",
            "Mechanical Engineering": "MECH"
        };

        console.log('\n--- Updating Department Codes ---');
        for (const [name, code] of Object.entries(deptMapping)) {
            const result = await Department.updateOne({ name: name }, { $set: { code: code } });
            console.log(`Updated "${name}" -> ${code}: ${result.modifiedCount} modified`);
        }

        console.log('\n--- Migrating Attendance Records ---');
        for (const [name, code] of Object.entries(deptMapping)) {
            // Update records where department is the full name to the shorter code
            const result = await Attendance.updateMany({ department: name }, { $set: { department: code } });
            console.log(`Migrated "${name}" -> ${code} in Attendance: ${result.modifiedCount} modified`);
        }

        // Also check for any records with 'undefined' or missing department and try to fix them if possible
        // (Optional: can add more logic here if research showed other values)

        console.log('\nMigration Complete.');
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

migrate();
