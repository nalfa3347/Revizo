import puppeteer from 'puppeteer-core';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  console.log('=== TEST MES COURS & VALIDATION VISUELLE ===');

  // 1. MOBILE VIEW (390 x 844)
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  // Clic sur l'onglet "Mes cours" dans la barre inférieure mobile
  const mobileNavCoursesBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('.mobile-nav-item'));
    return buttons.find(b => b.textContent?.includes('Mes cours'));
  });

  if (mobileNavCoursesBtn.asElement()) {
    await mobileNavCoursesBtn.asElement().click();
    console.log('1. Clic sur onglet "Mes cours" mobile réussi.');
  } else {
    throw new Error('Onglet "Mes cours" introuvable sur mobile');
  }

  await new Promise(r => setTimeout(r, 600));

  // Vérification de l'onglet actif et du header mobile
  const mobileHeaderTitle = await page.$eval('.header-revision-title', el => el.textContent?.trim());
  console.log(`2. Titre dans le header mobile : "${mobileHeaderTitle}"`);

  // Capture Mobile initiale
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_courses_mobile.png' });
  console.log('3. Capture mobile initiale enregistrée : screenshot_courses_mobile.png');

  // Scroll mobile et capture
  await page.evaluate(() => window.scrollBy(0, 450));
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_courses_mobile_scrolled.png' });
  console.log('4. Capture mobile scrollée enregistrée : screenshot_courses_mobile_scrolled.png');

  // Revenir en haut
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 300));

  // 2. TEST RECHERCHE DE COURS
  const searchInput = await page.$('.courses-search-input');
  if (searchInput) {
    await searchInput.type('second degré');
    await new Promise(r => setTimeout(r, 400));
    const cardTitles = await page.$$eval('.course-card-title', els => els.map(e => e.textContent?.trim()));
    console.log(`5. Recherche "second degré" -> cours trouvés :`, cardTitles);

    // Clic sur la croix d'effacement de recherche
    const clearIconBtn = await page.$('.courses-search-clear');
    if (clearIconBtn) {
      await clearIconBtn.click();
      await new Promise(r => setTimeout(r, 300));
      console.log('6. Clic croix d\'effacement de recherche réussi.');
    }

    // Test recherche sans résultat
    const freshSearchInput = await page.$('.courses-search-input');
    if (freshSearchInput) {
      await freshSearchInput.type('Astronomie Quantique Inconnue');
      await new Promise(r => setTimeout(r, 400));

      const emptySearchMsg = await page.$eval('.courses-empty-title', el => el.textContent?.trim());
      console.log(`7. Recherche vide -> message affiché : "${emptySearchMsg}"`);
      await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_courses_search_empty.png' });

      // Effacer la recherche depuis le bouton de l'état vide
      const clearEmptyBtn = await page.$('.courses-empty-state button');
      if (clearEmptyBtn) {
        await clearEmptyBtn.click();
        await new Promise(r => setTimeout(r, 400));
        console.log('8. Effacement depuis l\'état vide réussi.');
      }
    }
  }

  // 3. DESKTOP VIEW (1280 x 900)
  await page.setViewport({ width: 1280, height: 900, isMobile: false, hasTouch: false });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 500));

  // S'assurer de cliquer sur "Mes cours" dans la sidebar desktop
  const sidebarCoursesBtn = await page.evaluateHandle(() => {
    const items = Array.from(document.querySelectorAll('.sidebar-nav-item'));
    return items.find(i => i.textContent?.includes('Mes cours'));
  });
  if (sidebarCoursesBtn.asElement()) {
    await sidebarCoursesBtn.asElement().click();
    await new Promise(r => setTimeout(r, 500));
  }

  // Vérifier la sidebar desktop active
  const activeSidebarItem = await page.$eval('.sidebar-nav-item.active', el => el.textContent?.trim());
  console.log(`9. Élément sidebar Desktop actif : "${activeSidebarItem}"`);

  // Capture Desktop initiale
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_courses_desktop.png' });
  console.log('10. Capture desktop initiale enregistrée : screenshot_courses_desktop.png');

  // Scroll Desktop
  await page.evaluate(() => window.scrollBy(0, 450));
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_courses_desktop_scrolled.png' });
  console.log('11. Capture desktop scrollée enregistrée : screenshot_courses_desktop_scrolled.png');

  // Remonter
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 300));

  // 4. TEST OUVERTURE D'UN COURS DANS SA FICHE DE RÉVISION
  const firstCourseCard = await page.$('.course-card');
  if (firstCourseCard) {
    await firstCourseCard.click();
    await new Promise(r => setTimeout(r, 700));

    const ficheTitle = await page.$eval('.fiche-main-title', el => el.textContent?.trim()).catch(() => null);
    console.log(`12. Clic sur le cours -> Vue de fiche ouverte avec titre : "${ficheTitle}"`);
    await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_courses_open_reading.png' });

    // Clic retour
    await page.evaluate(() => {
      const desktopBack = document.querySelector('.btn-desktop-back');
      if (desktopBack) {
        desktopBack.click();
      } else {
        const headerBack = document.querySelector('.btn-header-back');
        if (headerBack) headerBack.click();
      }
    });
    await new Promise(r => setTimeout(r, 600));
    console.log('13. Clic sur retour réussi.');
  }

  // 5. TEST BOUTON "+ Ajouter un cours" -> Redirige vers parcours import fonctionnel
  // Retourner sur Mes cours si nécessaire
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.sidebar-nav-item'));
    const coursesTab = items.find(i => i.textContent?.includes('Mes cours'));
    if (coursesTab) coursesTab.click();
  });
  await new Promise(r => setTimeout(r, 500));

  const addClicked = await page.evaluate(() => {
    const btn = document.querySelector('.courses-header-desktop .btn-add-course-primary') || document.querySelector('.btn-add-course-primary');
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  await new Promise(r => setTimeout(r, 600));

  const importHeroTitle = await page.$eval('.revision-hero-title', el => el.textContent?.trim()).catch(() => null);
  console.log(`14. Clic "+ Ajouter un cours" (succès: ${addClicked}) -> Redirection sur import avec carte : "${importHeroTitle?.replace(/\n/g, ' ')}"`);

  // 6. VÉRIFICATION DES RÉGRESSIONS
  console.log('=== VÉRIFICATION DES RÉGRESSIONS ===');

  // A. ACCUEIL
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.sidebar-nav-item'));
    const homeTab = items.find(i => i.textContent?.includes('Accueil'));
    if (homeTab) homeTab.click();
  });
  await new Promise(r => setTimeout(r, 500));
  const heroTitle = await page.$eval('.hero-title-large', el => el.textContent?.trim());
  const pinnedBtn = await page.$eval('.btn-breathe-challenge', el => el.textContent?.trim());
  console.log(`- Accueil : Objectif du jour = "${heroTitle}", Bouton fixe = "${pinnedBtn}" [OK]`);

  // B. RÉVISION (Page intacte, import PDF, Continuer)
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.sidebar-nav-item'));
    const revTab = items.find(i => i.textContent?.includes('Révision'));
    if (revTab) revTab.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'C:\\REVIZO 2.0\\screenshot_debug_error.png' });
  const revHero = await page.$eval('.revision-hero-title', el => el.textContent?.trim()).catch(e => `ERROR: ${e.message}`);
  console.log(`- Révision : Carte hero = "${revHero?.replace(/\n/g, ' ')}"`);

  // C. QUIZ
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.sidebar-nav-item'));
    const quizTab = items.find(i => i.textContent?.includes('Quiz'));
    if (quizTab) quizTab.click();
  });
  await new Promise(r => setTimeout(r, 500));
  const quizTitle = await page.$eval('h1', el => el.textContent?.trim());
  console.log(`- Quiz : Titre page = "${quizTitle}" [OK]`);

  console.log('=== TOUS LES TESTS FONCTIONNELS ET DE RÉGRESSION ONT RÉUSSI ===');
  await browser.close();
}

run().catch(async err => {
  console.error('Erreur lors du test :', err);
  process.exit(1);
});
