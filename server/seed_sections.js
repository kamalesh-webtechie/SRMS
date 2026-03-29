const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Section = require('./models/Section');
const Department = require('./models/Department');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/srms';

const seedData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const deptId = '69c2477859ae357b08ad742c'; // CSE Dept
        const dept = await Department.findById(deptId);

        if (!dept) {
            console.error('Department not found. Please ensure the ID is correct.');
            process.exit(1);
        }

        const sampleSections = [
            {
                name: 'A',
                departmentId: dept._id,
                department: dept.name,
                semester: 1,
                batch: '2023-2027',
                year: 'I'
            },
            {
                name: 'B',
                departmentId: dept._id,
                department: dept.name,
                semester: 1,
                batch: '2023-2027',
                year: 'I'
            }
        ];

        for (const sec of sampleSections) {
            await Section.findOneAndUpdate(
                { departmentId: sec.departmentId, semester: sec.semester, name: sec.name, batch: sec.batch },
                sec,
                { upsert: true, new: true }
            );
        }

        console.log('Sample sections seeded successfully!');
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
