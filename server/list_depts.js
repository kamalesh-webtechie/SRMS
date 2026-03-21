const mongoose = require('mongoose');
const Department = require('./models/Department');
require('dotenv').config();

const listDepts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gradex_srms');
        const depts = await Department.find();
        if (depts.length > 0) {
            console.log('Departments:');
            depts.forEach(d => {
                console.log(`- Name: ${d.name}, ID: ${d._id}`);
            });
        } else {
            console.log('No departments found.');
        }
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

listDepts();
