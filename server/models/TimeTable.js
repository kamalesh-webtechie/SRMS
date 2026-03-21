const mongoose = require('mongoose');

const timeTableSchema = new mongoose.Schema({
    department: {
        type: String,
        required: true
    },
    batch: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true,
        enum: ['I', 'II', 'III', 'IV']
    },
    section: {
        type: String,
        required: true
    },
    semester: {
        type: String,
        required: true
    },
    days: [{
        day: {
            type: String,
            required: true,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        },
        periods: [{
            periodNumber: {
                type: Number,
                required: true
            },
            startTime: {
                type: String,
                required: true
            },
            endTime: {
                type: String,
                required: true
            },
            subject: {
                type: String,
                required: function () { return this.type === 'class'; }
            },
            facultyId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: function () { return this.type === 'class'; }
            },
            type: {
                type: String,
                required: true,
                enum: ['class', 'break', 'lunch'],
                default: 'class'
            }
        }]
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('TimeTable', timeTableSchema);
