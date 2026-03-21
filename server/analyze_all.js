const mongoose = require('mongoose');
const StudentProfile = require('./models/StudentProfile');
const User = require('./models/User');
const TimeTable = require('./models/TimeTable');
const fs = require('fs');
require('dotenv').config({ path: './server/.env' });

const analyzeAll = async () => {
    let output = '';
    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    try {
        await mongoose.connect(process.env.MONGO_URI);

        const profiles = await StudentProfile.find().populate('user', 'name');
        log(`Total student profiles: ${profiles.length}`);
        profiles.slice(0, 10).forEach(p => {
            log(`Student: ${p.user ? p.user.name : 'Unknown'} | Year: ${p.currentYear} | Sem: ${p.semester} | Dept: ${p.department}`);
        });

        const timetables = await TimeTable.find();
        log(`\nTotal timetables: ${timetables.length}`);
        timetables.forEach(tt => {
            log(`Timetable: ${tt.department} | Batch: ${tt.batch} | Year: ${tt.year} | Sem: ${tt.semester} | Sec: ${tt.section}`);
        });

        fs.writeFileSync('server/full_analysis.txt', output);
        process.exit(0);
    } catch (err) {
        log(err.stack);
        process.exit(1);
    }
};

analyzeAll();
