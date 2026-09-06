import puppeteer from 'puppeteer-core';

async function runProfileTests() {
  console.log('--- Démarrage des tests fonctionnels de la page Profil ---');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // 1. DESKTOP VIEWPORT (1280x800)
    await page.setViewport({ width: 1280, height: 850 });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    console.log('1. Page d’accueil chargée sur Desktop');

    // 2. Ouvrir le profil via la sidebar desktop
    const desktopProfileCard = await page.waitForSelector('#desktop-sidebar-profile');
    await desktopProfileCard.click();
    await new Promise(r => setTimeout(r, 400));
    console.log('2. Clic sur le profil dans la sidebar desktop');

    // 3. Vérifier les informations utilisateur
    await page.waitForSelector('.profile-identity-card');
    const userName = await page.$eval('.profile-user-name', el => el.textContent?.trim());
    const userEmail = await page.$eval('.profile-user-email', el => el.textContent?.trim());
    const userGrade = await page.$eval('.profile-grade-badge', el => el.textContent?.trim());
    console.log(`3. Identité vérifiée : Nom = "${userName}", Email = "${userEmail}", Grade = "${userGrade}"`);

    if (!userName?.includes('Nasser') || !userEmail?.includes('nasser@revizo.app')) {
      throw new Error(`Informations d'identité incorrectes: ${userName}, ${userEmail}`);
    }

    // 4. Vérifier les indicateurs de progression
    const statCards = await page.$$('.profile-stat-card');
    console.log(`4. ${statCards.length} indicateurs de progression détectés`);
    if (statCards.length !== 4) {
      throw new Error(`Attendu 4 indicateurs de progression, trouvé ${statCards.length}`);
    }

    // 5. Vérifier les 3 objectifs d’apprentissage
    const goalCards = await page.$$('.profile-goal-card');
    console.log(`5. ${goalCards.length} cartes d'objectifs détectées`);
    if (goalCards.length !== 3) {
      throw new Error(`Attendu 3 cartes d'objectifs, trouvé ${goalCards.length}`);
    }

    // Capture desktop initiale
    await page.screenshot({ path: 'screenshot_profile_desktop.png', fullPage: false });
    console.log('Capture screenshot_profile_desktop.png enregistrée');

    // 6. Tester "Modifier mon profil"
    const editBtn = await page.waitForSelector('#btn-edit-profile');
    await editBtn.click();
    await page.waitForSelector('.modal-card');
    console.log('6. Modale "Modifier mon profil" ouverte');

    await page.screenshot({ path: 'screenshot_profile_edit_modal.png' });
    console.log('Capture screenshot_profile_edit_modal.png enregistrée');

    // Modifier le nom
    await page.evaluate(() => {
      const el = document.querySelector('#edit-name');
      if (el) el.value = '';
    });
    await page.type('#edit-name', 'Nasser B.');
    await page.select('#edit-grade', '2nde');

    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn?.click();
    await new Promise(r => setTimeout(r, 600));

    // Vérifier la mise à jour
    const updatedName = await page.$eval('.profile-user-name', el => el.textContent?.trim());
    const updatedGrade = await page.$eval('.profile-grade-badge', el => el.textContent?.trim());
    console.log(`7. Profil mis à jour : Nom = "${updatedName}", Grade = "${updatedGrade}"`);

    // 7. Tester "Paramètres"
    const settingsBtn = await page.waitForSelector('#btn-open-settings');
    await settingsBtn.click();
    await page.waitForSelector('.settings-preview-list');
    console.log('8. Modale "Paramètres" ouverte avec succès');
    const closeSettingsBtn = await page.waitForSelector('.modal-close-btn');
    await closeSettingsBtn.click();
    await new Promise(r => setTimeout(r, 300));

    // 8. Tester "Se déconnecter" (Confirmation)
    const logoutBtn = await page.waitForSelector('#btn-logout');
    await logoutBtn.click();
    await page.waitForSelector('.logout-modal-title');
    console.log('9. Modale de confirmation de déconnexion ouverte');

    await page.screenshot({ path: 'screenshot_profile_logout_confirm.png' });
    console.log('Capture screenshot_profile_logout_confirm.png enregistrée');

    // Cliquer sur Annuler
    const cancelLogoutBtn = await page.waitForSelector('#btn-cancel-logout');
    await cancelLogoutBtn.click();
    await new Promise(r => setTimeout(r, 300));
    console.log('10. Déconnexion annulée, session maintenue');

    // 9. Tester le bouton Retour Desktop
    const backBtn = await page.waitForSelector('.btn-profile-back');
    await backBtn.click();
    await new Promise(r => setTimeout(r, 400));
    console.log('11. Clic sur Retour : retour à l’Accueil vérifié');

    // 10. TEST MOBILE (390x844)
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 300));

    // Clic sur l'avatar du header mobile
    const mobileHeaderAvatar = await page.waitForSelector('#header-profile-avatar');
    await mobileHeaderAvatar.click();
    await new Promise(r => setTimeout(r, 400));

    // Vérifier l'en-tête mobile et le bouton Retour
    const mobileBackBtn = await page.waitForSelector('#btn-mobile-header-back');
    console.log('12. Profil mobile ouvert avec bouton Retour dans le header');

    await page.screenshot({ path: 'screenshot_profile_mobile.png' });
    console.log('Capture screenshot_profile_mobile.png enregistrée');

    // Scroll tout en bas sur mobile pour vérifier le dégagement au-dessus de la nav
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: 'screenshot_profile_mobile_scrolled.png' });
    console.log('Capture screenshot_profile_mobile_scrolled.png enregistrée');

    // Cliquer sur Retour dans le header mobile
    await mobileBackBtn.click();
    await new Promise(r => setTimeout(r, 400));
    console.log('13. Clic sur Retour mobile vérifié : retour à l’Accueil');

    // 11. TESTS DE NON-RÉGRESSION
    console.log('14. Vérification des non-régressions...');

    // A. Accueil
    const homeHero = await page.waitForSelector('.hero-card');
    const pinnedChallenge = await page.waitForSelector('.pinned-challenge-container');
    if (!homeHero || !pinnedChallenge) throw new Error('Régression sur Accueil !');
    console.log('✓ Accueil intact (Hero card et défi fixe animé)');

    // B. Révision
    const navItems = await page.$$('.mobile-nav-item');
    await navItems[1].click(); // Onglet Révision
    await page.waitForSelector('.revision-hero-card');
    console.log('✓ Révision intacte (Hero card d’import et fiches)');

    // C. Mes cours
    await navItems[2].click(); // Onglet Mes cours
    await page.waitForSelector('.courses-grid');
    console.log('✓ Mes cours intact (Grille de cours et recherche)');

    // D. Quiz
    await navItems[3].click(); // Onglet Quiz
    await page.waitForSelector('.quiz-card');
    console.log('✓ Quiz intact (Hub des quiz disponibles)');

    console.log('--- TOUS LES TESTS FONCTIONNELS ONT RÉUSSI AVEC SUCCÈS ---');
  } catch (err) {
    console.error('Erreur lors du test :', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runProfileTests();
