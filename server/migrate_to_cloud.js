const mongoose = require('mongoose');
require('dotenv').config();

// Local Configuration
const LOCAL_URI = 'mongodb://localhost:27017/srms';
// Cloud Configuration (from .env)
const CLOUD_URI = process.env.MONGO_URI;

const migrate = async () => {
    try {
        console.log('--- DB Migration Started ---');
        
        // 1. Connect to Local
        const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
        console.log('Connected to Local DB');

        // 2. Connect to Cloud
        const cloudConn = await mongoose.createConnection(CLOUD_URI).asPromise();
        console.log('Connected to Cloud DB');

        // Get all collection names from local
        const collections = await localConn.db.listCollections().toArray();
        console.log(`Found ${collections.length} collections locally.`);

        for (const col of collections) {
            const name = col.name;
            if (name === 'system.indexes') continue;
            
            console.log(`Migrating collection: ${name}...`);
            const localData = await localConn.db.collection(name).find({}).toArray();
            
            if (localData.length > 0) {
                // Clear existing cloud data in this collection first to avoid duplicates
                await cloudConn.db.collection(name).deleteMany({});
                // Insert local data
                await cloudConn.db.collection(name).insertMany(localData);
                console.log(`✅ ${name}: Moved ${localData.length} documents.`);
            } else {
                console.log(`ℹ️ ${name}: Empty.`);
            }
        }

        console.log('--- Migration Completed Successfully ---');
        process.exit(0);
    } catch (err) {
        console.error('Migration Failed:', err);
        process.exit(1);
    }
};

migrate();
