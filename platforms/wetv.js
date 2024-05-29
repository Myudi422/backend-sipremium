const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { getConnection } = require('../db');
const moment = require('moment-timezone');

// Tambahkan plugin stealth
puppeteer.use(StealthPlugin());

const LOGIN_URL = 'https://wetv.vip/';

function getMySQLTimestamp() {
    const now = moment().tz('Asia/Jakarta');
    return now.format('YYYY-MM-DD HH:mm:ss');
}

async function saveCookiesToDatabase(website, cookieData, platform = 'wetv', server = 'Official', timestamp) {
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

async function importWeTvCookie(credentials, selectedServer) {
    let browser;
    try {
        console.log("Launching browser...");
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true,
            timeout: 60000 // Increase the navigation timeout to 60 seconds
        });

        const page = await browser.newPage();

        // Set the default Windows user agent
        const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.85 Safari/537.36';
        await page.setUserAgent(userAgent);

        console.log("Navigating to WeTV login page...");
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

        console.log("Waiting for login popup button...");
        const loginPopupButton = await page.waitForSelector('img.user__portrait--header', { timeout: 20000 });
        if (loginPopupButton) {
            console.log("Clicking the login popup button...");
            await loginPopupButton.click();
            await page.waitForSelector("div.login__form-row_14cwP > div[data-type='phone-num'] > input", { visible: true, timeout: 20000 });
        } else {
            throw new Error("Login popup button not found");
        }

        console.log("Typing email...");
        await page.type("div.login__form-row_14cwP > div[data-type='phone-num'] > input", credentials.email);

        console.log("Typing password...");
        await page.type("input[type='password'].login__input_gvsAX", credentials.password);

        console.log("Clicking login button...");
        const loginButtonHandle = await page.waitForSelector("button.login__btn_2J4FF[data-disabled='0']", { visible: true, timeout: 20000 });

        if (loginButtonHandle) {
            await loginButtonHandle.evaluate(button => button.click());
            console.log("Waiting for navigation...");
            await page.waitForNavigation({ waitUntil: "networkidle2" });

            const cookies = await page.cookies();
            const timestamp = getMySQLTimestamp();

            await saveCookiesToDatabase(LOGIN_URL, cookies, "wetv", selectedServer, timestamp);

            console.log("Process completed successfully.");
            return 'WeTV cookie imported successfully.';
        } else {
            throw new Error("Login button not found or disabled");
        }
    } catch (error) {
        console.error("Error while processing WeTV website:", error);
        throw error;
    } finally {
        if (browser) {
            console.log("Closing browser...");
            await browser.close();
        }
    }
}

module.exports = { importWeTvCookie };
