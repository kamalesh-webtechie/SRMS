const mongoose = require('mongoose');
const Section = require('./models/Section');
const Department = require('./models/Department');
const fs = require('fs');
require('dotenv').config({ path: './server/.env' });

const checkSections = async () => {
    let output = '';
    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    try {
        await mongoose.connect(process.env.MONGO_URI);

        const sections = await Section.find().populate('departmentId', 'name');
        log(`Total sections: ${sections.length}`);
        sections.forEach(s => {
            log(`Section: ${s.name} | Dept: ${s.departmentId ? s.departmentId.name : 'N/A'} | Batch: ${s.batch} | Year: ${s.year} | Sem: ${s.semester}`);
        });

        fs.writeFileSync('server/section_analysis.txt', output);
        process.exit(0);
    } catch (err) {
        log(err.stack);
        process.exit(1);
    }
};

checkSections();
