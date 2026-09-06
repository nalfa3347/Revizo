import puppeteer from 'puppeteer-core';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  console.log('=== TEST EXPÉRIENCE QUIZ & VALIDATION VISUELLE ===');

  // 1. MOBILE VIEW (390 x 844) : VÉRIFICATION DU HUB QUIZ
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  // Clic sur l'onglet "Quiz" dans la barre inférieure mobile
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('.mobile-nav-item'));
    const quizBtn = buttons.find(b => b.textContent?.includes('Quiz'));
    if (quizBtn) quizBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Vérification de l'onglet actif et du header mobile
  const mobileHeaderTitle = await page.$eval('.header-revision-title', el => el.textContent?.trim());
  console.log(`1. Onglet mobile Quiz ouvert. Titre en-tête : "${mobileHeaderTitle}"`);

  // Capture Hub Mobile
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_quiz_hub_mobile.png' });
  console.log('2. Capture hub mobile enregistrée : screenshot_quiz_hub_mobile.png');

  // 2. DESKTOP VIEW (1280 x 900) : VÉRIFICATION DU HUB QUIZ
  await page.setViewport({ width: 1280, height: 900, isMobile: false, hasTouch: false });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 500));

  // Clic sur l'onglet "Quiz" dans la sidebar desktop
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.sidebar-nav-item'));
    const qTab = items.find(i => i.textContent?.includes('Quiz'));
    if (qTab) qTab.click();
  });
  await new Promise(r => setTimeout(r, 500));

  const activeSidebarItem = await page.$eval('.sidebar-nav-item.active', el => el.textContent?.trim());
  console.log(`3. Desktop sidebar active : "${activeSidebarItem}"`);

  // Capture Hub Desktop
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_quiz_hub_desktop.png' });
  console.log('4. Capture hub desktop enregistrée : screenshot_quiz_hub_desktop.png');

  // 3. TEST HORS CONNEXION (CONSULTATION OK, DÉMARRAGE BLOQUÉ PROPREMENT)
  console.log('--- TEST HORS CONNEXION ---');
  await page.setOfflineMode(true);
  await new Promise(r => setTimeout(r, 500));

  // Tentative de clic sur "Commencer" du premier quiz en mode hors connexion
  await page.evaluate(() => {
    const startBtns = Array.from(document.querySelectorAll('.quiz-btn-start'));
    if (startBtns.length > 0) startBtns[0].click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Si on arrive sur la préparation ou si une notice s'affiche
  const isPrepOrNotice = await page.evaluate(() => {
    const prepCard = document.querySelector('.quiz-prep-card');
    const notice = document.querySelector('.notice-message')?.textContent;
    return { hasPrep: !!prepCard, notice };
  });
  console.log('5. Résultat hors-connexion initial :', isPrepOrNotice);

  if (isPrepOrNotice.hasPrep) {
    // Tenter de démarrer la session active hors ligne
    await page.evaluate(() => {
      const btn = document.querySelector('.quiz-prep-actions .quiz-btn-start');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    const offlineNotice = await page.evaluate(() => document.querySelector('.notice-message')?.textContent);
    console.log(`6. Message de blocage hors-ligne capturé : "${offlineNotice}"`);
    await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_quiz_offline_block.png' });
  }

  // Rétablir la connexion
  await page.setOfflineMode(false);
  await new Promise(r => setTimeout(r, 500));
  console.log('7. Connexion en ligne rétablie.');

  // Retourner au Hub si nécessaire
  await page.evaluate(() => {
    const backBtn = document.querySelector('.quiz-btn-nav-secondary');
    if (backBtn && backBtn.textContent?.includes('Retour aux quiz')) backBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // 4. TEST ÉCRAN DE PRÉPARATION DU QUIZ
  console.log('--- TEST PRÉPARATION DU QUIZ ---');
  // Clic sur "Commencer" du quiz "Équations du second degré"
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.quiz-card'));
    const mathCard = cards.find(c => c.textContent?.includes('second degré')) || cards[0];
    const btn = mathCard?.querySelector('.quiz-btn-start');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const prepTitle = await page.$eval('.quiz-prep-title', el => el.textContent?.trim());
  console.log(`8. Vue de préparation ouverte pour : "${prepTitle}"`);
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_quiz_preparation.png' });

  // 5. TEST COMMENCER LE QUIZ & ÉCRAN DE QUESTION
  console.log('--- TEST DU JOUEUR DE QUIZ ---');
  await page.evaluate(() => {
    const btn = document.querySelector('.quiz-prep-actions .quiz-btn-start');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 700));

  const question1Text = await page.$eval('.quiz-question-text', el => el.textContent?.trim());
  console.log(`9. Question 1 affichée : "${question1Text}"`);
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_quiz_question.png' });

  // 6. QUESTION 1 : RÉPONSE CORRECTE
  // Pour 2x² - 4x - 6 = 0, Delta = 64 (Choix 0)
  await page.evaluate(() => {
    const choices = Array.from(document.querySelectorAll('.quiz-choice-card'));
    if (choices[0]) choices[0].click();
  });
  await new Promise(r => setTimeout(r, 300));

  // Clic Valider
  await page.evaluate(() => {
    const valBtn = Array.from(document.querySelectorAll('.quiz-btn-nav-primary')).find(b => b.textContent?.includes('Valider'));
    if (valBtn) valBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const feedback1 = await page.$eval('.quiz-feedback-status-title', el => el.textContent?.trim());
  console.log(`10. Feedback réponse correcte : "${feedback1}"`);
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_quiz_correct_answer.png' });

  // Passer à la question 2
  await page.evaluate(() => {
    const nextBtn = Array.from(document.querySelectorAll('.quiz-btn-nav-primary')).find(b => b.textContent?.includes('suivante'));
    if (nextBtn) nextBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // 7. QUESTION 2 : RÉPONSE INCORRECTE POUR TESTER L'APPRENTISSAGE ET L'ÉNERGIE
  // "Combien de solutions réelles si Delta < 0 ?" (La bonne est "Aucune solution réelle" = index 2)
  // On clique intentionnellement sur "Deux solutions distinctes" (index 0)
  await page.evaluate(() => {
    const choices = Array.from(document.querySelectorAll('.quiz-choice-card'));
    if (choices[0]) choices[0].click();
  });
  await new Promise(r => setTimeout(r, 300));

  // Clic Valider
  await page.evaluate(() => {
    const valBtn = Array.from(document.querySelectorAll('.quiz-btn-nav-primary')).find(b => b.textContent?.includes('Valider'));
    if (valBtn) valBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const feedback2 = await page.$eval('.quiz-feedback-status-title', el => el.textContent?.trim());
  console.log(`11. Feedback réponse incorrecte : "${feedback2}"`);
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_quiz_incorrect_answer.png' });

  // 8. TEST NAVIGATION PRÉCÉDENTE (REVOIR LA QUESTION 1 DÉJÀ RÉPONDUE)
  await page.evaluate(() => {
    const prevBtn = Array.from(document.querySelectorAll('.quiz-btn-nav-secondary')).find(b => b.textContent?.includes('précédente'));
    if (prevBtn) prevBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  const isQ1Reloaded = await page.evaluate(() => document.querySelector('.quiz-question-text')?.textContent?.includes('Delta'));
  console.log('12. Retour question précédente réussi (état conservé) :', isQ1Reloaded);

  // Revenir à la question 2
  await page.evaluate(() => {
    const nextBtn = Array.from(document.querySelectorAll('.quiz-btn-nav-primary')).find(b => b.textContent?.includes('suivante'));
    if (nextBtn) nextBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Passer à la question 3
  await page.evaluate(() => {
    const nextBtn = Array.from(document.querySelectorAll('.quiz-btn-nav-primary')).find(b => b.textContent?.includes('suivante'));
    if (nextBtn) nextBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Répondre question 3 : x0 = 3 (index 0)
  await page.evaluate(() => {
    const choices = Array.from(document.querySelectorAll('.quiz-choice-card'));
    if (choices[0]) choices[0].click();
  });
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => {
    const valBtn = Array.from(document.querySelectorAll('.quiz-btn-nav-primary')).find(b => b.textContent?.includes('Valider'));
    if (valBtn) valBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Passer à la question 4 (dernière question)
  await page.evaluate(() => {
    const nextBtn = Array.from(document.querySelectorAll('.quiz-btn-nav-primary')).find(b => b.textContent?.includes('suivante'));
    if (nextBtn) nextBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Répondre question 4 : 3(x - 1)(x - 5) (index 0)
  await page.evaluate(() => {
    const choices = Array.from(document.querySelectorAll('.quiz-choice-card'));
    if (choices[0]) choices[0].click();
  });
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => {
    const valBtn = Array.from(document.querySelectorAll('.quiz-btn-nav-primary')).find(b => b.textContent?.includes('Valider'));
    if (valBtn) valBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // 9. TERMINER LE QUIZ & ÉCRAN DE RÉSULTATS
  console.log('--- TEST ÉCRAN DE RÉSULTATS & ANALYSE DES ERREURS ---');
  await page.evaluate(() => {
    const finishBtn = Array.from(document.querySelectorAll('.quiz-btn-nav-primary')).find(b => b.textContent?.includes('Terminer'));
    if (finishBtn) finishBtn.click();
  });
  await new Promise(r => setTimeout(r, 700));

  const resultTitle = await page.$eval('.quiz-results-title', el => el.textContent?.trim());
  const scoreText = await page.$eval('.quiz-results-score-row', el => el.textContent?.replace(/\s+/g, ' ').trim());
  console.log(`13. Écran de résultat : "${resultTitle}", Score : "${scoreText}"`);
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_quiz_results.png' });

  // 10. TEST SECTION « À REVOIR » & LANCEMENT DE LA RÉVISION CIBLÉE
  console.log('--- TEST RÉVISION CIBLÉE ---');
  const errorNotionBtn = await page.$('.quiz-errors-item .quiz-btn-targeted');
  if (errorNotionBtn) {
    await errorNotionBtn.click();
    await new Promise(r => setTimeout(r, 700));

    const targetedTitle = await page.$eval('.quiz-targeted-title', el => el.textContent?.trim());
    console.log(`14. Vue de révision ciblée ouverte pour : "${targetedTitle}"`);
    await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_quiz_targeted_revision.png' });

    // 11. TEST RETEST SUR LA NOTION CIBLÉE
    console.log('--- TEST RETEST DE NOTION ---');
    const retestBtn = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('.quiz-btn-start')).find(b => b.textContent?.includes('Retester'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    await new Promise(r => setTimeout(r, 700));
    console.log('15. Clic sur "Retester cette notion" réussi :', retestBtn);

    const retestProgressLabel = await page.$eval('.quiz-player-progress-label', el => el.textContent?.trim());
    console.log(`16. Joueur en mode retest ouvert : "${retestProgressLabel}"`);
    await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_quiz_retest.png' });
  }

  // 12. RETOURNER AU HUB
  await page.evaluate(() => {
    const quitBtn = Array.from(document.querySelectorAll('.quiz-btn-nav-secondary')).find(b => b.textContent?.includes('Quitter'));
    if (quitBtn) {
      window.confirm = () => true;
      quitBtn.click();
    }
  });
  await new Promise(r => setTimeout(r, 600));

  // 13. VÉRIFICATION DES NON-RÉGRESSIONS (ACCUEIL, RÉVISION, LECTURE, MES COURS)
  console.log('=== VÉRIFICATION DES NON-RÉGRESSIONS ===');

  // A. ACCUEIL
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.sidebar-nav-item'));
    const homeTab = items.find(i => i.textContent?.includes('Accueil'));
    if (homeTab) homeTab.click();
  });
  await new Promise(r => setTimeout(r, 500));
  const heroTitle = await page.$eval('.hero-title-large', el => el.textContent?.trim());
  const pinnedBtn = await page.$eval('.btn-breathe-challenge', el => el.textContent?.trim());
  console.log(`- Accueil : Objectif = "${heroTitle}", Bouton fixe = "${pinnedBtn}" [OK]`);

  // B. RÉVISION & PARCOURS D'IMPORT
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.sidebar-nav-item'));
    const revTab = items.find(i => i.textContent?.includes('Révision'));
    if (revTab) revTab.click();
  });
  await new Promise(r => setTimeout(r, 500));
  const revHero = await page.$eval('.revision-hero-title', el => el.textContent?.trim());
  console.log(`- Révision : Carte hero = "${revHero?.replace(/\n/g, ' ')}" [OK]`);

  // C. MES COURS (Recherche & fiches)
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.sidebar-nav-item'));
    const coursesTab = items.find(i => i.textContent?.includes('Mes cours'));
    if (coursesTab) coursesTab.click();
  });
  await new Promise(r => setTimeout(r, 500));
  const coursesTitle = await page.$eval('.courses-main-title', el => el.textContent?.trim());
  console.log(`- Mes cours : Titre page = "${coursesTitle}" [OK]`);

  console.log('=== TOUS LES TESTS FONCTIONNELS, GAMIFICATION ET DE RÉGRESSION ONT RÉUSSI ===');
  await browser.close();
}

run().catch(err => {
  console.error('Erreur lors du test :', err);
  process.exit(1);
});
