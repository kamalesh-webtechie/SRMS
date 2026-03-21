const mongoose = require('mongoose');

const gradeScaleSchema = new mongoose.Schema({
    grade: { type: String, required: true },
    min: { type: Number, required: true },
    max: { type: Number, required: true }
}, { _id: false });

const systemSettingsSchema = new mongoose.Schema({
    collegeProfile: {
        collegeName: { type: String, default: 'SRMS College' },
        shortName: { type: String, default: 'SRMS' },
        logoUrl: { type: String, default: '' },
        contactEmail: { type: String, default: 'contact@srms.edu' },
        contactPhone: { type: String, default: '' },
        address: { type: String, default: '' },
        website: { type: String, default: '' }
    },
    academicSettings: {
        currentAcademicYear: { type: String, default: '2023-2024' },
        supportedAcademicYears: { type: [String], default: ['2023-2024'] },
        totalYears: { type: Number, default: 4 }, // engineering usually 4
        semestersPerYear: { type: Number, default: 2 },
        allowMultiSectionPerYear: { type: Boolean, default: true }
    },
    attendanceSettings: {
        attendanceLockTime: { type: String, default: '23:59' },
        minimumAttendancePercentage: { type: Number, default: 75 },
        allowFacultyEditAfterSubmit: { type: Boolean, default: false },
        editTimeLimitInMinutes: { type: Number, default: 60 },
        attendanceMode: { type: String, enum: ['DAILY', 'PERIOD'], default: 'PERIOD' },
        requireReasonForAbsentEdit: { type: Boolean, default: true }
    },
    marksSettings: {
        internalMaxMarks: { type: Number, default: 40 },
        externalMaxMarks: { type: Number, default: 60 },
        allowReEntryOfMarks: { type: Boolean, default: false },
        marksEditDeadlineDays: { type: Number, default: 3 },
        roundingRule: { type: String, enum: ['NONE', 'NEAREST', 'FLOOR', 'CEIL'], default: 'NEAREST' }
    },
    gradingSettings: {
        gradingType: { type: String, enum: ['PERCENTAGE', 'CGPA'], default: 'CGPA' },
        passPercentage: { type: Number, default: 50 },
        gradeScale: { type: [gradeScaleSchema], default: [] }
    },
    aiSettings: {
        provider: { type: String, enum: ['simulation', 'openai', 'gemini'], default: 'simulation' },
        apiKey: { type: String, select: false },
        enabled: { type: Boolean, default: false }
    },
    securitySettings: {
        sessionTimeoutMinutes: { type: Number, default: 60 },
        passwordMinLength: { type: Number, default: 8 },
        requireStrongPassword: { type: Boolean, default: true },
        maxLoginAttempts: { type: Number, default: 5 },
        twoFactorSettings: {
            emailOtp: { type: Boolean, default: true },
            phoneOtp: { type: Boolean, default: false },
            biometric: { type: Boolean, default: true }
        }
    },
    generalSettings: {
        timezone: { type: String, default: 'Asia/Kolkata' },
        dateFormat: { type: String, default: 'dd-MM-yyyy' },
        timeFormat: { type: String, enum: ['12H', '24H'], default: '12H' }
    },
    timetableSettings: {
        totalPeriods: { type: Number, default: 6 },
        periodDuration: { type: Number, default: 60 },
        startTime: { type: String, default: '09:00' },
        lunchBreak: {
            afterPeriod: { type: Number, default: 4 },
            duration: { type: Number, default: 60 }
        },
        shortBreak: {
            afterPeriod: { type: Number, default: 2 },
            duration: { type: Number, default: 15 }
        }
    },
    systemFlags: {
        maintenanceMode: { type: Boolean, default: false },
        allowStudentLogin: { type: Boolean, default: true },
        allowFacultyLogin: { type: Boolean, default: true }
    },
    audit: {
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedAt: { type: Date, default: Date.now }
    }
}, {
    timestamps: true
});

// Ensure only one document exists
systemSettingsSchema.statics.getSettings = async function () {
    const settings = await this.findOne();
    if (settings) return settings;
    return await this.create({});
};

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
