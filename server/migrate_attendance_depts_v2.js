const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/srms');
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const departmentsColl = db.collection('departments');
        const attendanceColl = db.collection('attendances');

        const deptMapping = {
            "Computer Science and Engineering": "CSE",
            "Electronics and Communication Engineering": "ECE",
            "Electrical and Electronics Engineering": "EEE",
            "Civil Engineering": "CIVIL",
            "Mechanical Engineering": "MECH"
        };

        console.log('\n--- Checking Departments ---');
        const allDepts = await departmentsColl.find({}).toArray();
        for (const d of allDepts) {
            console.log(`DB Dept: "${d.name}", Code: "${d.code}"`);
        }

        console.log('\n--- Updating Department Codes ---');
        for (const [name, code] of Object.entries(deptMapping)) {
            const result = await departmentsColl.updateMany(
                { name: { $regex: new RegExp(`^${name}$`, 'i') } },
                { $set: { code: code } }
            );
            console.log(`Updated "${name}" -> ${code}: Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
        }

        console.log('\n--- Migrating Attendance Records ---');
        for (const [name, code] of Object.entries(deptMapping)) {
            const result = await attendanceColl.updateMany(
                { department: { $regex: new RegExp(`^${name}$`, 'i') } },
                { $set: { department: code } }
            );
            console.log(`Migrated "${name}" -> ${code} in Attendance: Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
        }

        // Final Check
        const finalGroups = await attendanceColl.aggregate([
            { $group: { _id: "$department", count: { $sum: 1 } } }
        ]).toArray();
        console.log('\n--- Final Attendance Stats ---');
        finalGroups.forEach(g => console.log(`Dept: "${g._id}", Count: ${g.count}`));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

migrate();
