import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

// SVG optimisé pleine page avec fond opaque pour iOS & Android (aucun artefact noir)
const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <defs>
    <linearGradient id="revizoOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EA580C"/>
      <stop offset="100%" stop-color="#F97316"/>
    </linearGradient>
  </defs>
  <!-- Fond opaque plein format (iOS applique son propre masque squircle sans coin noir) -->
  <rect width="48" height="48" fill="url(#revizoOrangeGrad)"/>
  <path d="M14 14H34V20C34 23.3137 31.3137 26 28 26H20C16.6863 26 14 28.6863 14 32V34H34" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="34" cy="34" r="3" fill="#FEF08A"/>
  <circle cx="14" cy="14" r="3" fill="#FFFFFF"/>
</svg>
`;

async function generateIcons() {
  console.log('Launching browser to render opaque iOS & Android PWA icons...');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Tailles officielles : 180x180 pour iOS (apple-touch-icon), 192 et 512 pour Android PWA
  const targets = [
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'apple-touch-icon-180.png', size: 180 },
    { name: 'revizo-logo-192.png', size: 192 },
    { name: 'revizo-logo-512.png', size: 512 }
  ];

  for (const target of targets) {
    const page = await browser.newPage();
    await page.setViewport({ width: target.size, height: target.size, deviceScaleFactor: 1 });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: #EA580C; width: ${target.size}px; height: ${target.size}px; overflow: hidden; }
            svg { width: ${target.size}px; height: ${target.size}px; display: block; }
          </style>
        </head>
        <body>
          ${iconSvg}
        </body>
      </html>
    `;

    await page.setContent(html);
    const outPath = path.join(publicDir, target.name);
    // Fond 100% opaque pour garantir un rendu parfait sur iPhone et Android
    await page.screenshot({ path: outPath, omitBackground: false });
    console.log(`Generated opaque icon: ${outPath} (${target.size}x${target.size})`);
    await page.close();
  }

  await browser.close();
  console.log('All opaque icons generated successfully!');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
