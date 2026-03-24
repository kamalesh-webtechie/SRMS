const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function verify() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/srms_db');
        console.log('Connected for Verification');

        const Department = mongoose.model('Department', new mongoose.Schema({
            name: String,
            code: String
        }));
        
        const Section = mongoose.model('Section', new mongoose.Schema({
            name: String,
            year: String,
            department: String
        }));

        const Attendance = mongoose.model('Attendance', new mongoose.Schema({
            department: String,
            attendanceDate: Date,
            sectionId: mongoose.Schema.Types.ObjectId,
            status: String
        }, { strict: false }));

        // 1. Create Department
        const dept = await Department.findOneAndUpdate(
            { code: 'CSE' },
            { name: 'Computer Science and Eng', code: 'CSE' },
            { upsert: true, new: true }
        );
        console.log('Verified Dept:', dept.name, dept.code);

        // 2. Create Section
        const section = await Section.findOneAndUpdate(
            { name: 'A', year: 'I' },
            { name: 'A', year: 'I', department: 'CSE' },
            { upsert: true, new: true }
        );
        console.log('Verified Section:', section.name, section.year);

        // 3. Create Attendance
        const today = new Date();
        today.setHours(0,0,0,0);
        const att = await Attendance.create({
            department: 'CSE',
            attendanceDate: today,
            sectionId: section._id,
            status: 'Present',
            student: new mongoose.Types.ObjectId(),
            subjectId: new mongoose.Types.ObjectId()
        });
        console.log('Verified Attendance Created:', att._id);

        // 4. Test Reporting Logic (Simulate resolveDeptCode + matchQuery)
        const queryDept = 'Computer Science and Eng'; // Name search
        const resolved = await (async (input) => {
             const d = await Department.findOne({
                $or: [
                    { name: new RegExp(`^${input}$`, 'i') },
                    { code: new RegExp(`^${input}$`, 'i') }
                ]
            });
            return d ? (d.code || d.name) : input;
        })(queryDept);
        
        console.log('Resolved Query Dept:', resolved); // Should be 'CSE'

        const matchQuery = {
            department: resolved,
            attendanceDate: { $gte: today, $lte: today }
        };

        const found = await Attendance.find(matchQuery);
        console.log('Attendance Records Found with Resolved Dept:', found.length);

        if (found.length > 0) {
            console.log('VERIFICATION SUCCESSFUL');
        } else {
            console.log('VERIFICATION FAILED');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

verify();
