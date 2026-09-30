import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const svgPath = path.join(rootDir, 'public', 'favicon.svg');
const iconsDir = path.join(rootDir, 'public', 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const svgBuffer = fs.readFileSync(svgPath);

const targets = [
  { file: 'icon-192x192.png', size: 192 },
  { file: 'icon-512x512.png', size: 512 },
  { file: 'icon-maskable-512x512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
];

async function generate() {
  console.log('Generating crisp PNG icons from favicon.svg...');
  for (const target of targets) {
    const destPath = path.join(iconsDir, target.file);
    await sharp(svgBuffer)
      .resize(target.size, target.size)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(destPath);
    console.log(`Generated: ${target.file} (${target.size}x${target.size})`);
  }
  // Also place apple-touch-icon.png at root of public for legacy iOS Safari fallback
  await sharp(svgBuffer)
    .resize(180, 180)
    .png({ quality: 100 })
    .toFile(path.join(rootDir, 'public', 'apple-touch-icon.png'));
  console.log('Generated: public/apple-touch-icon.png');
}

generate()
  .then(() => console.log('All brand icons generated successfully!'))
  .catch((err) => {
    console.error('Error generating icons:', err);
    process.exit(1);
  });
