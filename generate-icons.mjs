import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, 'public');

// Clean professional logo - no text, just the brand icon
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#bg)"/>
  <circle cx="256" cy="200" r="70" fill="white" opacity="0.9"/>
  <rect x="160" y="300" width="192" height="24" rx="12" fill="white" opacity="0.8"/>
  <rect x="180" y="350" width="152" height="24" rx="12" fill="white" opacity="0.6"/>
  <path d="M230 190 L250 215 L285 175" stroke="#6366f1" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

async function generateIcons() {
  try {
    await sharp(Buffer.from(svgIcon))
      .resize(192, 192)
      .png()
      .toFile(join(publicDir, 'icon-192.png'));
    console.log('Generated icon-192.png');

    await sharp(Buffer.from(svgIcon))
      .resize(512, 512)
      .png()
      .toFile(join(publicDir, 'icon-512.png'));
    console.log('Generated icon-512.png');

    await sharp(Buffer.from(svgIcon))
      .resize(192, 192)
      .png()
      .toFile(join(publicDir, 'favicon.png'));
    console.log('Generated favicon.png');

    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
  }
}

generateIcons();
