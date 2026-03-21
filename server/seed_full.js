const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const StudentProfile = require('./models/StudentProfile');
const FacultyProfile = require('./models/FacultyProfile');
const Subject = require('./models/Subject');
const Mark = require('./models/Mark');

dotenv.config();

const seedData = async () => {
    try {
        await connectDB();
        console.log('MongoDB Connected');

        // Clear existing data
        await User.deleteMany({});
        try { await StudentProfile.collection.drop(); } catch (e) { } // Clear collection and indexes
        await FacultyProfile.deleteMany({});
        await Subject.deleteMany({});
        await Mark.deleteMany({});
        console.log('Data Cleared');

        // 1. Create Admin
        await User.create({
            name: 'System Admin',
            email: 'admin@srms.edu',
            password: 'adminpassword123',
            role: 'admin',
            status: 'active'
        });
        console.log('Admin Created: admin@srms.edu / adminpassword123');

        // 2. Create Faculty
        const facultyUser = await User.create({
            name: 'Dr. Alan Turing',
            email: 'alan@srms.edu',
            password: 'password123',
            role: 'faculty',
            status: 'active'
        });

        await FacultyProfile.create({
            user: facultyUser._id,
            employeeId: 'FAC001',
            department: 'CSE',
            designation: 'Professor',
            specialization: ['Algorithms', 'AI']
        });
        console.log('Faculty Created: alan@srms.edu / password123');

        // 3. Create Students
        const students = [];
        for (let i = 1; i <= 5; i++) {
            const studentUser = await User.create({
                name: `Student ${i}`,
                email: `student${i}@srms.edu`,
                password: 'password123',
                role: 'student',
                status: 'active',
                username: `CSE202300${i}`
            });

            const profile = await StudentProfile.create({
                user: studentUser._id,
                registerNumber: `CSE202300${i}`,
                department: 'CSE',
                semester: 3,
                batch: '2023-2027'
            });
            students.push(profile);
        }
        console.log('5 Students Created: student1@srms.edu ... student5@srms.edu / password123');

        // 4. Create Subjects
        const subject1 = await Subject.create({
            name: 'Data Structures',
            code: 'CS301',
            department: 'CSE',
            semester: 3,
            credits: 4,
            type: 'Theory'
        });

        const subject2 = await Subject.create({
            name: 'Database Management',
            code: 'CS302',
            department: 'CSE',
            semester: 3,
            credits: 3,
            type: 'Theory'
        });
        console.log('2 Subjects Created: CS301, CS302 for Sem 3');

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

seedData();
