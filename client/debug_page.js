const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('BROWSER ERROR:', msg.text());
            }
        });
        
        page.on('pageerror', err => {
            console.log('PAGE ERROR (unhandled exception):', err.toString());
        });

        console.log("Navigating to login...");
        await page.goto('http://localhost:5173/');
        // Wait for page
        await new Promise(r => setTimeout(r, 2000));
        
        // click faculty portal
        console.log("clicking faculty portal...")
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const facultyBtn = btns.find(b => b.innerText.includes('Faculty'));
            if(facultyBtn) facultyBtn.click();
        });
        await new Promise(r => setTimeout(r, 2000));
        
        // Fill login
        console.log("filling login...");
        await page.type('input[type="email"]', 'se.dept@gmail.com');
        await page.type('input[type="password"]', 'password123');
        
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const loginBtn = btns.find(b => b.innerText.includes('Sign in'));
            if(loginBtn) loginBtn.click();
        });
        await new Promise(r => setTimeout(r, 3000));
        
        // Go to students
        console.log("navigating to students...");
        await page.goto('http://localhost:5173/dashboard/students');
        await new Promise(r => setTimeout(r, 3000));
        
        console.log("Done.");
        await browser.close();
    } catch(err) {
        console.log("SCRIPT ERROR:", err);
    }
})();
