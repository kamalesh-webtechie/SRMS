const mongoose = require('mongoose');
const dotenv = require('dotenv');
const SystemSettings = require('./models/SystemSettings');
const { updateSettings } = require('./controllers/systemController');
const User = require('./models/User');

dotenv.config();

async function test() {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/srms';
        await mongoose.connect(uri);
        console.log('Connected to database...');

        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.error('No admin user found for testing');
            process.exit(1);
        }

        const req = {
            body: {
                academicSettings: {
                    currentAcademicYear: '2022',
                    supportedAcademicYears: ['2022'],
                    totalYears: 4,
                    semestersPerYear: 2,
                    allowMultiSectionPerYear: true
                }
            },
            user: admin
        };

        const res = {
            status: function (code) {
                this.statusCode = code;
                console.log('Response Status:', code);
                return this;
            },
            json: function (data) {
                console.log('Response JSON:', JSON.stringify(data, null, 2));
                return this;
            },
            statusCode: 200
        };

        console.log('Calling updateSettings...');
        await updateSettings(req, res, (err) => {
            if (err) {
                console.error('Next called with error:', err);
            }
        });

        console.log('Test completed');
        process.exit(0);
    } catch (err) {
        console.error('Test failed with error:', err);
        process.exit(1);
    }
}

test();
