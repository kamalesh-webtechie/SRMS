const fs = require('fs');
const mongoose = require('mongoose');
const User = require('./models/User');
const StudentProfile = require('./models/StudentProfile');
const TimeTable = require('./models/TimeTable');
const Section = require('./models/Section');
require('dotenv').config({ path: './server/.env' });

const checkData = async () => {
    let output = '';
    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    try {
        await mongoose.connect(process.env.MONGO_URI);
        log('Connected to MongoDB');

        const user = await User.findOne({ name: 'Vaishnavi Palanisamy' });
        if (!user) {
            log('User not found');
            fs.writeFileSync('server/diag_results.txt', output);
            process.exit(0);
        }
        log(`User found: ${user._id} ${user.name}`);

        const profile = await StudentProfile.findOne({ user: user._id }).populate('sectionId');
        if (!profile) {
            log('Profile not found');
            fs.writeFileSync('server/diag_results.txt', output);
            process.exit(0);
        }
        log('Profile found:');
        log(`- Dept: ${profile.department}`);
        log(`- Batch: ${profile.batch}`);
        log(`- Year: ${profile.currentYear}`);
        log(`- Sem: ${profile.semester}`);
        log(`- Section: ${profile.sectionId ? profile.sectionId.name : profile.section}`);

        const query = {
            department: profile.department,
            batch: profile.batch,
            year: profile.currentYear,
            semester: profile.semester.toString()
        };

        if (profile.sectionId && profile.sectionId.name) {
            query.section = profile.sectionId.name;
        } else if (profile.section) {
            query.section = profile.section;
        }

        log(`Query being used: ${JSON.stringify(query)}`);

        const timetable = await TimeTable.findOne(query);
        if (timetable) {
            log(`Timetable found: ${timetable._id}`);
        } else {
            log('Timetable NOT found for this query');

            // Check all timetables to see if there's a close match
            const allTts = await TimeTable.find({
                department: profile.department
            });
            log(`Found ${allTts.length} timetables for same dept`);
            allTts.forEach(tt => {
                log(`- ${tt.department} | ${tt.batch} | ${tt.year} | Section: ${tt.section} | Semester: ${tt.semester}`);
            });
        }

        fs.writeFileSync('server/diag_results.txt', output);
        process.exit(0);
    } catch (err) {
        log(err.stack);
        fs.writeFileSync('server/diag_results.txt', output);
        process.exit(1);
    }
};

checkData();
