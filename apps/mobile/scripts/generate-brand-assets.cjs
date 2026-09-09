const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const assetsDir = path.join(root, 'assets');

fs.mkdirSync(assetsDir, {
  recursive: true,
});

const iconSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#20272c"/>
      <stop offset="45%" stop-color="#090d10"/>
      <stop offset="100%" stop-color="#050708"/>
    </linearGradient>
    <linearGradient id="silver" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#e9ecef"/>
      <stop offset="100%" stop-color="#aeb5bb"/>
    </linearGradient>
    <linearGradient id="orange" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffb23f"/>
      <stop offset="50%" stop-color="#ff8a00"/>
      <stop offset="100%" stop-color="#d45b00"/>
    </linearGradient>
    <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f7f8f9"/>
      <stop offset="45%" stop-color="#6d757c"/>
      <stop offset="78%" stop-color="#222a30"/>
      <stop offset="100%" stop-color="#ff7f00"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#000000" flood-opacity=".55"/>
    </filter>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect width="1024" height="1024" fill="#090d11"/>
  <rect x="54" y="54" width="916" height="916" rx="190" fill="url(#bg)" stroke="url(#edge)" stroke-width="6"/>

  <path d="M168 312 C280 262 390 250 502 244 C628 238 760 260 868 328
           C803 300 748 292 685 292
           C621 218 531 194 439 214
           C368 229 311 256 260 290
           C229 294 197 302 168 312 Z"
        fill="url(#silver)" opacity=".96" filter="url(#softShadow)"/>

  <path d="M154 319 C268 297 336 298 425 321
           C337 316 255 316 154 331 Z"
        fill="url(#orange)" filter="url(#glow)"/>

  <text x="176" y="650" font-family="Arial Black, Arial, sans-serif"
        font-size="392" font-weight="900" letter-spacing="-34"
        fill="url(#silver)" filter="url(#softShadow)">T</text>

  <text x="544" y="650" font-family="Arial Black, Arial, sans-serif"
        font-size="392" font-weight="900" letter-spacing="-32"
        fill="url(#silver)" filter="url(#softShadow)">B</text>

  <path d="M456 313
           L497 354 L538 313
           L574 349
           L574 421
           C574 447 557 466 537 481
           L527 489
           L527 646
           L497 676
           L467 646
           L467 489
           L457 481
           C437 466 420 447 420 421
           L420 349 Z"
        fill="url(#orange)" filter="url(#softShadow)"/>

  <text x="166" y="770" font-family="Arial Black, Arial, sans-serif"
        font-size="88" font-weight="900" letter-spacing="2"
        fill="url(#silver)">TAMİR</text>
  <text x="533" y="770" font-family="Arial Black, Arial, sans-serif"
        font-size="88" font-weight="900" letter-spacing="2"
        fill="url(#orange)">BAKIM</text>

  <text x="238" y="842" font-family="Arial, sans-serif"
        font-size="36" font-weight="400" letter-spacing="16"
        fill="#f0f2f3">ARACINIZ GÜVENDE</text>
</svg>
`;

async function generate() {
  const iconPath = path.join(
    assetsDir,
    'icon.png',
  );

  const splashPath = path.join(
    assetsDir,
    'splash.png',
  );

  const logoPath = path.join(
    assetsDir,
    'brand-logo.png',
  );

  const svgBuffer =
    Buffer.from(iconSvg);

  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
    })
    .toFile(iconPath);

  await sharp(svgBuffer)
    .resize(760, 760)
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
    })
    .toFile(logoPath);

  const logo = await sharp(
    svgBuffer,
  )
    .resize(920, 920)
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 1600,
      height: 1600,
      channels: 3,
      background: '#080d11',
    },
  })
    .composite([
      {
        input: logo,
        gravity: 'centre',
      },
    ])
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
    })
    .toFile(splashPath);

  console.log(
    '[brand] Tamir Bakım icon, splash and in-app logo generated.',
  );
}

generate().catch((error) => {
  console.error(
    '[brand] Asset generation failed:',
    error,
  );
  process.exit(1);
});
