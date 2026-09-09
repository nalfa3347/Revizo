import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('REVIZO — Tests de Conformité iPhone, Téléchargement & Responsive iOS', () => {
  const rootDir = path.resolve(__dirname, '../..');

  it('1. Vérifie la présence et la conformité des balises Meta iOS & Viewport dans index.html', () => {
    const indexPath = path.join(rootDir, 'index.html');
    expect(fs.existsSync(indexPath)).toBe(true);
    const indexHtml = fs.readFileSync(indexPath, 'utf-8');

    // Viewport-fit=cover indispensable pour gérer l'encoche (Notch) et la Dynamic Island
    expect(indexHtml).toContain('viewport-fit=cover');
    expect(indexHtml).toContain('width=device-width');

    // Métadonnées Apple Web App
    expect(indexHtml).toContain('apple-mobile-web-app-capable');
    expect(indexHtml).toContain('content="yes"');
    expect(indexHtml).toContain('apple-mobile-web-app-status-bar-style');
    expect(indexHtml).toContain('apple-mobile-web-app-title');
    expect(indexHtml).toContain('content="REVIZO"');

    // Anti-formatage intempestif des numéros en liens bleus par Safari
    expect(indexHtml).toContain('name="format-detection" content="telephone=no"');

    // Icônes Apple Touch Icon (standard, 180x180, et precomposed)
    expect(indexHtml).toContain('rel="apple-touch-icon" href="/apple-touch-icon.png"');
    expect(indexHtml).toContain('sizes="180x180"');
    expect(indexHtml).toContain('rel="apple-touch-icon-precomposed"');
  });

  it('2. Vérifie que l\'icône Apple Touch Icon existe, mesure exactement 180x180 px et est opaque', () => {
    const iconPath = path.join(rootDir, 'public', 'apple-touch-icon.png');
    expect(fs.existsSync(iconPath)).toBe(true);

    const buf = fs.readFileSync(iconPath);
    // Signature PNG standard
    expect(buf.slice(0, 8).toString('hex')).toBe('89504e470d0a1a0a');

    // Largeur et hauteur dans le chunk IHDR (offsets 16 et 20)
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    expect(width).toBe(180);
    expect(height).toBe(180);

    // Type de couleur (offset 25) : 2 = Truecolor RGB (sans canal alpha transparent qui deviendrait noir sur iOS)
    const colorType = buf[25];
    expect(colorType).toBe(2);
  });

  it('3. Vérifie que le Web App Manifest est valide et configuré pour le mode standalone plein écran', () => {
    const manifestPath = path.join(rootDir, 'public', 'manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(manifestContent.short_name).toBe('REVIZO');
    expect(manifestContent.display).toBe('standalone');
    expect(manifestContent.orientation).toBe('portrait-primary');
    expect(manifestContent.theme_color).toBe('#EA580C');

    // Vérifie la présence des icônes 180x180, 192x192 et 512x512
    const iconSizes = manifestContent.icons.map((ic: { sizes: string }) => ic.sizes);
    expect(iconSizes).toContain('180x180');
    expect(iconSizes).toContain('192x192');
    expect(iconSizes).toContain('512x512');
  });

  it('4. Vérifie les règles CSS indispensables pour iPhone (Anti-zoom Safari 16px & Safe Area Insets)', () => {
    // Vérification de layout.css pour safe-area-inset-bottom sur la barre de navigation
    const layoutCssPath = path.join(rootDir, 'src', 'styles', 'layout.css');
    const layoutCss = fs.readFileSync(layoutCssPath, 'utf-8');
    expect(layoutCss).toContain('env(safe-area-inset-bottom');
    expect(layoutCss).toContain('env(safe-area-inset-top');

    // Vérification de components.css pour la règle anti-zoom Safari (taille >= 16px sur inputs)
    const compCssPath = path.join(rootDir, 'src', 'styles', 'components.css');
    const compCss = fs.readFileSync(compCssPath, 'utf-8');
    expect(compCss).toContain('font-size: 16px !important');
    expect(compCss).toContain('.modal-overlay');
    expect(compCss).toContain('-webkit-backdrop-filter');

    // Vérification de landing.css pour la protection du Home Indicator sur le bandeau d'installation
    const landingCssPath = path.join(rootDir, 'src', 'styles', 'landing.css');
    const landingCss = fs.readFileSync(landingCssPath, 'utf-8');
    expect(landingCss).toContain('bottom: calc(16px + env(safe-area-inset-bottom');
    expect(landingCss).toContain('min(90vh, 90dvh)');
  });

  it('5. Vérifie que le menu mobile Landing et PwaInstallButton intègrent le guide iOS', () => {
    const navbarPath = path.join(rootDir, 'src', 'components', 'landing', 'LandingNavbar.tsx');
    const navbarContent = fs.readFileSync(navbarPath, 'utf-8');
    expect(navbarContent).toContain('Installer l\'application');
    expect(navbarContent).toContain('revizo:open-pwa-install');

    const pwaBtnPath = path.join(rootDir, 'src', 'components', 'landing', 'PwaInstallButton.tsx');
    const pwaContent = fs.readFileSync(pwaBtnPath, 'utf-8');
    expect(pwaContent).toContain('revizo:open-pwa-install');
    expect(pwaContent).toContain('Sur votre écran d\'accueil');
    expect(pwaContent).toContain('Partager');
    expect(pwaContent).toContain('Ajouter');
  });
});
