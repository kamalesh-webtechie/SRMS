const mongoose = require('mongoose');
const dotenv = require('dotenv');
const SystemSettings = require('./models/SystemSettings');

dotenv.config();

async function reproduce() {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/srms';
        await mongoose.connect(uri);
        console.log('Connected...');

        let settings = await SystemSettings.findOne();
        if (!settings) {
            console.log('Creating initial settings...');
            settings = await SystemSettings.create({});
        }

        const updates = {
            academicSettings: {
                currentAcademicYear: '2022',
                semestersPerYear: 2,
                totalYears: 4,
                allowMultiSectionPerYear: true,
                supportedAcademicYears: ['2022']
            }
        };

        console.log('Applying updates...');
        if (updates.academicSettings) {
            settings.academicSettings = { ...settings.academicSettings, ...updates.academicSettings };
        }

        console.log('Saving...');
        await settings.save();
        console.log('Save successful!');
        process.exit(0);
    } catch (err) {
        console.error('SAVE FAILED:', err);
        console.error('Stack:', err.stack);
        process.exit(1);
    }
}

reproduce();
