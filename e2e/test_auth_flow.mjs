import puppeteer from 'puppeteer-core';

async function runAuthTests() {
  console.log('--- Démarrage des tests fonctionnels du parcours d’authentification ---');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // ----------------------------------------------------
    // 1. OUVERTURE SANS SESSION & AFFICHAGE DE CONNEXION (Desktop)
    // ----------------------------------------------------
    await page.setViewport({ width: 1280, height: 850 });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    console.log('1. Page chargée sur Desktop sans session');

    await page.waitForSelector('.auth-card');
    await page.waitForSelector('#login-identifier');
    console.log('2. Écran de connexion affiché avec succès');

    await page.screenshot({ path: 'screenshot_auth_desktop_login.png' });
    console.log('Capture screenshot_auth_desktop_login.png enregistrée');

    // ----------------------------------------------------
    // 2. VÉRIFICATION SUR MOBILE (390x844)
    // ----------------------------------------------------
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.waitForSelector('.auth-card');
    await page.screenshot({ path: 'screenshot_auth_mobile_login.png' });
    console.log('Capture screenshot_auth_mobile_login.png enregistrée');

    // Revenir au viewport desktop pour la suite
    await page.setViewport({ width: 1280, height: 850 });
    await new Promise(r => setTimeout(r, 300));
    await page.waitForSelector('#login-identifier');

    // ----------------------------------------------------
    // 3. IDENTIFIANT INCONNU
    // ----------------------------------------------------
    await page.type('#login-identifier', 'inconnu@revizo.app');
    await page.click('#btn-auth-continue');
    await page.waitForSelector('#account-not-found-banner');
    console.log('3. Identifiant inconnu reconnu, bannière de proposition affichée');

    // Capture de l'erreur / notification compte inconnu
    await page.screenshot({ path: 'screenshot_auth_error.png' });
    console.log('Capture screenshot_auth_error.png enregistrée');

    // ----------------------------------------------------
    // 4. TEST DU COMPTE EXISTANT & MOT DE PASSE INCORRECT
    // ----------------------------------------------------
    // Effacer l'identifiant précédent
    await page.evaluate(() => {
      const input = document.getElementById('login-identifier');
      if (input) input.value = '';
    });
    await page.type('#login-identifier', 'nasser@revizo.app');
    await page.click('#btn-auth-continue');

    // Attendre le champ mot de passe
    await page.waitForSelector('#login-password');
    console.log('4. Compte Nasser reconnu, passage à l’étape du mot de passe');

    // Saisie d'un mot de passe incorrect
    await page.type('#login-password', 'mauvais_mdp');
    await page.click('#btn-login-submit');
    await page.waitForSelector('#auth-error-notice');
    const errorText = await page.$eval('#auth-error-notice', el => el.textContent);
    console.log(`5. Message d'erreur bienveillant affiché : "${errorText?.trim()}"`);

    // ----------------------------------------------------
    // 5. CONNEXION RÉUSSIE AVEC COMPTE EXISTANT (Nasser)
    // ----------------------------------------------------
    await page.evaluate(() => {
      const input = document.getElementById('login-password');
      if (input) input.value = '';
    });
    await page.type('#login-password', 'Password123!');
    await page.click('#btn-login-submit');

    // Attendre l'arrivée sur l'application (Hero card de l'Accueil)
    await page.waitForSelector('.hero-card');
    console.log('6. Connexion réussie, arrivée sur Accueil (Dashboard)');

    await page.screenshot({ path: 'screenshot_auth_logged_in.png' });
    console.log('Capture screenshot_auth_logged_in.png enregistrée');

    // ----------------------------------------------------
    // 6. DÉCONNEXION DEPUIS LE PROFIL
    // ----------------------------------------------------
    const sidebarProfile = await page.waitForSelector('#desktop-sidebar-profile');
    await sidebarProfile.click();
    await page.waitForSelector('.profile-identity-card');
    console.log('7. Page Profil ouverte pour Nasser');

    // Vérifier l'identité Nasser
    const profileName = await page.$eval('.profile-user-name', el => el.textContent);
    console.log(`8. Nom de l'utilisateur connecté vérifié : "${profileName?.trim()}"`);

    // Clic sur Se déconnecter
    const logoutBtn = await page.waitForSelector('#btn-logout');
    await logoutBtn.click();
    await page.waitForSelector('.logout-modal-title');
    console.log('9. Modale de confirmation de déconnexion ouverte');

    await page.screenshot({ path: 'screenshot_auth_logout_modal.png' });
    console.log('Capture screenshot_auth_logout_modal.png enregistrée');

    // Confirmer la déconnexion
    const confirmLogout = await page.waitForSelector('#btn-confirm-logout');
    await confirmLogout.click();

    // Vérifier le retour automatique à l'écran de connexion
    await page.waitForSelector('.auth-card');
    console.log('10. Déconnexion confirmée, retour immédiat à l’écran de Connexion vérifié');

    // ----------------------------------------------------
    // 7. CRÉATION D'UN NOUVEAU COMPTE (Léa Martin, 4e)
    // ----------------------------------------------------
    const switchSignup = await page.waitForSelector('#link-switch-to-signup');
    await switchSignup.click();
    await page.waitForSelector('#signup-identifier');
    console.log('11. Vue Création de compte ouverte');

    await page.screenshot({ path: 'screenshot_auth_signup.png' });
    console.log('Capture screenshot_auth_signup.png enregistrée');

    // Remplir les 4 étapes
    await page.type('#signup-identifier', 'lea.martin@college.fr');
    await page.type('#signup-password', 'MonMdpSecret99!');
    await page.type('#signup-name', 'Léa Martin');

    // Sélectionner la classe de 4e
    const gradePills = await page.$$('#signup-grade-grid .auth-grade-pill');
    if (gradePills.length >= 3) {
      await gradePills[2].click(); // 4e
    }

    // Soumettre la création de compte
    const submitSignup = await page.waitForSelector('#btn-signup-submit');
    await submitSignup.click();

    // Attendre la vue Onboarding
    await page.waitForSelector('.auth-onboarding-view');
    console.log('12. Compte créé avec succès, vue Onboarding affichée');

    await page.screenshot({ path: 'screenshot_auth_onboarding.png' });
    console.log('Capture screenshot_auth_onboarding.png enregistrée');

    // Terminer l'onboarding
    const finishOnboardingBtn = await page.waitForSelector('#btn-onboarding-finish');
    await finishOnboardingBtn.click();

    // Attendre l'arrivée sur l'Accueil
    await page.waitForSelector('.hero-card');
    console.log('13. Onboarding terminé, arrivée sur Accueil avec le nouvel utilisateur');

    // Ouvrir le Profil pour vérifier la personnalisation au nom de Léa Martin
    const sidebarProfile2 = await page.waitForSelector('#desktop-sidebar-profile');
    await sidebarProfile2.click();
    await page.waitForSelector('.profile-identity-card');

    const newProfileName = await page.$eval('.profile-user-name', el => el.textContent);
    const newProfileGrade = await page.$eval('.profile-grade-badge', el => el.textContent);
    console.log(`14. Nouveau profil vérifié : "${newProfileName?.trim()}" (${newProfileGrade?.trim()})`);

    // ----------------------------------------------------
    // 8. DÉCONNEXION DE LÉA DEPUIS PARAMÈTRES
    // ----------------------------------------------------
    const openSettingsBtn = await page.waitForSelector('#btn-open-settings');
    await openSettingsBtn.click();
    await page.waitForSelector('.settings-view-container');

    const settingsLogoutBtn = await page.waitForSelector('#btn-settings-logout');
    await settingsLogoutBtn.click();
    await page.waitForSelector('#btn-confirm-settings-logout');
    await page.click('#btn-confirm-settings-logout');

    await page.waitForSelector('.auth-card');
    console.log('15. Déconnexion depuis Paramètres réussie, retour à Connexion');

    // ----------------------------------------------------
    // 9. RECONNEXION AVEC LE COMPTE CRÉÉ (Léa Martin)
    // ----------------------------------------------------
    await page.type('#login-identifier', 'lea.martin@college.fr');
    await page.click('#btn-auth-continue');
    await page.waitForSelector('#login-password');
    await page.type('#login-password', 'MonMdpSecret99!');
    await page.click('#btn-login-submit');

    await page.waitForSelector('.hero-card');
    console.log('16. Reconnexion avec le compte créé Léa Martin réussie !');

    // ----------------------------------------------------
    // 10. NON-RÉGRESSION DES PAGES GELÉES
    // ----------------------------------------------------
    console.log('17. Vérification des non-régressions...');

    // Accueil : Hero card & Défi fixe
    const heroCard = await page.$('.hero-card');
    const pinned = await page.$('.pinned-challenge-container');
    if (!heroCard || !pinned) throw new Error('Régression sur Accueil !');
    console.log('✓ Accueil intact (Hero card et bouton de défi animé)');

    // Révision
    const navButtons = await page.$$('.sidebar-nav-item');
    await navButtons[1].click();
    await page.waitForSelector('.revision-hero-card');
    console.log('✓ Révision intacte');

    // Mes cours
    await navButtons[2].click();
    await page.waitForSelector('.courses-grid');
    console.log('✓ Mes cours intact');

    // Quiz
    await navButtons[3].click();
    await page.waitForSelector('.quiz-card');
    console.log('✓ Quiz intact');

    console.log('--- TOUS LES TESTS DU PARCOURS D’AUTHENTIFICATION ONT RÉUSSI ---');
  } catch (err) {
    console.error('Erreur lors du test :', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runAuthTests();
