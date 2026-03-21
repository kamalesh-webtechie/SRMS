const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    department: {
        type: String, // Keep string for legacy
        required: true
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },
    isCommon: {
        type: Boolean,
        default: false
    },
    semester: {
        type: Number,
        required: true
    },
    credits: {
        type: Number,
        required: true
    },
    year: {
        type: String,
        enum: ['I', 'II', 'III', 'IV'],
        required: true
    },
    type: {
        type: String,
        enum: ['Theory', 'Practical', 'Theory & Practical'],
        default: 'Theory'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Subject', subjectSchema);
