const axios = require('axios');

const test = async () => {
    const email = 'hash_test_admin@example.com';
    const password = 'adminpassword123';

    console.log(`Attempting to login with ${email}...`);
    try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email,
            password
        });
        console.log('Login successful!', response.data);
    } catch (err) {
        console.error('Login FAILED:', err.response ? err.response.data : err.message);
    }
};

test();
