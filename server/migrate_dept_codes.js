const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/srms_db');
        console.log('Connected to MongoDB');

        const Department = mongoose.connection.db.collection('departments');
        const depts = await Department.find({}).toArray();

        for (const dept of depts) {
            if (!dept.code) {
                // Generate a code from the name (e.g. "Computer Science and Engineering" -> "CSE")
                const words = dept.name.split(/[\s-]+/);
                let code = '';
                if (words.length >= 2) {
                    code = words.map(w => w[0]).join('').toUpperCase().substring(0, 5);
                } else {
                    code = dept.name.substring(0, 3).toUpperCase();
                }
                
                // Ensure uniqueness
                let uniqueCode = code;
                let suffix = 1;
                while (await Department.findOne({ code: uniqueCode, _id: { $ne: dept._id } })) {
                    uniqueCode = (code.substring(0, 4) + suffix).toUpperCase();
                    suffix++;
                }

                console.log(`Updating Dept: "${dept.name}" with code: "${uniqueCode}"`);
                await Department.updateOne(
                    { _id: dept._id },
                    { $set: { code: uniqueCode } }
                );
            }
        }

        console.log('Migration completed successfully.');
        await mongoose.disconnect();
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

migrate();
