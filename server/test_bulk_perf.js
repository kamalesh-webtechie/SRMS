const axios = require('axios');

async function testBulk() {
    try {
        console.log('Sending bulk request to http://localhost:5000/api/students/bulk ...');
        const start = Date.now();
        const res = await axios.post('http://localhost:5000/api/students/bulk', [
            {
                name: 'Perf Test 1',
                email: 'perf1@example.com',
                registerNumber: 'PERF001',
                department: 'Computer Science and Engineering',
                section: 'A',
                batch: '2022-2026',
                dob: '2004-01-01'
            },
            {
                name: 'Perf Test 2',
                email: 'perf2@example.com',
                registerNumber: 'PERF002',
                department: 'Computer Science and Engineering',
                section: 'A',
                batch: '2022-2026',
                dob: '2004-01-02'
            }
        ]);
        const end = Date.now();
        console.log('Response status:', res.status);
        console.log('Response data:', JSON.stringify(res.data, null, 2));
        console.log('Total time:', (end - start) / 1000, 's');
    } catch (err) {
        console.error('Error:', err.response?.data || err.message);
    }
}

testBulk();
