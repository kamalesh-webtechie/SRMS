const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a department name'],
        unique: true,
        trim: true
    },
    hodName: {
        type: String
    },
    hodId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    description: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Department', departmentSchema);
