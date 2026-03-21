const mongoose = require('mongoose');
const User = require('./models/User');
const FacultyProfile = require('./models/FacultyProfile');
const Department = require('./models/Department');

const cleanupOrphanedUsers = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/srms');

        // Find all users with role 'hod' or 'faculty'
        const specializedUsers = await User.find({ role: { $in: ['hod', 'faculty'] } });
        console.log(`Found ${specializedUsers.length} total faculty/hod users.`);

        for (const user of specializedUsers) {
            // Check if they have a faculty profile
            const profile = await FacultyProfile.findOne({ user: user._id });
            if (!profile) {
                console.log(`Orphaned User Found: ${user.name} (${user.email}) - Deleting...`);
                
                // Delete the user
                await User.deleteOne({ _id: user._id });

                // Also unset from department if they were marked as HOD
                if (user.role === 'hod' && user.departmentId) {
                    await Department.updateOne(
                        { _id: user.departmentId, hodId: user._id },
                        { $unset: { hodId: "" } }
                    );
                    console.log(`Removed HOD reference from department.`);
                }
            }
        }

        console.log('Cleanup complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
    }
};

cleanupOrphanedUsers();
