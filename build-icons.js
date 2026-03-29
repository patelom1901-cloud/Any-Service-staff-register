import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

async function generateIcons() {
  const publicDir = path.join(process.cwd(), 'public');
  
  console.log('Generating 192x192 icon...');
  await sharp(path.join(publicDir, 'icon-192.svg'))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
    
  console.log('Generating 512x512 icon...');
  await sharp(path.join(publicDir, 'icon-512.svg'))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));

  console.log('Icons generated successfully.');
}

generateIcons().catch(console.error);
