const http = require('http');

const data = JSON.stringify([
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

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/students/bulk',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const start = Date.now();
const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        const end = Date.now();
        console.log('Status code:', res.statusCode);
        console.log('Response:', body);
        console.log('Total time:', (end - start) / 1000, 's');
        process.exit(0);
    });
});

req.on('error', (e) => {
    console.error('Problem with request:', e.message);
    process.exit(1);
});

req.write(data);
req.end();
