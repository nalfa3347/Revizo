import puppeteer from 'puppeteer-core';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const artifactsDir = 'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\9896ddb0-f539-453c-9715-f636f7d25979';

async function captureScreenshots() {
  console.log('Connecting to Edge to capture visual verification...');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 30000 });

  // 1. Capture Header & Hero with orange logo
  await page.screenshot({
    path: path.join(artifactsDir, 'visual_header_orange_logo.png'),
    clip: { x: 0, y: 0, width: 1280, height: 600 }
  });
  console.log('Captured: visual_header_orange_logo.png');

  // 2. Scroll down 400px to trigger floating PWA install banner
  await page.evaluate(() => window.scrollTo(0, 450));
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({
    path: path.join(artifactsDir, 'visual_pwa_floating_banner.png'),
    fullPage: false
  });
  console.log('Captured: visual_pwa_floating_banner.png');

  // 3. Scroll to footer with creator contacts & legal links
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({
    path: path.join(artifactsDir, 'visual_footer_contacts_legal.png'),
    fullPage: false
  });
  console.log('Captured: visual_footer_contacts_legal.png');

  // 4. Click 'Mentions Légales' to open modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const legalBtn = btns.find(b => b.textContent?.includes('Mentions Légales'));
    if (legalBtn) legalBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  await page.screenshot({
    path: path.join(artifactsDir, 'visual_legal_modal.png'),
    fullPage: false
  });
  console.log('Captured: visual_legal_modal.png');

  // 5. Mobile view (iPhone viewport)
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.evaluate(() => {
    // Close modal if open
    const closeBtn = document.querySelector('.legal-modal-close-btn');
    if (closeBtn) closeBtn.click();
    window.scrollTo(0, 200);
  });
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({
    path: path.join(artifactsDir, 'visual_mobile_pwa.png'),
    fullPage: false
  });
  console.log('Captured: visual_mobile_pwa.png');

  await browser.close();
  console.log('All visual verifications captured successfully!');
}

captureScreenshots().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
