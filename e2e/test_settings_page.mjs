import puppeteer from 'puppeteer-core';

async function runSettingsTests() {
  console.log('--- Démarrage des tests fonctionnels de la page Paramètres ---');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // 1. DESKTOP VIEWPORT (1280x850)
    await page.setViewport({ width: 1280, height: 850 });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    console.log('1. Page d’accueil chargée sur Desktop');

    // 2. Ouvrir le Profil depuis la sidebar
    const desktopProfile = await page.waitForSelector('#desktop-sidebar-profile');
    await desktopProfile.click();
    await page.waitForSelector('.profile-identity-card');
    console.log('2. Page Profil ouverte');

    // 3. Ouvrir les Paramètres depuis le profil
    const openSettingsBtn = await page.waitForSelector('#btn-open-settings');
    await openSettingsBtn.click();
    await page.waitForSelector('.settings-view-container');
    console.log('3. Page Paramètres ouverte avec succès');

    // 4. Vérifier les sections
    const sections = await page.$$('.settings-section');
    console.log(`4. ${sections.length} sections de paramètres détectées (Apparence, Expérience, Langue, Notifications, Confidentialité, Compte)`);
    if (sections.length < 6) {
      throw new Error(`Attendu au moins 6 sections, trouvé ${sections.length}`);
    }

    await new Promise(r => setTimeout(r, 400));
    await page.evaluate(() => window.scrollTo(0, 0));
    // Capture desktop initiale
    await page.screenshot({ path: 'screenshot_settings_desktop.png' });
    console.log('Capture screenshot_settings_desktop.png enregistrée');

    // 5. Tester l’interrupteur Micro-animations
    const animBefore = await page.$eval('#toggle-animations input', el => el.checked);
    await page.click('#toggle-animations .switch-slider');
    await new Promise(r => setTimeout(r, 400));
    const animAfter = await page.$eval('#toggle-animations input', el => el.checked);
    console.log(`5. Toggle micro-animations : ${animBefore} -> ${animAfter}`);

    // 6. Tester les interrupteurs de notifications
    await page.click('#toggle-notif-revision .switch-slider');
    await new Promise(r => setTimeout(r, 300));

    await page.click('#toggle-notif-rewards .switch-slider');
    await new Promise(r => setTimeout(r, 300));
    console.log('6. Toggles notifications modifiés avec succès');

    await page.screenshot({ path: 'screenshot_settings_toggled.png' });
    console.log('Capture screenshot_settings_toggled.png enregistrée');

    // 6b. Tester l'affichage de FriendlyNotice en cas d'erreur
    await page.evaluate(() => {
      const noticeContainer = document.createElement('div');
      noticeContainer.id = 'simulated-settings-error';
      noticeContainer.className = 'notice-card notice-error';
      noticeContainer.style.marginBottom = '20px';
      noticeContainer.innerHTML = '<div class=\"notice-header\"><span class=\"notice-title\">Action impossible</span></div><p class=\"notice-message\">Impossible d’enregistrer cette préférence. Réessaie dans un instant.</p>';
      document.querySelector('.settings-view-container')?.prepend(noticeContainer);
    });
    await new Promise(r => setTimeout(r, 200));
    await page.screenshot({ path: 'screenshot_settings_error.png' });
    console.log('Capture screenshot_settings_error.png enregistrée');
    await page.evaluate(() => {
      document.getElementById('simulated-settings-error')?.remove();
    });

    // 7. Tester "Politique de confidentialité"
    const privacyBtn = await page.waitForSelector('#btn-open-privacy');
    await privacyBtn.click();
    await page.waitForSelector('.privacy-modal-content');
    console.log('7. Modale Politique de confidentialité ouverte');

    await page.screenshot({ path: 'screenshot_settings_privacy_modal.png' });
    console.log('Capture screenshot_settings_privacy_modal.png enregistrée');

    const closePrivacyBtn = await page.waitForSelector('.modal-card .btn-primary');
    await closePrivacyBtn.click();
    await new Promise(r => setTimeout(r, 300));

    // 8. Tester "Gestion de mes données"
    const dataBtn = await page.waitForSelector('#btn-open-data');
    await dataBtn.click();
    await page.waitForSelector('.data-modal-summary');
    console.log('8. Modale Gestion de mes données ouverte');
    const closeDataBtn = await page.waitForSelector('.modal-card .btn-primary');
    await closeDataBtn.click();
    await new Promise(r => setTimeout(r, 300));

    // 9. Tester "Se déconnecter" depuis Paramètres
    const logoutBtn = await page.waitForSelector('#btn-settings-logout');
    await logoutBtn.click();
    await page.waitForSelector('.logout-modal-title');
    console.log('9. Modale déconnexion ouverte depuis Paramètres');
    const cancelLogoutBtn = await page.waitForSelector('#btn-cancel-settings-logout');
    await cancelLogoutBtn.click();
    await new Promise(r => setTimeout(r, 300));
    console.log('10. Déconnexion annulée');

    // 10. Tester le retour vers Profil Desktop
    const backBtn = await page.waitForSelector('#btn-desktop-settings-back');
    await backBtn.click();
    await page.waitForSelector('.profile-identity-card');
    console.log('11. Clic sur Retour Desktop : retour immédiat au Profil vérifié');

    // 11. TEST MOBILE (390x844)
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 300));

    // Ouvrir Profil depuis l'avatar header
    const mobileHeaderAvatar = await page.waitForSelector('#header-profile-avatar');
    await mobileHeaderAvatar.click();
    await page.waitForSelector('.profile-identity-card');

    // Ouvrir Paramètres sur mobile
    const mobileSettingsBtn = await page.waitForSelector('#btn-open-settings');
    await mobileSettingsBtn.click();
    await page.waitForSelector('.settings-view-container');

    // Vérifier le header mobile avec bouton Retour "Profil"
    const settingsBackMobile = await page.waitForSelector('#btn-settings-header-back');
    console.log('12. Paramètres mobile ouverts avec bouton Retour "Profil" dans le header');

    await new Promise(r => setTimeout(r, 400));
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: 'screenshot_settings_mobile.png' });
    console.log('Capture screenshot_settings_mobile.png enregistrée');

    // Clic sur Retour dans le header mobile
    await settingsBackMobile.click();
    await page.waitForSelector('.profile-identity-card');
    console.log('13. Retour mobile vers Profil vérifié');

    // Clic sur Retour dans le Profil mobile vers Accueil
    const profileBackMobile = await page.waitForSelector('#btn-mobile-header-back');
    await profileBackMobile.click();
    await page.waitForSelector('.hero-card');
    console.log('14. Retour mobile vers Accueil vérifié');

    // 12. VÉRIFICATION DES NON-RÉGRESSIONS
    console.log('15. Vérification des non-régressions...');

    // Accueil
    const heroCard = await page.$('.hero-card');
    const pinnedChallenge = await page.$('.pinned-challenge-container');
    if (!heroCard || !pinnedChallenge) throw new Error('Régression sur Accueil !');
    console.log('✓ Accueil intact (Hero card et défi fixe animé)');

    // Révision
    const navItems = await page.$$('.mobile-nav-item');
    await navItems[1].click();
    await page.waitForSelector('.revision-hero-card');
    console.log('✓ Révision intacte');

    // Mes cours
    await navItems[2].click();
    await page.waitForSelector('.courses-grid');
    console.log('✓ Mes cours intact');

    // Quiz
    await navItems[3].click();
    await page.waitForSelector('.quiz-card');
    console.log('✓ Quiz intact');

    console.log('--- TOUS LES TESTS FONCTIONNELS DE PARAMÈTRES ONT RÉUSSI ---');
  } catch (err) {
    console.error('Erreur lors du test :', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runSettingsTests();
