const mongoose = require('mongoose');
const User = require('./models/User');
const Department = require('./models/Department');

const cleanupHod = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/srms');

        // Find the auto-created HOD
        const hodUser = await User.findOne({ email: 'hod.dept@srms.edu' });
        if (hodUser) {
            console.log('Found auto-created HOD, deleting...');
            await User.deleteOne({ _id: hodUser._id });
            
            // Unset hodId from department
            await Department.updateOne(
                { hodId: hodUser._id },
                { $unset: { hodId: "" } }
            );
            console.log('Successfully deleted auto-created HOD.');
        } else {
            console.log('Auto-created HOD not found.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error cleaning up HOD:', error);
        process.exit(1);
    }
};

cleanupHod();
