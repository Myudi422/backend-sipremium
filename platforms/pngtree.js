const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { getConnection } = require("../db");
const moment = require("moment-timezone");

puppeteer.use(StealthPlugin());

const LOGIN_URL = "https://pngtree.com/login/gologin?type=gg";
const MAIN_URL = "https://pngtree.com/";

function getMySQLTimestamp() {
  const now = moment().tz("Asia/Jakarta");
  return now.format("YYYY-MM-DD HH:mm:ss");
}

async function saveCookiesToDatabase(website, cookieData, platform = "pngtree", server = "Official", timestamp) {
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

async function importPNGTreeCookie(credentials, selectedServer) {
  let browser;
  try {
    console.log("Launching browser...");
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true, // Change to false to see the browser window
      slowMo: 50, // Slow down by 50ms to better observe the process
    });

    const page = await browser.newPage();
    const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
    await page.setUserAgent(userAgent);

    console.log("Navigating to Login page...");
    await page.goto(LOGIN_URL, { waitUntil: "networkidle2" });

    console.log("Waiting for email input field...");
    await page.waitForSelector("input[name='identifier']", { visible: true, timeout: 30000 }); // Increased timeout
    console.log("Typing email...");
    await page.type("input[name='identifier']", credentials.email);

    console.log("Waiting for Next button...");
    const nextButtonEmail = await page.waitForSelector("#identifierNext", { visible: true, timeout: 30000 }); // Increased timeout
    console.log("Clicking Next button for email...");
    await nextButtonEmail.click();

    console.log("Waiting for password input field...");
    await page.waitForSelector("input[name='Passwd']", { visible: true, timeout: 30000 }); // Increased timeout
    console.log("Typing password...");
    await page.type("input[name='Passwd']", credentials.password);

    console.log("Waiting for 1 second...");
    await page.waitForTimeout(1000);

    console.log("Clicking 'Next' button for password...");
    await page.evaluate(() => {
      document.querySelector("#passwordNext").click();
    });
    console.log("Clicked 'Next' button for password.");

    console.log("Waiting for 5 seconds...");
    await page.waitForTimeout(5000);

    console.log("Fetching cookies...");
    const cookies = await page.cookies();
    const timestamp = getMySQLTimestamp();

    await saveCookiesToDatabase(MAIN_URL, cookies, "pngtree", selectedServer, timestamp);

    console.log("Process completed successfully.");
    return "PNGTree cookie imported successfully.";
  } catch (error) {
    console.error("Error while processing PNGTree website:", error);
    throw error;
  } finally {
    if (browser) {
      console.log("Closing browser...");
      await browser.close();
    }
  }
}

module.exports = { importPNGTreeCookie };
