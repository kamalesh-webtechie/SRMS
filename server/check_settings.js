const mongoose = require('mongoose');
const SystemSettings = require('./models/SystemSettings');
const fs = require('fs');
require('dotenv').config({ path: './server/.env' });

const checkSettings = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const settings = await SystemSettings.findOne();
        fs.writeFileSync('server/settings_analysis.txt', JSON.stringify(settings, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkSettings();
