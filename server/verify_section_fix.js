const mongoose = require('mongoose');
const User = require('./models/User');
const Department = require('./models/Department');
const Section = require('./models/Section');
const StudentProfile = require('./models/StudentProfile');
const dotenv = require('dotenv');

dotenv.config();

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/srms');
        console.log('Connected to MongoDB');

        const student = await StudentProfile.findOne({ registerNumber: '921822104001' })
            .populate('user', 'name email')
            .populate('sectionId');

        if (!student) {
            console.log('Student not found');
            return;
        }

        console.log('Student found:', student.user.name);
        console.log('Section ID:', student.sectionId?._id);
        console.log('Section Name:', student.sectionId?.name);

        if (!student.sectionId) {
            console.log('Student has no section assigned in the database. I will try to find a section and assign it for testing if needed, or just report this.');
            // Let's see if there are any sections for this department
            const sections = await Section.find({ departmentId: student.departmentId });
            console.log(`Found ${sections.length} sections for department ${student.department}`);
            if (sections.length > 0) {
                console.log('Available sections:', sections.map(s => s.name).join(', '));
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

verify();
