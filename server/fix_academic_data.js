const mongoose = require('mongoose');
const StudentProfile = require('./models/StudentProfile');
const Section = require('./models/Section');
const TimeTable = require('./models/TimeTable');
const fs = require('fs');
require('dotenv').config({ path: './server/.env' });

const fixData = async () => {
    let output = 'Academic Data Fix Log\n=====================\n';
    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    try {
        await mongoose.connect(process.env.MONGO_URI);
        log('Connected to MongoDB');

        // 1. Fix Sections: Year I should have Semester 1 (based on existing timetable)
        // We found sections were Year I / Sem 8.
        const sectionsToFix = await Section.find({ year: 'I', semester: 8 });
        log(`Found ${sectionsToFix.length} sections to fix (Year I, Sem 8 -> Year I, Sem 1)`);

        for (const section of sectionsToFix) {
            section.semester = 1;
            await section.save();
            log(`- Fixed Section: ${section.name} for ${section.batch}`);
        }

        // 2. Fix Student Profiles: Match their assigned section's year and semester
        const profiles = await StudentProfile.find().populate('sectionId');
        log(`\nChecking ${profiles.length} student profiles for synchronization...`);

        let profileFixCount = 0;
        for (const profile of profiles) {
            if (profile.sectionId) {
                let changed = false;
                if (profile.currentYear !== profile.sectionId.year) {
                    profile.currentYear = profile.sectionId.year;
                    changed = true;
                }
                if (profile.semester !== profile.sectionId.semester) {
                    profile.semester = profile.sectionId.semester;
                    changed = true;
                }

                if (changed) {
                    await profile.save();
                    profileFixCount++;
                }
            }
        }
        log(`Synced ${profileFixCount} student profiles with their sections.`);

        fs.writeFileSync('server/fix_results.txt', output);
        log('\nFix completed successfully.');
        process.exit(0);
    } catch (err) {
        log('\nERROR: ' + err.stack);
        fs.writeFileSync('server/fix_results.txt', output);
        process.exit(1);
    }
};

fixData();
