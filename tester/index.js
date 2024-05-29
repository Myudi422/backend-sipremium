const puppeteer = require('puppeteer-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();

puppeteer.use(stealth);

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: false }); // Buka browser dalam mode non-headless
    const page = await browser.newPage();
    console.log('Membuka halaman login...');
    await page.goto('https://pngtree.com/login/gologin?type=gg'); // Langsung menuju URL login

    // Tunggu hingga input field untuk email muncul dan menjadi terlihat
    await page.waitForSelector('input[name="identifier"]', { visible: true });

    // Isi alamat email
    const email = '4eversarah01@gmail.com';
    await page.type('input[name="identifier"]', email);
    console.log(`Isi email: ${email}`);

    // Klik tombol "Selanjutnya" untuk email
    await page.waitForSelector('#identifierNext', { visible: true });
    await page.click('#identifierNext');
    console.log('Klik "Selanjutnya" untuk email.');

    // Tunggu hingga input field untuk kata sandi muncul dan menjadi terlihat
    await page.waitForSelector('input[name="Passwd"]', { visible: true });

    // Isi kata sandi
    const password = 'SRHforever';
    await page.type('input[name="Passwd"]', password);
    console.log('Isi kata sandi.');

    // Tunggu sebentar untuk memastikan kata sandi selesai diisi
    await page.waitForTimeout(1000);

    // Klik tombol "Next" untuk kata sandi dengan JavaScript DOM
    await page.evaluate(() => {
      document.querySelector('#passwordNext').click();
    });
    console.log('Klik "Next" untuk kata sandi.');

    // Tunggu beberapa saat untuk menjaga browser terbuka
    console.log('Menunggu 5 detik...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('Terjadi kesalahan:', error);
  }
})();
