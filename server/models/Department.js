const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a department name'],
        unique: true,
        trim: true
    },
    code: {
        type: String,
        required: [true, 'Please add a department code'],
        unique: true,
        trim: true,
        uppercase: true,
        minlength: [2, 'Code must be at least 2 characters'],
        maxlength: [5, 'Code cannot exceed 5 characters']
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
