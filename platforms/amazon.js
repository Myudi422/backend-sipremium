const puppeteer = require('puppeteer');

async function importAmazonCookie(credentials) {
    const { email, password } = credentials;
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://www.amazon.com');
    await page.type('#ap_email', email);
    await page.type('#ap_password', password);
    await page.click('#signInSubmit');
    await page.waitForNavigation();
    await browser.close();
    return 'Amazon cookie imported successfully.';
}

module.exports = { importAmazonCookie };
