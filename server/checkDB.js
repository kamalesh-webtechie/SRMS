const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        console.log('Databases:', JSON.stringify(dbs, null, 2));

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections in current DB:', collections.map(c => c.name));

        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`Collection ${col.name}: ${count} documents`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Failed to check DB:', err);
        process.exit(1);
    }
};

test();
