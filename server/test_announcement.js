const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Announcement = require('./models/Announcement');
const User = require('./models/User');

dotenv.config();

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.error('No admin user found for testing');
            process.exit(1);
        }

        const newAnnouncement = new Announcement({
            title: 'Test Title',
            message: 'Test Message',
            targetRoles: ['faculty', 'student'],
            createdBy: admin._id
        });

        await newAnnouncement.save();
        console.log('Announcement saved successfully:', newAnnouncement);

        await Announcement.findByIdAndDelete(newAnnouncement._id);
        console.log('Test announcement cleaned up');

        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
};

test();
