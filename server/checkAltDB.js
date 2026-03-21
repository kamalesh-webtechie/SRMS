const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const test = async () => {
    try {
        const altURI = 'mongodb://localhost:27017/srms_db';
        await mongoose.connect(altURI);
        console.log('--- srms_db COLLECTIONS ---');
        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`${col.name}: ${count} docs`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Failed to check srms_db:', err);
        process.exit(1);
    }
};

test();
