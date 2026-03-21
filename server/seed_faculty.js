const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const FacultyProfile = require('./models/FacultyProfile');
const Department = require('./models/Department');

dotenv.config();

const faculties = [
    {
        name: "Dr. S. Prabhakaran",
        employeeId: "410201",
        department: "Computer Science and Engineering",
        designation: "Associate Professor",
        email: "prabhakaran.s@srmscollege.edu.in",
        password: "Prabha@123",
        specialization: ["Artificial Intelligence", "Machine Learning", "Cloud Computing"]
    },
    {
        name: "Ms. R. Kavitha",
        employeeId: "410202",
        department: "Electronics and Communication Engineering",
        designation: "Assistant Professor",
        email: "kavitha.r@srmscollege.edu.in",
        password: "Kavitha@123",
        specialization: ["VLSI Design", "Embedded Systems", "Signal Processing"]
    },
    {
        name: "Mr. M. Saravanan",
        employeeId: "410203",
        department: "Electrical and Electronics Engineering",
        designation: "Assistant Professor",
        email: "saravanan.m@srmscollege.edu.in",
        password: "Saravanan@123",
        specialization: ["Power Systems", "Electrical Machines", "Renewable Energy"]
    },
    {
        name: "Dr. T. Meenakshi Sundaram",
        employeeId: "410204",
        department: "Civil Engineering",
        designation: "Professor",
        email: "meenakshi.t@srmscollege.edu.in",
        password: "Meena@123",
        specialization: ["Structural Engineering", "Concrete Technology", "Construction Engineering"]
    },
    {
        name: "Mr. K. Vigneshwaran",
        employeeId: "410205",
        department: "Mechanical Engineering",
        designation: "Assistant Professor",
        email: "vigneshwaran.k@srmscollege.edu.in",
        password: "Vignesh@123",
        specialization: ["Manufacturing Technology", "CAD/CAM", "Thermodynamics"]
    },
    {
        name: "Ms. P. Revathi",
        employeeId: "410206",
        department: "Computer Science and Engineering",
        designation: "Assistant Professor",
        email: "revathi.p@srmscollege.edu.in",
        password: "Revathi@123",
        specialization: ["Data Science", "Database Management Systems", "Big Data"]
    },
    {
        name: "Mr. N. Dinesh Kumar",
        employeeId: "410207",
        department: "Electronics and Communication Engineering",
        designation: "Assistant Professor",
        email: "dinesh.n@srmscollege.edu.in",
        password: "Dinesh@123",
        specialization: ["Communication Systems", "IoT", "Embedded Systems"]
    },
    {
        name: "Dr. A. Ramesh",
        employeeId: "410208",
        department: "Mechanical Engineering",
        designation: "Associate Professor",
        email: "ramesh.a@srmscollege.edu.in",
        password: "Ramesh@123",
        specialization: ["Thermal Engineering", "Heat Transfer", "Energy Engineering"]
    }
];

async function seed() {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/srms';
        await mongoose.connect(uri);
        console.log('Connected to database...');

        for (const f of faculties) {
            // Check if user already exists
            let user = await User.findOne({ email: f.email });
            if (!user) {
                user = await User.create({
                    name: f.name,
                    email: f.email,
                    password: f.password,
                    role: 'faculty',
                    username: f.employeeId
                });
                console.log(`Created User for ${f.name}`);
            } else {
                console.log(`User for ${f.name} already exists`);
            }

            // Check if department exists, if not create a default one
            let dept = await Department.findOne({ name: f.department });
            if (!dept) {
                dept = await Department.create({ name: f.department });
                console.log(`Created Department: ${f.department}`);
            }

            // Check if FacultyProfile exists
            let profile = await FacultyProfile.findOne({ employeeId: f.employeeId });
            if (!profile) {
                await FacultyProfile.create({
                    user: user._id,
                    employeeId: f.employeeId,
                    department: f.department,
                    designation: f.designation,
                    specialization: f.specialization
                });
                console.log(`Created FacultyProfile for ${f.name}`);
            } else {
                console.log(`FacultyProfile for ${f.name} already exists`);
            }
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error during seeding:', err);
        process.exit(1);
    }
}

seed();
