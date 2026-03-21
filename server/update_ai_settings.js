const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const SystemSettings = require('./models/SystemSettings');

const updateSettings = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/srms');
        console.log('Connected to MongoDB');

        const settings = await SystemSettings.getSettings();
        settings.aiSettings = {
            provider: 'openai',
            enabled: true,
            apiKey: process.env.OPENAI_API_KEY
        };

        await settings.save();
        console.log('AI System Settings updated to OpenAI provider successfully!');
        
        process.exit(0);
    } catch (error) {
        console.error('Update failed:', error);
        process.exit(1);
    }
};

updateSettings();
