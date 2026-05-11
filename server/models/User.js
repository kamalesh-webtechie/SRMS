const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    username: {
        type: String,
        unique: true,
        sparse: true
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['admin', 'hod', 'faculty', 'student'],
        default: 'student'
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    lastLogin: {
        type: Date
    },
    otp: {
        type: String,
        select: false
    },
    otpExpires: {
        type: Date,
        select: false
    },
    isOtpVerified: { type: Boolean, default: false },
    webAuthnCredentials: [{
        credentialID: String,
        publicKey: Buffer,
        counter: Number,
        transports: [String],
    }],
    currentChallenge: String,
    securityPreferences: {
        emailOtpEnabled: { type: Boolean, default: true },
        biometricEnabled: { type: Boolean, default: false }
    }
}, {
    timestamps: true
});

// Encrypt password using bcrypt
// Encrypt password using bcrypt
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual for Faculty Profile
userSchema.virtual('facultyProfile', {
    ref: 'FacultyProfile',
    localField: '_id',
    foreignField: 'user',
    justOne: true
});

userSchema.set('toObject', { virtuals: true });
userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
