const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { getConnection } = require('../db');
const moment = require('moment-timezone');

puppeteer.use(StealthPlugin());

const LOGIN_URL = "https://www.canva.com/id_id/login/";
const MAIN_URL = "https://www.canva.com/";

function getMySQLTimestamp() {
    const now = moment().tz('Asia/Jakarta');
    return now.format('YYYY-MM-DD HH:mm:ss');
}

async function saveCookiesToDatabase(website, cookieData, platform = 'canva', server = 'Official', timestamp) {
    const connection = await getConnection();
    const validation = 1;

    try {
        const checkQuery = `SELECT * FROM cookies WHERE website = ? AND platform = ?`;
        const [results] = await connection.execute(checkQuery, [website, platform]);

        if (results.length > 0) {
            const updateQuery = `UPDATE cookies SET cookie_data = ?, timestamp = ?, server = ?, validasi = ? WHERE website = ? AND platform = ?`;
            await connection.execute(updateQuery, [JSON.stringify(cookieData), timestamp, server, validation, website, platform]);
            console.log(`Cookies updated in the database for website ${website}.`);
        } else {
            const insertQuery = `INSERT INTO cookies (website, cookie_data, timestamp, platform, server, validasi) VALUES (?, ?, ?, ?, ?, ?)`;
            await connection.execute(insertQuery, [website, JSON.stringify(cookieData), timestamp, platform, server, validation]);
            console.log(`Cookies saved to the database for website ${website}.`);
        }
    } catch (error) {
        console.error("Error while saving cookies to the database:", error);
        throw error;
    } finally {
        connection.release();
    }
}

async function importCanvaCookie(credentials, selectedServer) {
    let browser;
    try {
        console.log("Launching browser...");
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true,
            timeout: 60000 // Increase the navigation timeout to 60 seconds
        });

        const page = await browser.newPage();
        const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
        await page.setUserAgent(userAgent);

        console.log("Navigating to Login page...");
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

        // Wait for the Google login button to be loaded
        await page.waitForSelector('button._1QoxDw.Qkd66A.tYI0Vw.o4TrkA.Eph8Hg.NT2yCg.Qkd66A.tYI0Vw.lsXp_w.cwOZMg.zQlusQ.uRvRjQ.w_WokQ._7IvJg');

        // Listen for new pages (tabs or windows)
        const newPagePromise = new Promise((resolve) => browser.once('targetcreated', async (target) => {
            const newPage = await target.page();
            await newPage.waitForNavigation({ waitUntil: 'networkidle2' });
            resolve(newPage);
        }));

        // Click the Google login button
        await page.click('button._1QoxDw.Qkd66A.tYI0Vw.o4TrkA.Eph8Hg.NT2yCg.Qkd66A.tYI0Vw.lsXp_w.cwOZMg.zQlusQ.uRvRjQ.w_WokQ._7IvJg');

        // Wait for the new page to be loaded
        const googleLoginPage = await newPagePromise;

        // Wait for the input field for email to appear
        await googleLoginPage.waitForSelector('input[type="email"]', { visible: true });

        // Enter email address
        const email = credentials.email;
        await googleLoginPage.type('input[type="email"]', email);
        console.log(`Entered email: ${email}`);

        // Click the "Next" button
        await googleLoginPage.waitForSelector('#identifierNext', { visible: true });
        await googleLoginPage.click('#identifierNext');
        console.log('Clicked "Next" button for email.');

        // Wait for the input field for password to appear
        await googleLoginPage.waitForSelector('input[type="password"]', { visible: true });

        // Enter password
        const password = credentials.password;
        await googleLoginPage.type('input[type="password"]', password);
        console.log('Entered password.');

        // Click the "Next" button
        await googleLoginPage.waitForSelector('#passwordNext', { visible: true });
        await googleLoginPage.click('#passwordNext');
        console.log('Clicked "Next" button for password.');

        // Wait for the "Lanjutkan" button to appear
        await googleLoginPage.waitForSelector('div[jsname="xivUjb"] button span.VfPpkd-vQzf8d', { visible: true });

        // Click the "Lanjutkan" button
        await googleLoginPage.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('div[jsname="xivUjb"] button span.VfPpkd-vQzf8d'));
            const lanjutkanButton = buttons.find(button => button.innerText.includes('Lanjutkan'));
            if (lanjutkanButton) {
                lanjutkanButton.closest('button').click();
            }
        });
        console.log('Clicked "Lanjutkan" button.');

        // Wait for a while to ensure login completes
        await googleLoginPage.waitForTimeout(5000);

        // Capture cookies from all active pages
        const allPages = await browser.pages();
        let cookies = [];
        for (const page of allPages) {
            const pageCookies = await page.cookies();
            cookies = cookies.concat(pageCookies);
        }
        const timestamp = getMySQLTimestamp();

        await saveCookiesToDatabase(MAIN_URL, cookies, "canva", selectedServer, timestamp);

        console.log("Process completed successfully.");
        return 'Canva cookie imported successfully.';
    } catch (error) {
        console.error("Error while processing Canva website:", error);
        throw error;
    } finally {
        if (browser) {
            console.log("Closing browser...");
            await browser.close();
        }
    }
}

module.exports = { importCanvaCookie };
