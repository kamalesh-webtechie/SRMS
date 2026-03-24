const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/srms_db');
        console.log('Connected to MongoDB');

        const Section = mongoose.connection.db.collection('sections');
        const Department = mongoose.connection.db.collection('departments');

        const allSections = await Section.find({}).toArray();
        console.log(`Checking ${allSections.length} sections...`);

        for (const section of allSections) {
            if (!section.departmentId || section.departmentId === 'undefined') {
                console.log(`Section "${section.name}" (Year ${section.year}) has no departmentId. Linking by name: "${section.department}"`);
                
                // Find department by name or code
                const dept = await Department.findOne({
                    $or: [
                        { name: new RegExp(`^${section.department}$`, 'i') },
                        { code: new RegExp(`^${section.department}$`, 'i') }
                    ]
                });

                if (dept) {
                    console.log(` -> Found matching Dept: "${dept.name}" (${dept._id}). Updating...`);
                    await Section.updateOne(
                        { _id: section._id },
                        { $set: { departmentId: dept._id } }
                    );
                } else {
                    console.log(` !! Could not find Department matching "${section.department}"`);
                }
            }
        }

        console.log('Migration completed.');
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

migrate();
