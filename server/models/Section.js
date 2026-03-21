const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
    department: {
        type: String, // Storing Department Name for easier display
        required: true,
        ref: 'Department'
    },
    // We are using Department Code (String) in other places, but prompt asks for ObjectId ref.
    // Let's check Department model first to see if we rely on codes or IDs.
    // If we use IDs, we need to populate.
    // Prompt says: departmentId (ObjectId, ref: departments)
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    semester: {
        type: Number,
        required: true
    },
    year: {
        type: String,
        enum: ['I', 'II', 'III', 'IV'],
        default: 'I'
    },
    name: {
        type: String, // "A", "B", "C"
        required: true,
        uppercase: true
    },
    batch: {
        type: String, // "2023-2027"
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index for uniqueness
sectionSchema.index({ departmentId: 1, semester: 1, name: 1, batch: 1 }, { unique: true });

module.exports = mongoose.model('Section', sectionSchema);
