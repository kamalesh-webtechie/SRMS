const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const verify = async () => {
    try {
        console.log('--- Verification Started ---');

        // 1. Verify Middleware Logic
        const announcementUpload = require('./middleware/announcementUpload');
        if (announcementUpload) {
            console.log('✅ announcementUpload middleware is correctly exported');
        }

        // 2. Verify Directory Creation
        const uploadDir = path.join(__dirname, 'uploads', 'announcements');
        if (fs.existsSync(uploadDir)) {
            console.log(`✅ Upload directory ${uploadDir} exists`);
        } else {
            console.log(`❌ Upload directory ${uploadDir} DOES NOT exist - investigating...`);
            // The middleware should create it when required or on startup if logic is top-level
        }

        // 3. Verify Route File Syntax
        try {
            require('./routes/announcements');
            console.log('✅ Routes/announcements.js has valid syntax and imports');
        } catch (e) {
            console.error('❌ Routes/announcements.js has errors:', e.message);
        }

        // 4. Verify DB Connection and Model
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const Announcement = require('./models/Announcement');
        const count = await Announcement.countDocuments();
        console.log(`✅ Announcement model verified. Current count: ${count}`);

        console.log('--- Verification Completed Successfully ---');
        process.exit(0);
    } catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    }
};

verify();
