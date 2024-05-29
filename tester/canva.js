const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({ headless: false }); // Launch the browser
  const page = await browser.newPage(); // Open a new page

  // Set user agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');

  await page.goto('https://www.canva.com/id_id/login/'); // Navigate to the Canva login page

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
  const email = '4eversarah01@gmail.com';
  await googleLoginPage.type('input[type="email"]', email);
  console.log(`Entered email: ${email}`);

  // Click the "Next" button
  await googleLoginPage.waitForSelector('#identifierNext', { visible: true });
  await googleLoginPage.click('#identifierNext');
  console.log('Clicked "Next" button for email.');

  // Wait for the input field for password to appear
  await googleLoginPage.waitForSelector('input[type="password"]', { visible: true });

  // Enter password
  const password = 'SRHforever';
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

  await browser.close(); // Close the browser
})();
