import fs from 'node:fs';
import path from 'node:path';

const publicRoot = path.join(process.cwd(), 'docs', 'public');
const faviconPath = path.join(publicRoot, 'favicon.svg');
const socialImagePath = path.join(publicRoot, 'og.png');
const maximumSocialImageBytes = 500 * 1024;

const failures = [];

if (!fs.existsSync(faviconPath)) {
  failures.push('docs/public/favicon.svg is missing');
}

if (!fs.existsSync(socialImagePath)) {
  failures.push('docs/public/og.png is missing');
} else {
  const image = fs.readFileSync(socialImagePath);
  const pngSignature = '89504e470d0a1a0a';
  if (image.subarray(0, 8).toString('hex') !== pngSignature) {
    failures.push('docs/public/og.png is not a PNG file');
  } else {
    const width = image.readUInt32BE(16);
    const height = image.readUInt32BE(20);
    if (width !== 1200 || height !== 630) {
      failures.push(`docs/public/og.png must be 1200x630, got ${width}x${height}`);
    }
    if (image.byteLength > maximumSocialImageBytes) {
      failures.push(
        `docs/public/og.png must be at most 500 KiB, got ${Math.ceil(image.byteLength / 1024)} KiB`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error('Documentation asset check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Documentation favicon and 1200x630 social image are valid.');
