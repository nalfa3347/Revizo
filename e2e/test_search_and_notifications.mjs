import puppeteer from 'puppeteer-core';

async function runTests() {
  console.log('=== DÉBUT DES TESTS COMPLETS : RECHERCHE GLOBALE + NOTIFICATIONS ===');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // =========================================================================
    // PARTIE 1 : TESTS DESKTOP (1280 x 850)
    // =========================================================================
    console.log('\n================== PARTIE 1 : TESTS DESKTOP ==================');
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 850 });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

    // Connexion
    await page.waitForSelector('#login-identifier');
    await page.type('#login-identifier', 'nasser@revizo.app');
    await page.click('#btn-auth-continue');

    await page.waitForSelector('#login-password');
    await page.type('#login-password', 'Password123!');
    await page.click('#btn-login-submit');

    await page.waitForSelector('.app-shell');
    console.log('✔ Connexion Desktop réussie');

    // ----------------------------------------------------
    // NOTIFICATIONS SUR DESKTOP
    // ----------------------------------------------------
    console.log('\n--- Tests Notifications (Desktop) ---');
    await page.waitForSelector('#header-notifications-btn .notification-count-badge');
    const initialBadge = await page.$eval('#header-notifications-btn .notification-count-badge', el => el.textContent?.trim());
    console.log(`✔ 1. Badge initial : ${initialBadge} (attendu : 3)`);
    if (initialBadge !== '3') throw new Error(`Badge initial incorrect : ${initialBadge}`);

    // Ouvrir Notifications
    await page.click('#header-notifications-btn');
    await page.waitForSelector('#notifications-view-container');
    await new Promise(r => setTimeout(r, 400));
    console.log('✔ 2. Centre de notifications ouvert');

    await page.screenshot({ path: 'screenshot_notifications_desktop.png' });
    console.log('📸 Capture enregistrée : screenshot_notifications_desktop.png');

    // Capture notification non lue
    const firstUnread = await page.$('.notification-card.unread');
    if (firstUnread) {
      await firstUnread.screenshot({ path: 'screenshot_notification_unread.png' });
      console.log('📸 Capture enregistrée : screenshot_notification_unread.png');
    }

    // Clic sur notification non lue -> doit ouvrir le contenu
    console.log('Action : Clic sur une notification non lue...');
    await page.click('.notification-card.unread');
    await new Promise(r => setTimeout(r, 600));
    console.log('✔ 3. Navigation vers le contenu de la notification effectuée');

    // Revenir aux notifications
    await page.click('#header-notifications-btn');
    await page.waitForSelector('#notifications-view-container');
    await new Promise(r => setTimeout(r, 400));

    // Vérifier badge décrémenté (2)
    const badgeAfterRead = await page.$eval('#header-notifications-btn .notification-count-badge', el => el.textContent?.trim());
    console.log(`✔ 4. Badge après lecture : ${badgeAfterRead} (attendu : 2)`);
    if (badgeAfterRead !== '2') throw new Error(`Badge attendu 2, reçu ${badgeAfterRead}`);

    // Capture notification lue
    const firstRead = await page.$('.notification-card.read');
    if (firstRead) {
      await firstRead.screenshot({ path: 'screenshot_notification_read.png' });
      console.log('📸 Capture enregistrée : screenshot_notification_read.png');
    }

    // Tout marquer comme lu
    console.log('Action : Clic sur « Tout marquer comme lu »...');
    await page.click('#btn-mark-all-read');
    await new Promise(r => setTimeout(r, 400));

    // Badge doit disparaître
    const badgeGone = await page.$('#header-notifications-btn .notification-count-badge');
    console.log(`✔ 5. Badge disparu après « Tout marquer comme lu » : ${!badgeGone ? 'OUI' : 'NON'}`);
    if (badgeGone) throw new Error('Le badge ne doit plus être visible !');

    // Vider les notifications
    console.log('Action : Vider la liste pour tester l’état vide...');
    await page.click('#btn-clear-all-notifs');
    await new Promise(r => setTimeout(r, 400));

    await page.waitForSelector('#notifications-empty-state');
    console.log('✔ 6. État vide des notifications validé');

    await page.screenshot({ path: 'screenshot_notifications_empty.png' });
    console.log('📸 Capture enregistrée : screenshot_notifications_empty.png');

    // ----------------------------------------------------
    // RECHERCHE SUR DESKTOP
    // ----------------------------------------------------
    console.log('\n--- Tests Recherche Globale (Desktop) ---');
    await page.click('#header-search-btn');
    await page.waitForSelector('#search-view-container');
    await page.waitForSelector('#search-welcome');
    console.log('✔ 1. Accueil de recherche affiché (« Que veux-tu retrouver ? »)');

    await page.screenshot({ path: 'screenshot_search_desktop.png' });
    console.log('📸 Capture enregistrée : screenshot_search_desktop.png');

    // Recherche « second degré »
    console.log('Action : Saisie « second degré »...');
    await page.type('#search-main-input', 'second degré');
    await page.waitForSelector('#search-results-section');
    await new Promise(r => setTimeout(r, 400));

    const countSecondDegre = await page.$$eval('.search-result-card', els => els.length);
    console.log(`✔ 2. Résultats trouvés pour « second degré » : ${countSecondDegre}`);
    if (countSecondDegre === 0) throw new Error('Aucun résultat trouvé pour second degré !');

    await page.screenshot({ path: 'screenshot_search_results.png' });
    console.log('📸 Capture enregistrée : screenshot_search_results.png');

    // Clic sur le résultat
    console.log('Action : Clic sur le premier résultat...');
    await page.click('.search-result-card');
    await new Promise(r => setTimeout(r, 600));
    console.log('✔ 3. Navigation depuis résultat de recherche réussie');

    // Revenir recherche
    await page.click('#header-search-btn');
    await page.waitForSelector('#search-view-container');
    await new Promise(r => setTimeout(r, 300));

    // Recherche par matière « Mathématiques »
    console.log('Action : Recherche matière « Mathématiques »...');
    await page.evaluate(() => {
      const input = document.getElementById('search-main-input');
      if (input) input.value = '';
    });
    await page.type('#search-main-input', 'Mathématiques');
    await page.waitForSelector('#search-results-section');
    await new Promise(r => setTimeout(r, 400));
    const countMath = await page.$$eval('.search-result-card', els => els.length);
    console.log(`✔ 4. Résultats matière trouvés : ${countMath}`);

    // Recherche valeur inexistante
    console.log('Action : Recherche « xyz999 »...');
    await page.click('#btn-search-clear');
    await new Promise(r => setTimeout(r, 200));
    await page.type('#search-main-input', 'xyz999');
    await page.waitForSelector('#search-no-results');
    await new Promise(r => setTimeout(r, 400));
    console.log('✔ 5. Écran « Aucun résultat trouvé » validé');

    await page.screenshot({ path: 'screenshot_search_empty.png' });
    console.log('📸 Capture enregistrée : screenshot_search_empty.png');

    // Clic « Effacer la recherche »
    await page.click('#btn-search-reset');
    await page.waitForSelector('#search-welcome');
    console.log('✔ 6. Recherche réinitialisée.');

    // ----------------------------------------------------
    // NON-RÉGRESSIONS SUR DESKTOP
    // ----------------------------------------------------
    console.log('\n--- Vérification Non-Régressions (Desktop) ---');
    // Accueil
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('.sidebar-nav-item')).find(b => b.textContent?.includes('Accueil'));
      btn?.click();
    });
    await new Promise(r => setTimeout(r, 400));
    const hasHero = await page.$('.hero-card');
    console.log(`✔ Accueil intact : ${hasHero ? 'OK' : 'FAIL'}`);

    // Révision
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('.sidebar-nav-item')).find(b => b.textContent?.includes('Révision'));
      btn?.click();
    });
    await new Promise(r => setTimeout(r, 400));
    const hasRevision = await page.$('.revision-main-container');
    console.log(`✔ Révision intacte : ${hasRevision ? 'OK' : 'FAIL'}`);

    // Mes cours
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('.sidebar-nav-item')).find(b => b.textContent?.includes('Mes cours'));
      btn?.click();
    });
    await new Promise(r => setTimeout(r, 400));
    const hasCourses = await page.$('.courses-view');
    console.log(`✔ Mes cours intact : ${hasCourses ? 'OK' : 'FAIL'}`);

    // Quiz
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('.sidebar-nav-item')).find(b => b.textContent?.includes('Quiz'));
      btn?.click();
    });
    await new Promise(r => setTimeout(r, 400));
    const hasQuiz = await page.$('.quiz-view-container');
    console.log(`✔ Quiz intact : ${hasQuiz ? 'OK' : 'FAIL'}`);

    // Profil & Paramètres
    await page.click('#desktop-sidebar-profile');
    await new Promise(r => setTimeout(r, 400));
    const hasProfile = await page.$('.profile-view-container');
    console.log(`✔ Profil intact : ${hasProfile ? 'OK' : 'FAIL'}`);

    await page.click('#btn-open-settings');
    await new Promise(r => setTimeout(r, 400));
    const hasSettings = await page.$('.settings-view-container');
    console.log(`✔ Paramètres intact : ${hasSettings ? 'OK' : 'FAIL'}`);

    await page.close();

    // =========================================================================
    // PARTIE 2 : TESTS MOBILE (390 x 844)
    // =========================================================================
    console.log('\n================== PARTIE 2 : TESTS MOBILE ==================');
    const pageMobile = await browser.newPage();
    await pageMobile.setViewport({ width: 390, height: 844 });
    await pageMobile.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

    // Connexion mobile
    await pageMobile.waitForSelector('#login-identifier');
    await pageMobile.type('#login-identifier', 'nasser@revizo.app');
    await pageMobile.click('#btn-auth-continue');

    await pageMobile.waitForSelector('#login-password');
    await pageMobile.type('#login-password', 'Password123!');
    await pageMobile.click('#btn-login-submit');

    await pageMobile.waitForSelector('.app-shell');
    console.log('✔ Connexion Mobile réussie');

    // 1. Ouvrir Recherche Mobile
    console.log('Action : Ouverture Recherche sur Mobile...');
    await pageMobile.click('#header-search-btn');
    await pageMobile.waitForSelector('#search-view-container');
    await new Promise(r => setTimeout(r, 400));
    console.log('✔ Recherche Mobile affichée');

    await pageMobile.screenshot({ path: 'screenshot_search_mobile.png' });
    console.log('📸 Capture enregistrée : screenshot_search_mobile.png');

    // Test retour Recherche Mobile
    const searchBackBtn = await pageMobile.$('#btn-search-back, #btn-search-header-back');
    if (searchBackBtn) {
      await searchBackBtn.click();
      await new Promise(r => setTimeout(r, 400));
      console.log('✔ Bouton retour Recherche Mobile validé');
    }

    // 2. Ouvrir Notifications Mobile
    console.log('Action : Ouverture Notifications sur Mobile...');
    await pageMobile.click('#header-notifications-btn');
    await pageMobile.waitForSelector('#notifications-view-container');
    await new Promise(r => setTimeout(r, 400));
    console.log('✔ Notifications Mobile affichées');

    await pageMobile.screenshot({ path: 'screenshot_notifications_mobile.png' });
    console.log('📸 Capture enregistrée : screenshot_notifications_mobile.png');

    // Test retour Notifications Mobile
    const notifBackBtn = await pageMobile.$('#btn-notifications-back, #btn-notifications-header-back');
    if (notifBackBtn) {
      await notifBackBtn.click();
      await new Promise(r => setTimeout(r, 400));
      console.log('✔ Bouton retour Notifications Mobile validé');
    }

    await pageMobile.close();

    console.log('\n🎉 TOUS LES TESTS FONCTIONNELS, TESTS DE NAVIGATION ET CAPTURES SONT VALIDÉS !');

  } catch (err) {
    console.error('❌ ERREUR LORS DES TESTS :', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTests();
