import puppeteer from 'puppeteer-core';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const artifactsDir = 'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\9896ddb0-f539-453c-9715-f636f7d25979';

async function verify() {
  console.log('Verifying mobile standalone and header responsiveness...');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // 1. Test PWA Direct Launch (without landing page, directly to login)
  const pwaPage = await browser.newPage();
  await pwaPage.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 }); // iPhone X/11/12/13/14
  // Open with ?source=pwa
  await pwaPage.goto('http://localhost:5173/?source=pwa', { waitUntil: 'networkidle0' });
  await pwaPage.screenshot({
    path: path.join(artifactsDir, 'visual_pwa_direct_login.png'),
    fullPage: false
  });
  console.log('Captured: visual_pwa_direct_login.png (PWA shows Login directly)');
  await pwaPage.close();

  // 2. Test Authenticated App Header on iPhone (375px)
  const appPage = await browser.newPage();
  await appPage.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
  await appPage.goto('http://localhost:5173/?source=pwa', { waitUntil: 'networkidle0' });

  // Connect in mock mode
  // Check if mock fast connect is available or enter credentials
  await appPage.evaluate(() => {
    // Fill identifier
    const idInput = document.querySelector('input[type="email"], input[type="text"]');
    if (idInput) {
      idInput.value = 'eleve@revizo.fr';
      idInput.dispatchEvent(new Event('input', { bubbles: true }));
      idInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  // Submit identifier
  await appPage.evaluate(() => {
    const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Continuer') || b.textContent?.includes('Connexion'));
    if (submitBtn) submitBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // If password step:
  await appPage.evaluate(() => {
    const pwdInput = document.querySelector('input[type="password"]');
    if (pwdInput) {
      pwdInput.value = 'revizo123';
      pwdInput.dispatchEvent(new Event('input', { bubbles: true }));
      pwdInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const connectBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Se connecter') || b.textContent?.includes('Connexion'));
    if (connectBtn) connectBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  // Capture Header on Home (Accueil)
  await appPage.screenshot({
    path: path.join(artifactsDir, 'visual_app_header_home.png'),
    clip: { x: 0, y: 0, width: 375, height: 110 }
  });
  console.log('Captured: visual_app_header_home.png');

  // Click on "Révision" tab (bottom nav item 2)
  await appPage.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll('.mobile-nav-item'));
    const revTab = navItems.find(item => item.textContent?.includes('Révision'));
    if (revTab) revTab.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Capture Header on Revision
  await appPage.screenshot({
    path: path.join(artifactsDir, 'visual_app_header_revision.png'),
    clip: { x: 0, y: 0, width: 375, height: 110 }
  });
  console.log('Captured: visual_app_header_revision.png');

  // Click on "Mes cours" tab (bottom nav item 3)
  await appPage.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll('.mobile-nav-item'));
    const courseTab = navItems.find(item => item.textContent?.includes('Mes cours'));
    if (courseTab) courseTab.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Capture Header on Courses
  await appPage.screenshot({
    path: path.join(artifactsDir, 'visual_app_header_courses.png'),
    clip: { x: 0, y: 0, width: 375, height: 110 }
  });
  console.log('Captured: visual_app_header_courses.png');

  // Test on Android 360px width
  await appPage.setViewport({ width: 360, height: 780, deviceScaleFactor: 2 });
  await new Promise(r => setTimeout(r, 300));
  await appPage.screenshot({
    path: path.join(artifactsDir, 'visual_app_header_android_360.png'),
    clip: { x: 0, y: 0, width: 360, height: 110 }
  });
  console.log('Captured: visual_app_header_android_360.png');

  await browser.close();
  console.log('All verifications complete!');
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
