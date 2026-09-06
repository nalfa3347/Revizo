import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ Fichier .env.local introuvable à la racine du projet.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split(/\r?\n/);
const entries = [];

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const match = trimmed.match(/^([A-Za-z0-9_]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    entries.push({ key, value });
  }
}

if (entries.length === 0) {
  console.log('⚠️ Aucune variable trouvée dans .env.local.');
  process.exit(0);
}

console.log(`\n🔒 Trouvé ${entries.length} variable(s) dans .env.local.`);
console.log('🚀 Synchronisation sécurisée vers Vercel (les valeurs ne seront jamais affichées)...\n');

const isWindows = process.platform === 'win32';
const vercelCmd = isWindows ? 'npx.cmd' : 'npx';

async function syncVariable(key, value) {
  return new Promise((resolve) => {
    // 1. D'abord vercel env add avec stdin
    const targets = ['production', 'preview', 'development'];
    let completed = 0;
    let hasError = false;

    for (const target of targets) {
      const child = spawn(vercelCmd, ['vercel', 'env', 'add', key, target, '--force'], {
        cwd: rootDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: isWindows,
      });

      child.stdin.write(value + '\n');
      child.stdin.end();

      child.on('close', (code) => {
        if (code !== 0) {
          hasError = true;
        }
        completed++;
        if (completed === targets.length) {
          if (!hasError) {
            console.log(`  ✓ ${key} synchronisé avec succès [production, preview, development]`);
          } else {
            console.log(`  ⚠ ${key} synchronisé (ou existant).`);
          }
          resolve();
        }
      });

      child.on('error', (err) => {
        console.error(`  ❌ Erreur pour ${key}:`, err.message);
        completed++;
        if (completed === targets.length) resolve();
      });
    }
  });
}

async function run() {
  for (const { key, value } of entries) {
    await syncVariable(key, value);
  }
  console.log('\n✅ Synchronisation des variables terminée !');
}

run().catch((err) => {
  console.error('Erreur inattendue:', err);
  process.exit(1);
});
