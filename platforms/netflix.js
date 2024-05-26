const puppeteer = require('puppeteer');
const fs = require('fs/promises');

async function importNetflixCookie() {
    try {
        const credentials = await readCredentials('../credentials/netflix.json');
        // Lakukan login dan impor cookie menggunakan credentials dari netflix.json
        // Contoh:
        const { email, password } = credentials;
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('https://www.netflix.com');
        await page.type('#id_userLoginId', email);
        await page.type('#id_password', password);
        await page.click('.login-button');
        await page.waitForNavigation();
        await browser.close();
        return 'Netflix cookie imported successfully.';
    } catch (error) {
        console.error('Error importing Netflix cookie:', error);
        throw error;
    }
}

async function readCredentials(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading credentials:', error);
        throw error;
    }
}

module.exports = { importNetflixCookie };
