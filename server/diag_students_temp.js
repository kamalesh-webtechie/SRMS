const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const StudentProfile = require('./models/StudentProfile');
const Department = require('./models/Department');
const Section = require('./models/Section');

dotenv.config();

async function diag() {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/srms';
        await mongoose.connect(uri);

        console.log('--- DIAGNOSTIC ---');
        const studentUsers = await User.find({ role: 'student' });
        console.log(`Student Users found: ${studentUsers.length}`);
        studentUsers.forEach(u => console.log(` - ${u.name} (${u.email}) [ID: ${u._id}]`));

        const profiles = await StudentProfile.find();
        console.log(`Student Profiles found: ${profiles.length}`);

        const depts = await Department.find();
        console.log(`Departments: ${depts.map(d => d.name).join(', ')}`);

        const sections = await Section.find().populate('departmentId');
        console.log(`Sections count: ${sections.length}`);
        sections.forEach(s => {
            console.log(` - Section ${s.name}, Semester ${s.semester}, Batch ${s.batch}, Dept: ${s.departmentId?.name}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

diag();
