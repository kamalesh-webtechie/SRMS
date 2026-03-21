const axios = require('axios');

const test = async () => {
    const email = 'admin@srms.edu';
    const password = 'adminpassword123';

    console.log(`Attempting to login with ${email}...`);
    try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email,
            password
        });
        console.log('Login API response:', JSON.stringify(response.data, null, 2));
        if (response.data.otpRequired) {
            console.log('SUCCESS: OTP is required for admin (as expected).');
        } else if (response.data.token) {
            console.log('SUCCESS: Logged in directly.');
        } else {
            console.log('REPLY:', response.data);
        }
    } catch (err) {
        console.error('Login FAILED:', err.response ? err.response.data : err.message);
    }
};

test();
