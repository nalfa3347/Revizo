import puppeteer from 'puppeteer-core';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. Mobile (390x844) - Accueil
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_verify_home_mobile.png' });
  console.log('Mobile Home verified!');

  // 2. Desktop (1280x900) - Accueil
  await page.setViewport({ width: 1280, height: 900, isMobile: false, hasTouch: false });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_verify_home_desktop.png' });
  console.log('Desktop Home verified!');

  await browser.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
