const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function diagnose() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/srms');
        console.log('Connected to MongoDB');

        const Attendance = mongoose.model('Attendance', new mongoose.Schema({}, { strict: false }));
        const Department = mongoose.model('Department', new mongoose.Schema({}, { strict: false }));
        const Section = mongoose.model('Section', new mongoose.Schema({}, { strict: false }));
        const Subject = mongoose.model('Subject', new mongoose.Schema({}, { strict: false }));

        console.log('\n--- Departments ---');
        const depts = await Department.find({});
        depts.forEach(d => console.log(`Name: "${d.name}", Code: "${d.code}"`));

        console.log('\n--- Recent Attendance Records (Last 10) ---');
        const recentAttendance = await Attendance.find({}).sort({ createdAt: -1 }).limit(10);
        recentAttendance.forEach(a => {
            console.log(`ID: ${a._id}, Date: ${a.attendanceDate}, Dept: "${a.department}", Status: ${a.status}, SectionId: ${a.sectionId}`);
        });

        console.log('\n--- Attendance Grouped by Department ---');
        const deptGroups = await Attendance.aggregate([
            { $group: { _id: "$department", count: { $sum: 1 } } }
        ]);
        deptGroups.forEach(g => console.log(`Dept in DB: "${g._id}", Count: ${g.count}`));

        console.log('\n--- Sections for problematic departments ---');
        const sections = await Section.find({}).limit(5);
        sections.forEach(s => {
            console.log(`Section: "${s.name}", Year: "${s.year}", Dept: "${s.department}", DeptId: ${s.departmentId}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

diagnose();
