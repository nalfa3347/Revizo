import puppeteer from 'puppeteer-core';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));

  // 1. Clic sur Mes cours dans sidebar
  const cTab = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.sidebar-nav-item'));
    const t = items.find(i => i.textContent?.includes('Mes cours'));
    if (t) {
      t.click();
      return true;
    }
    return false;
  });
  console.log('1. Clic Mes cours sidebar:', cTab);
  await new Promise(r => setTimeout(r, 600));

  // 2. Clic sur premier cours
  const courseClicked = await page.evaluate(() => {
    const card = document.querySelector('.course-card');
    if (card) {
      card.click();
      return true;
    }
    return false;
  });
  console.log('2. Clic cours card:', courseClicked);
  await new Promise(r => setTimeout(r, 800));

  const ficheTitle = await page.evaluate(() => document.querySelector('.fiche-main-title')?.textContent);
  console.log('3. Fiche ouverte:', ficheTitle);

  // 4. Clic bouton retour
  const backBtnResult = await page.evaluate(() => {
    const btn = document.querySelector('.btn-desktop-back');
    if (btn) {
      btn.click();
      return 'clicked .btn-desktop-back';
    }
    return 'btn-desktop-back not found';
  });
  console.log('4. Clic retour résultat:', backBtnResult);
  await new Promise(r => setTimeout(r, 800));

  const titleAfterBack = await page.evaluate(() => {
    return {
      ficheTitle: document.querySelector('.fiche-main-title')?.textContent || null,
      revHeroTitle: document.querySelector('.revision-hero-title')?.textContent || null,
      coursesTitle: document.querySelector('.courses-main-title')?.textContent || null,
      activeSidebar: document.querySelector('.sidebar-nav-item.active')?.textContent?.trim() || null
    };
  });
  console.log('5. État après retour:', titleAfterBack);

  await browser.close();
}

run().catch(console.error);
