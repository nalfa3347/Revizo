import puppeteer from 'puppeteer-core';
import path from 'path';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  console.log('1. Navigation vers http://localhost:5173/');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

  console.log('2. Clic sur onglet Révision');
  await page.evaluate(() => {
    const navItems = document.querySelectorAll('.mobile-nav-item');
    if (navItems[1]) navItems[1].click();
  });
  await new Promise(r => setTimeout(r, 600));

  console.log('3. Sélection du fichier PDF réel : cours_histoire_revolution.pdf');
  const pdfPath = path.resolve('C:\\REVIZO 2.0\\cours_histoire_revolution.pdf');
  
  // Trouver le champ file input pour le PDF
  const [fileChooser] = await Promise.all([
    page.waitForFileChooser(),
    page.evaluate(() => {
      const card = document.querySelectorAll('.import-action-card')[0];
      if (card) card.click();
    })
  ]);
  await fileChooser.accept([pdfPath]);

  // Capture de l'état de progression
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_import_progress.png' });
  console.log('Progression capturée !');

  // Attente de l'état "Ton cours est prêt !"
  console.log('4. Attente de la fin du traitement IA...');
  await page.waitForSelector('.btn-download-fiche', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 800));

  // Capture de l'écran "Ton cours est prêt !"
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_import_ready.png' });
  console.log('Écran "Ton cours est prêt !" capturé !');

  // 5. Clic sur "Voir ma révision"
  console.log('5. Clic sur "Voir ma révision"');
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('.import-modal-card button');
    for (const b of buttons) {
      if (b.textContent.includes('Voir ma révision')) {
        b.click();
        break;
      }
    }
  });
  await new Promise(r => setTimeout(r, 800));

  // Capture de la fiche de lecture générée
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_import_fiche_reading.png' });
  console.log('Fiche de lecture du cours importé capturée !');

  // 6. Retour vers Révision
  console.log('6. Clic sur retour vers Révision');
  await page.evaluate(() => {
    const backBtn = document.querySelector('.btn-header-back');
    if (backBtn) backBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Capture de la page Révision avec le nouveau cours dans les récents
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_import_courses_list.png' });
  console.log('Liste des cours récents capturée avec le nouveau cours !');

  // 7. Clic sur le premier cours récent pour ré-ouvrir ou lancer le quiz
  console.log('7. Clic sur le nouveau cours pour vérifier sa réouverture');
  await page.evaluate(() => {
    const firstRecentCourse = document.querySelector('.recent-course-item');
    if (firstRecentCourse) firstRecentCourse.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Retour
  await page.evaluate(() => {
    const backBtn = document.querySelector('.btn-header-back');
    if (backBtn) backBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // 8. Test de lancement d'un Quiz interactif depuis le nouvel import
  console.log('8. Re-sélection du PDF pour tester le bouton "Commencer le quiz"');
  const [fileChooser2] = await Promise.all([
    page.waitForFileChooser(),
    page.evaluate(() => {
      const card = document.querySelectorAll('.import-action-card')[0];
      if (card) card.click();
    })
  ]);
  await fileChooser2.accept([pdfPath]);

  await page.waitForSelector('.btn-download-fiche', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 600));

  // Clic sur "Commencer le quiz"
  console.log('9. Clic sur "Commencer le quiz"');
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('.import-modal-card button');
    for (const b of buttons) {
      if (b.textContent.includes('Commencer le quiz')) {
        b.click();
        break;
      }
    }
  });
  await new Promise(r => setTimeout(r, 800));

  // Capture du quiz interactif
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_import_quiz_modal.png' });
  console.log('Quiz interactif capturé !');

  // Répondre à la première question
  console.log('10. Réponse à la question 1 du Quiz');
  await page.waitForSelector('.quiz-choice-btn', { timeout: 10000 });
  await page.click('.quiz-choice-btn');
  await new Promise(r => setTimeout(r, 800));

  // Capture après réponse
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_import_quiz_answered.png' });
  console.log('Question répondue capturée avec explication pédagogique !');

  // Clic sur question suivante
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('.quiz-player-card button');
    for (const b of buttons) {
      if (b.textContent.includes('Question suivante') || b.textContent.includes('Terminer le quiz')) {
        b.click();
        break;
      }
    }
  });
  await new Promise(r => setTimeout(r, 600));

  console.log('Test complet exécuté avec succès !');
  await browser.close();
}

run().catch(err => {
  console.error('Erreur test import full flow :', err);
  process.exit(1);
});
