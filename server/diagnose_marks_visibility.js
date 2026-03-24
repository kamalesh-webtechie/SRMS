const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function diagnose() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/srms_db');
        console.log('Connected to MongoDB');

        const User = mongoose.connection.db.collection('users');
        const Department = mongoose.connection.db.collection('departments');
        const Section = mongoose.connection.db.collection('sections');
        const Mark = mongoose.connection.db.collection('marks');

        // 1. Find HOD
        const hod = await User.findOne({ role: 'hod', name: /Muthukumar/i });
        if (!hod) {
            console.log('HOD not found');
        } else {
            console.log('HOD Found:', hod.name, 'DeptId:', hod.departmentId);
            
            // 2. Find Dept
            if (hod.departmentId) {
                const dept = await Department.findOne({ _id: hod.departmentId });
                console.log('HOD Dept:', dept ? dept.name : 'NOT FOUND');
            }

            // 3. Find Sections for this DeptId
            const sections = await Section.find({ departmentId: hod.departmentId }).toArray();
            console.log(`Sections for DeptId ${hod.departmentId}:`, sections.length);
            sections.forEach(s => console.log(` - Section: ${s.name}, Year: ${s.year}, Dept Name in Doc: ${s.department}`));

            // 4. Find Marks for these Sections
            const sectionIds = sections.map(s => s._id);
            const marks = await Mark.find({ sectionId: { $in: sectionIds } }).toArray();
            console.log(`Marks for these sections:`, marks.length);
            marks.forEach(m => console.log(` - MarkDoc ID: ${m._id}, SubjectId: ${m.subjectId}, Status: ${m.status}, SectionId: ${m.sectionId}`));
        }

        // 5. Check all sections to see if they use different Dept IDs
        const allSections = await Section.find({}).toArray();
        console.log('Total Sections in DB:', allSections.length);
        const deptIdsInSection = [...new Set(allSections.map(s => s.departmentId?.toString()))];
        console.log('Unique DeptIds in Sections:', deptIdsInSection);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

diagnose();
