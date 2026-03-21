const mongoose = require('mongoose');

const facultyProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    employeeId: {
        type: String,
        required: true,
        unique: true
    },
    department: {
        type: String, // Will ref Department model later
        required: true
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },
    designation: {
        type: String,
        enum: ['HOD', 'Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'],
        required: true
    },
    specialization: {
        type: [String]
    },
    joiningDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('FacultyProfile', facultyProfileSchema);
