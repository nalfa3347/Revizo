import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');
const svgPath = path.join(publicDir, 'revizo-logo.svg');
const svgContent = fs.readFileSync(svgPath, 'utf-8');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function generateIcons() {
  console.log('Launching browser to render high-resolution PWA icons...');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const sizes = [192, 512];

  for (const size of sizes) {
    const page = await browser.newPage();
    await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
    
    // Render SVG filling the viewport
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: transparent; width: ${size}px; height: ${size}px; overflow: hidden; }
            svg { width: ${size}px; height: ${size}px; display: block; }
          </style>
        </head>
        <body>
          ${svgContent}
        </body>
      </html>
    `;
    
    await page.setContent(html);
    const outPath = path.join(publicDir, `revizo-logo-${size}.png`);
    await page.screenshot({ path: outPath, omitBackground: true });
    console.log(`Generated: ${outPath} (${size}x${size})`);
    await page.close();
  }

  await browser.close();
  console.log('Icons generated successfully!');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
