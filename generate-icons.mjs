import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, 'public');

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#6366f1"/>
  <text x="256" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="180" font-weight="bold" fill="white">AS</text>
  <text x="256" y="380" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" fill="rgba(255,255,255,0.8)">ATTENDANCE</text>
</svg>`;

async function generateIcons() {
  try {
    // Generate 192x192 PNG
    await sharp(Buffer.from(svgIcon))
      .resize(192, 192)
      .png()
      .toFile(join(publicDir, 'icon-192.png'));
    console.log('Generated icon-192.png');

    // Generate 512x512 PNG
    await sharp(Buffer.from(svgIcon))
      .resize(512, 512)
      .png()
      .toFile(join(publicDir, 'icon-512.png'));
    console.log('Generated icon-512.png');

    // Generate favicon.png (192x192)
    await sharp(Buffer.from(svgIcon))
      .resize(192, 192)
      .png()
      .toFile(join(publicDir, 'favicon.png'));
    console.log('Generated favicon.png');

    console.log('All icons generated successfully!');
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

generateIcons();
