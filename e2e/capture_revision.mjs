import puppeteer from 'puppeteer-core';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. Mobile (390x844)
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

  // Cliquer sur le 2e onglet "Révision" dans la barre mobile
  await page.evaluate(() => {
    const navButtons = document.querySelectorAll('.mobile-nav-item');
    if (navButtons[1]) {
      navButtons[1].click();
    }
  });

  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_revision_mobile.png' });
  console.log('Mobile Revision top screenshot saved!');

  // Scroll down
  await page.evaluate(() => window.scrollTo(0, 450));
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_revision_mobile_scrolled.png' });
  console.log('Mobile Revision scrolled screenshot saved!');

  // 2. Desktop (1280x900)
  await page.setViewport({ width: 1280, height: 900, isMobile: false, hasTouch: false });
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    const desktopNavButtons = document.querySelectorAll('.sidebar-nav-item');
    if (desktopNavButtons[1]) {
      desktopNavButtons[1].click();
    }
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_revision_desktop.png' });
  console.log('Desktop Revision top screenshot saved!');

  // Desktop scroll
  await page.evaluate(() => window.scrollTo(0, 450));
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_revision_desktop_scrolled.png' });
  console.log('Desktop Revision scrolled screenshot saved!');

  await browser.close();
}

run().catch(err => {
  console.error('Error running capture_revision:', err);
  process.exit(1);
});
