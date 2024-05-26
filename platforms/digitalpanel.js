const puppeteer = require('puppeteer');
const { getConnection } = require('../db');

// Fungsi untuk mendapatkan format timestamp yang sesuai dengan MySQL
function getMySQLTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  let month = now.getMonth() + 1;
  let day = now.getDate();
  let hour = now.getHours();
  let minute = now.getMinutes();
  let second = now.getSeconds();

  if (month < 10) month = '0' + month;
  if (day < 10) day = '0' + day;
  if (hour < 10) hour = '0' + hour;
  if (minute < 10) minute = '0' + minute;
  if (second < 10) second = '0' + second;

  const timestamp = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  return timestamp;
}

// Fungsi untuk menyimpan cookie ke database
async function saveCookiesToDatabase(website, cookieData, platform = 'Freepik & Envato', server = 'Official') {
  const connection = await getConnection();
  const timestamp = getMySQLTimestamp();
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

async function importDigitalPanelCookie(credentials, selectedServer) {
  let browser;
  try {
    console.log("Launching browser...");
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    console.log("Opening a new page...");
    await page.goto("https://app.digitalpanel.id/");

    console.log("Waiting for email input field...");
    await page.waitForSelector('input[type="email"]');

    console.log("Typing email...");
    await page.type('input[type="email"]', credentials.email);

    console.log("Waiting for password input field...");
    await page.waitForSelector('input[type="password"]');

    console.log("Typing password...");
    await page.type('input[type="password"]', credentials.password);

    console.log("Waiting for login button...");
    await page.waitForSelector('button[type="submit"]');

    console.log("Clicking login button...");
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: "networkidle0" });

    const cookies = await page.cookies();
    await saveCookiesToDatabase("https://app.digitalpanel.id/", cookies, "digitalpanel", selectedServer);

    console.log("Proses sudah berhasil, klik ulang ekstensi.");
    return 'DigitalPanel cookie imported successfully.';
  } catch (error) {
    console.error("Error while processing DigitalPanel website:", error);
    throw error;
  } finally {
    if (browser) {
      console.log("Closing browser...");
      await browser.close();
    }
  }
}

module.exports = { importDigitalPanelCookie };
