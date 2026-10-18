import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const svgPath = path.join(rootDir, 'public', 'favicon.svg');
const badgeSvgPath = path.join(rootDir, 'public', 'icons', 'notification-badge.svg');
const iconsDir = path.join(rootDir, 'public', 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const svgBuffer = fs.readFileSync(svgPath);
const badgeSvgBuffer = fs.readFileSync(badgeSvgPath);

const targets = [
  { file: 'icon-192x192.png', size: 192, buffer: svgBuffer },
  { file: 'icon-512x512.png', size: 512, buffer: svgBuffer },
  { file: 'icon-maskable-512x512.png', size: 512, buffer: svgBuffer },
  { file: 'apple-touch-icon.png', size: 180, buffer: svgBuffer },
  // Transparent-background monochrome white silhouettes for Android notification status bar & smallIcon badge
  { file: 'notification-badge-96x96.png', size: 96, buffer: badgeSvgBuffer },
  { file: 'notification-badge-192x192.png', size: 192, buffer: badgeSvgBuffer },
];

async function generate() {
  console.log('Generating crisp PNG icons & Android monochrome notification badges...');
  for (const target of targets) {
    const destPath = path.join(iconsDir, target.file);
    await sharp(target.buffer)
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
  .then(() => console.log('All brand & notification icons generated successfully!'))
  .catch((err) => {
    console.error('Error generating icons:', err);
    process.exit(1);
  });
