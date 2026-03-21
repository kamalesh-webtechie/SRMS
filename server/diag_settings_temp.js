const mongoose = require('mongoose');
const dotenv = require('dotenv');
const SystemSettings = require('./models/SystemSettings');

dotenv.config();

async function check() {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/srms';
        await mongoose.connect(uri);
        const settings = await SystemSettings.findOne();
        if (!settings) {
            console.log('No settings found');
            process.exit(0);
        }

        const sections = [
            'collegeProfile',
            'academicSettings',
            'attendanceSettings',
            'marksSettings',
            'gradingSettings',
            'aiSettings',
            'securitySettings',
            'generalSettings',
            'timetableSettings',
            'systemFlags'
        ];

        console.log('--- SYSTEM SETTINGS DIAGNOSTIC ---');
        sections.forEach(section => {
            const val = settings[section];
            console.log(`${section}: ${val ? 'DEFINED' : 'UNDEFINED'}`);
            if (val) {
                console.log(`  Keys: ${Object.keys(val.toObject ? val.toObject() : val).join(', ')}`);
            }
        });
        console.log('---------------------------------');
        process.exit(0);
    } catch (err) {
        console.error('Error during check:', err);
        process.exit(1);
    }
}

check();
