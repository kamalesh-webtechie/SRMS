const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        console.log('--- ALL DATABASES ---');
        console.log(dbs.databases.map(db => db.name).join(', '));

        console.log('--- CURRENT DB COLLECTIONS ---');
        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`${col.name}: ${count} docs`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Failed to check DB:', err);
        process.exit(1);
    }
};

test();
