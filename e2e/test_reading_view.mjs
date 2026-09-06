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

  // Aller sur Révision
  await page.evaluate(() => {
    const navButtons = document.querySelectorAll('.mobile-nav-item');
    if (navButtons[1]) navButtons[1].click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Cliquer sur le bouton CONTINUER ->
  await page.evaluate(() => {
    const continueBtn = document.querySelector('.btn-continue-gold');
    if (continueBtn) continueBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Capture haut de page mobile
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_reading_mobile_top.png' });
  console.log('Mobile Reading view top captured!');

  // Capture scroll mobile
  await page.evaluate(() => window.scrollTo(0, 450));
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_reading_mobile_scrolled.png' });
  console.log('Mobile Reading view scrolled captured!');

  // Tester le clic de téléchargement
  await page.evaluate(() => {
    const downloadBtn = document.querySelector('.btn-download-fiche');
    if (downloadBtn) downloadBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Capture après téléchargement
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_reading_mobile_downloaded.png' });
  console.log('Mobile Reading view downloaded captured!');

  // Tester le retour vers Révision via le header
  await page.evaluate(() => {
    const backBtn = document.querySelector('.btn-header-back');
    if (backBtn) backBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_after_back_mobile.png' });
  console.log('Mobile after back to Revision captured!');

  // 2. Desktop (1280x900)
  await page.setViewport({ width: 1280, height: 900, isMobile: false, hasTouch: false });
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    const desktopNavButtons = document.querySelectorAll('.sidebar-nav-item');
    if (desktopNavButtons[1]) desktopNavButtons[1].click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Cliquer sur CONTINUER -> sur desktop
  await page.evaluate(() => {
    const continueBtn = document.querySelector('.btn-continue-gold');
    if (continueBtn) continueBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Capture haut de page desktop
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_reading_desktop_top.png' });
  console.log('Desktop Reading view top captured!');

  // Capture scroll desktop
  await page.evaluate(() => window.scrollTo(0, 450));
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_reading_desktop_scrolled.png' });
  console.log('Desktop Reading view scrolled captured!');

  // Tester le retour Desktop via le bouton Révision
  await page.evaluate(() => {
    const desktopBackBtn = document.querySelector('.btn-desktop-back');
    if (desktopBackBtn) desktopBackBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_after_back_desktop.png' });
  console.log('Desktop after back to Revision captured!');

  await browser.close();
}

run().catch(err => {
  console.error('Error in test_reading_view:', err);
  process.exit(1);
});
