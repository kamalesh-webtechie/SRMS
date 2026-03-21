const SystemSettings = require('../models/SystemSettings');
const asyncHandler = require('express-async-handler');

// Simple In-Memory Cache
let cachedSettings = null;
let lastCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper to clear cache
const clearCache = () => {
    cachedSettings = null;
    lastCacheTime = 0;
};

// @desc    Get system settings
// @route   GET /api/system
// @access  Public (Limited) / Private (Full)
const getSettings = asyncHandler(async (req, res) => {
    const isFullAccess = req.user && (req.user.role === 'admin' || req.user.role === 'faculty');

    // Serve from cache if valid
    if (cachedSettings && (Date.now() - lastCacheTime < CACHE_TTL)) {
        if (!isFullAccess) {
            // Filter public fields for non-admins if needed, though most checks rely on frontend hiding
            // For strict security, create a public subset here
            const publicSettings = {
                collegeProfile: cachedSettings.collegeProfile,
                gradingSettings: {
                    gradingType: cachedSettings.gradingSettings.gradingType,
                    passPercentage: cachedSettings.gradingSettings.passPercentage,
                    gradeScale: cachedSettings.gradingSettings.gradeScale
                },
                systemFlags: cachedSettings.systemFlags
            };
            return res.status(200).json(publicSettings);
        }
        return res.status(200).json(cachedSettings);
    }

    let settings = await SystemSettings.findOne().select('+aiSettings.apiKey');
    if (!settings) {
        settings = await SystemSettings.create({});
    }
    // If the retrieved document is from the old schema, it won't have the nested objects.
    // We detect this and force a migration/update to ensure frontend receives correct structure.
    if (!settings.collegeProfile || !settings.academicSettings) {
        // Preserving legacy data if possible (accessing raw _doc to get fields removed from schema)
        const rawData = settings.toObject();

        if (!settings.collegeProfile) {
            settings.collegeProfile = {
                collegeName: rawData.collegeName || 'SRMS College',
                logoUrl: rawData.collegeLogo || '',
                contactEmail: rawData.collegeEmail || 'contact@srms.edu',
                contactPhone: rawData.collegePhone || '',
                address: rawData.collegeAddress || '',
                website: ''
            };
        }

        if (!settings.academicSettings) {
            settings.academicSettings = {
                currentAcademicYear: '2023-2024',
                supportedAcademicYears: ['2023-2024'],
                totalYears: 4,
                semestersPerYear: 2,
                allowMultiSectionPerYear: true
            };
        }

        if (!settings.attendanceSettings) settings.attendanceSettings = {};
        if (!settings.marksSettings) settings.marksSettings = {};
        if (!settings.gradingSettings) settings.gradingSettings = {};
        if (!settings.aiSettings) {
            settings.aiSettings = {
                provider: rawData.aiProvider || 'simulation',
                apiKey: rawData.aiApiKey || '',
                enabled: false
            };
        }
        if (!settings.securitySettings) settings.securitySettings = {};
        if (!settings.securitySettings) settings.securitySettings = {};
        if (!settings.generalSettings) {
            settings.generalSettings = {
                timezone: 'Asia/Kolkata',
                dateFormat: 'dd-MM-yyyy',
                timeFormat: '12H'
            };
        }
        if (!settings.systemFlags) settings.systemFlags = {};
        if (!settings.timetableSettings) {
            settings.timetableSettings = {
                totalPeriods: 6,
                periodDuration: 60,
                startTime: '09:00',
                lunchBreak: { afterPeriod: 4, duration: 60 },
                shortBreak: { afterPeriod: 2, duration: 15 }
            };
        }

        // Save to apply defaults and persist structure
        settings = await settings.save();

        // Clear cache since we just modified DB
        clearCache();
    }
    // -------------------------------------

    // Update Cache
    cachedSettings = settings.toObject();
    lastCacheTime = Date.now();

    if (!isFullAccess) {
        const publicSettings = {
            collegeProfile: settings.collegeProfile,
            gradingSettings: {
                gradingType: settings.gradingSettings.gradingType,
                passPercentage: settings.gradingSettings.passPercentage,
                gradeScale: settings.gradingSettings.gradeScale
            },
            systemFlags: settings.systemFlags,
            generalSettings: settings.generalSettings,
        };
        return res.status(200).json(publicSettings);
    }

    res.status(200).json(settings);
});

// @desc    Update system settings
// @route   PUT /api/system
// @access  Private/Admin
const updateSettings = asyncHandler(async (req, res) => {
    const updates = req.body;
    console.log('Update System Settings Request:', JSON.stringify(updates, null, 2));

    let settings = await SystemSettings.getSettings();
    console.log('Current System Settings State:', JSON.stringify(settings, null, 2));

    // --- Validation Logic ---

    // 1. Academic Year Validation
    if (updates.academicSettings) {
        const { currentAcademicYear, supportedAcademicYears } = updates.academicSettings;
        // Merge with existing if partial update, but usually PUT sends full section
        const finalSupported = supportedAcademicYears || settings.academicSettings.supportedAcademicYears;
        const finalCurrent = currentAcademicYear || settings.academicSettings.currentAcademicYear;

        if (finalSupported && finalCurrent && !finalSupported.includes(finalCurrent)) {
            res.status(400);
            throw new Error(`Current academic year ${finalCurrent} must be in supported years list.`);
        }
    }

    // 2. Attendance Validation
    if (updates.attendanceSettings) {
        const { minimumAttendancePercentage } = updates.attendanceSettings;
        if (minimumAttendancePercentage !== undefined) {
            if (minimumAttendancePercentage < 0 || minimumAttendancePercentage > 100) {
                res.status(400);
                throw new Error("Minimum attendance percentage must be between 0 and 100.");
            }
        }
    }

    // 3. Grading Validation
    if (updates.gradingSettings) {
        const { gradeScale, passPercentage } = updates.gradingSettings;
        if (passPercentage !== undefined && (passPercentage < 0 || passPercentage > 100)) {
            res.status(400);
            throw new Error("Pass percentage must be between 0 and 100.");
        }
        // Validate Grade Scale overlap could go here (complex logic, skipping for brevity unless critical)
    }

    // --- Update Fields ---
    // We can merge deeply or handle section by section.
    // Since the UI sends section-wise updates usually, or full updates.

    // College Profile
    if (updates.collegeProfile) {
        settings.collegeProfile = { ...settings.collegeProfile, ...updates.collegeProfile };
    }
    // Academic
    if (updates.academicSettings) {
        settings.academicSettings = { ...settings.academicSettings, ...updates.academicSettings };
    }
    // Attendance
    if (updates.attendanceSettings) {
        settings.attendanceSettings = { ...settings.attendanceSettings, ...updates.attendanceSettings };
    }
    // Marks
    if (updates.marksSettings) {
        settings.marksSettings = { ...settings.marksSettings, ...updates.marksSettings };
    }
    // Grading
    if (updates.gradingSettings) {
        settings.gradingSettings = { ...settings.gradingSettings, ...updates.gradingSettings };
    }
    // AI
    if (updates.aiSettings) {
        settings.aiSettings = { ...settings.aiSettings, ...updates.aiSettings };
    }
    // Security
    if (updates.securitySettings) {
        settings.securitySettings = { ...settings.securitySettings, ...updates.securitySettings };
        if (settings.securitySettings.sessionTimeoutMinutes < 5) {
            res.status(400);
            throw new Error("Session timeout must be at least 5 minutes.");
        }
    }
    // Flags
    if (updates.systemFlags) {
        settings.systemFlags = { ...settings.systemFlags, ...updates.systemFlags };
    }
    // General
    if (updates.generalSettings) {
        settings.generalSettings = { ...settings.generalSettings, ...updates.generalSettings };
    }

    // Timetable
    if (updates.timetableSettings) {
        settings.timetableSettings = { ...settings.timetableSettings, ...updates.timetableSettings };
    }

    // Audit
    settings.audit = {
        updatedBy: req.user._id,
        updatedAt: Date.now()
    };

    const updatedSettings = await settings.save();

    // Clear Cache
    clearCache();

    res.status(200).json(updatedSettings);
});

// @desc    Get server time
// @route   GET /api/system/now
// @access  Private (All)
const getServerTime = asyncHandler(async (req, res) => {
    let timezone = 'Asia/Kolkata';
    let dateFormat = 'dd-MM-yyyy';
    let timeFormat = '12H';

    // Try cache
    if (cachedSettings && cachedSettings.generalSettings) {
        timezone = cachedSettings.generalSettings.timezone || timezone;
        dateFormat = cachedSettings.generalSettings.dateFormat || dateFormat;
        timeFormat = cachedSettings.generalSettings.timeFormat || timeFormat;
    } else {
        // Fallback fetch
        const settings = await SystemSettings.getSettings();
        if (settings.generalSettings) {
            timezone = settings.generalSettings.timezone || timezone;
            dateFormat = settings.generalSettings.dateFormat || dateFormat;
            timeFormat = settings.generalSettings.timeFormat || timeFormat;
        }
    }

    const now = new Date();
    res.json({
        serverTime: now.toISOString(),
        timezone,
        dateFormat,
        timeFormat
    });
});

module.exports = {
    getSettings,
    updateSettings,
    getServerTime
};
