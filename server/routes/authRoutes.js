const express = require('express');
const {
    loginUser,
    registerUser,
    getMe,
    verifyOTP,
    resendOTP,
    getRegistrationOptions,
    verifyRegistration,
    getAuthenticationOptions,
    verifyAuthentication
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Simple admin check middleware
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.get('/me', protect, getMe);

// WebAuthn Routes
router.post('/webauthn/register-options', protect, adminOnly, getRegistrationOptions);
router.post('/webauthn/verify-registration', protect, adminOnly, verifyRegistration);
router.post('/webauthn/login-options', getAuthenticationOptions);
router.post('/webauthn/verify-authentication', verifyAuthentication);

module.exports = router;
