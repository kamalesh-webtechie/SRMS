const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const FacultyProfile = require('../models/FacultyProfile');
const SystemSettings = require('../models/SystemSettings');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse
} = require('@simplewebauthn/server');
const base64url = require('base64url');

// Use environment variables or defaults for WebAuthn
const rpID = process.env.NODE_ENV === 'production' ? 'srms-sage.vercel.app' : 'localhost';
const origin = process.env.NODE_ENV === 'production' ? 'https://srms-sage.vercel.app' : `http://localhost:5173`;


// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email or username
        const user = await User.findOne({
            $or: [{ email: email }, { username: email }]
        }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (await user.matchPassword(password)) {
            // --- User Status Check ---
            if (user.status !== 'active') {
                return res.status(403).json({ message: `Your account is ${user.status}. Please contact administrator.` });
            }

            // --- System Settings Checks ---
            const settings = await SystemSettings.getSettings();
            const systemFlags = settings?.systemFlags || { maintenanceMode: false, allowStudentLogin: true, allowFacultyLogin: true };

            if (systemFlags.maintenanceMode && user.role !== 'admin') {
                return res.status(503).json({ message: 'System is in Maintenance Mode. Please try again later.' });
            }
            if (user.role === 'student' && systemFlags.allowStudentLogin === false) {
                return res.status(403).json({ message: 'Student login is currently disabled by administrator.' });
            }
            if (user.role === 'faculty' && systemFlags.allowFacultyLogin === false) {
                return res.status(403).json({ message: 'Faculty login is currently disabled by administrator.' });
            }
            // ------------------------------

            let profilePhotoUrl = null;
            if (user.role === 'student') {
                try {
                    const sProfile = await StudentProfile.findOne({ user: user._id }).select('profilePhotoUrl profilePhoto');
                    if (sProfile) profilePhotoUrl = sProfile.profilePhotoUrl || sProfile.profilePhoto;
                } catch (err) {
                    console.error("Login Profile Fetch Error:", err);
                }
            }

            if (user.role === 'admin') {
                // Global Check AND User Preference Check
                const isGlobalEmailEnabled = false; // TEMPORARILY DISABLED AS PER USER REQUEST
                const isUserEmailEnabled = user.securityPreferences?.emailOtpEnabled !== false;

                if (isGlobalEmailEnabled && isUserEmailEnabled) {
                    // Generate 6-digit OTP
                    const otp = Math.floor(100000 + Math.random() * 900000).toString();
                    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

                    user.otp = otp;
                    user.otpExpires = otpExpires;
                    user.isOtpVerified = false;
                    await user.save();

                    // SEND REAL EMAIL
                    try {
                        await sendEmail({
                            email: user.email,
                            subject: 'Admin Login Security OTP',
                            message: `Your administrator login security code is: ${otp}. This code is valid for 5 minutes.`,
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                                    <h2 style="color: #ef4444; text-align: center;">Security Verification</h2>
                                    <p>Hello Administrator,</p>
                                    <p>A login attempt was made for your Gradex account. Please use the following One-Time Password (OTP) to complete your sign-in:</p>
                                    <div style="background: #f8fafc; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b;">${otp}</span>
                                    </div>
                                    <p style="font-size: 14px; color: #64748b;">This code is valid for 5 minutes. If you did not attempt to log in, please secure your account immediately.</p>
                                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
                                    <p style="font-size: 12px; color: #94a3b8; text-align: center;">Gradex Student Result Management System</p>
                                </div>
                            `,
                        });
                    } catch (emailError) {
                        console.error('Email Sending Error:', emailError);
                        if (process.env.NODE_ENV === 'development') {
                            console.log(`\n!!! EMAIL FAILED. OTP FOR ${user.email}: ${otp} !!!\n`);
                        }
                    }

                    return res.json({
                        otpRequired: true,
                        email: user.email,
                        message: 'OTP sent to your registered email'
                    });
                }
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                departmentId: user.departmentId,
                profilePhotoUrl,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Register a new user (Dev only or Admin)
// @route   POST /api/auth/register
// @access  Public (for now, usually Admin)
const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        let profile = null;
        if (user.role === 'student') {
            profile = await StudentProfile.findOne({ user: user._id }).populate('section', 'name');
        } else if (user.role === 'faculty') {
            profile = await FacultyProfile.findOne({ user: user._id });
        }

        const userObj = user.toObject();
        if (profile) {
            if (profile.profilePhotoUrl) userObj.profilePhotoUrl = profile.profilePhotoUrl;
            // Legacy fallback (optional)
            else if (profile.profilePhoto) userObj.profilePhotoUrl = profile.profilePhoto;
        }

        res.status(200).json({
            user: userObj,
            profile
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Verify OTP & get token
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({
            $or: [{ email: email }, { username: email }]
        }).select('+otp +otpExpires');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.status !== 'active') {
            return res.status(403).json({ message: `Your account is ${user.status}. Please contact administrator.` });
        }

        if (!user.otp || user.otp !== otp) {
            return res.status(401).json({ message: 'Invalid OTP' });
        }

        if (new Date() > user.otpExpires) {
            return res.status(401).json({ message: 'OTP expired' });
        }

        // Clear OTP and set verified
        user.otp = undefined;
        user.otpExpires = undefined;
        user.isOtpVerified = true;
        user.lastLogin = new Date();
        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            departmentId: user.departmentId,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        if (settings.securitySettings?.twoFactorSettings?.emailOtp === false) {
            return res.status(403).json({ message: 'Email OTP is disabled by administrator' });
        }

        const { email } = req.body;

        const user = await User.findOne({
            $or: [{ email: email }, { username: email }]
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can receive OTPs' });
        }

        // Generate new 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        // SEND EMAIL
        try {
            await sendEmail({
                email: user.email,
                subject: 'Your New Gradex OTP',
                message: `Your new administrator security code is: ${otp}. This code is valid for 5 minutes.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                        <h2 style="color: #ef4444; text-align: center;">New Security OTP</h2>
                        <p>Hello Administrator,</p>
                        <p>As per your request, here is your new One-Time Password (OTP) to complete your sign-in:</p>
                        <div style="background: #f8fafc; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b;">${otp}</span>
                        </div>
                        <p style="font-size: 14px; color: #64748b;">This code is valid for 5 minutes. If you did not request this, please secure your account immediately.</p>
                        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
                        <p style="font-size: 12px; color: #94a3b8; text-align: center;">Gradex Student Result Management System</p>
                    </div>
                `,
            });
        } catch (emailError) {
            console.error('Email Resending Error:', emailError);
            if (process.env.NODE_ENV === 'development') {
                console.log(`\n!!! EMAIL FAILED. NEW OTP FOR ${user.email}: ${otp} !!!\n`);
            }
        }

        res.json({ message: 'A new OTP has been sent to your email' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Generate WebAuthn Registration Options
// @route   POST /api/auth/webauthn/register-options
// @access  Private (Admin only)
const getRegistrationOptions = async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        if (settings.securitySettings?.twoFactorSettings?.biometric === false) {
            return res.status(403).json({ message: 'Biometric registration is disabled by administrator' });
        }

        const user = await User.findById(req.user._id);

        const options = await generateRegistrationOptions({
            rpName: 'Gradex System',
            rpID,
            userID: user._id.toString(),
            userName: user.email,
            attestationType: 'none',
            authenticatorSelection: {
                residentKey: 'required',
                userVerification: 'preferred',
            },
        });

        user.currentChallenge = options.challenge;
        await user.save();

        res.json(options);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to generate registration options' });
    }
};

// @desc    Verify WebAuthn Registration
// @route   POST /api/auth/webauthn/verify-registration
// @access  Private (Admin only)
const verifyRegistration = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const expectedChallenge = user.currentChallenge;

        const verification = await verifyRegistrationResponse({
            response: req.body,
            expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
        });

        if (verification.verified) {
            const { credentialID, credentialPublicKey, counter, transports } = verification.registrationInfo;

            // Save the new credential
            user.webAuthnCredentials.push({
                credentialID: base64url.encode(credentialID),
                publicKey: Buffer.from(credentialPublicKey),
                counter,
                transports: transports || [],
            });

            user.currentChallenge = undefined;
            await user.save();

            res.json({ verified: true });
        } else {
            res.status(400).json({ verified: false, message: 'Verification failed' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during verification' });
    }
};

// @desc    Generate WebAuthn Authentication Options
// @route   POST /api/auth/webauthn/login-options
// @access  Public
const getAuthenticationOptions = async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        if (settings.securitySettings?.twoFactorSettings?.biometric === false) {
            return res.status(403).json({ message: 'Biometric authentication is disabled by administrator' });
        }

        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user has enabled biometrics in their own profile
        if (user.securityPreferences?.biometricEnabled === false) {
            return res.status(403).json({ message: 'Biometric login is not enabled in your profile settings.' });
        }

        const options = await generateAuthenticationOptions({
            rpID,
            allowCredentials: user.webAuthnCredentials.map(cred => ({
                id: base64url.toBuffer(cred.credentialID),
                type: 'public-key',
                transports: cred.transports,
            })),
            userVerification: 'preferred',
        });

        user.currentChallenge = options.challenge;
        await user.save();

        res.json(options);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to generate authentication options' });
    }
};

// @desc    Verify WebAuthn Authentication
// @route   POST /api/auth/webauthn/verify-authentication
// @access  Public
const verifyAuthentication = async (req, res) => {
    try {
        const { email, body: authenticationBody } = req.body;
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const expectedChallenge = user.currentChallenge;
        const dbCredential = user.webAuthnCredentials.find(cred => cred.credentialID === authenticationBody.id);

        if (!dbCredential) {
            return res.status(400).json({ message: 'Credential not found' });
        }

        const verification = await verifyAuthenticationResponse({
            response: authenticationBody,
            expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            authenticator: {
                credentialID: base64url.toBuffer(dbCredential.credentialID),
                credentialPublicKey: dbCredential.publicKey,
                counter: dbCredential.counter,
            },
        });

        if (verification.verified) {
            // Update the counter
            dbCredential.counter = verification.authenticationInfo.newCounter;
            user.currentChallenge = undefined;
            user.lastLogin = new Date();
            await user.save();

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ verified: false, message: 'Authentication failed' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during authentication' });
    }
};

module.exports = {
    loginUser,
    registerUser,
    getMe,
    verifyOTP,
    resendOTP,
    getRegistrationOptions,
    verifyRegistration,
    getAuthenticationOptions,
    verifyAuthentication,
};
