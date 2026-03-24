const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/srms_db');
        const User = mongoose.connection.db.collection('users');
        const hods = await User.find({ role: 'hod' }).toArray();
        console.log('Total HODs:', hods.length);
        hods.forEach(h => console.log(` - Name: "${h.name}", DeptId: ${h.departmentId}, Email: ${h.email}`));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
check();
