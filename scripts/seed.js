const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const config = require('../server/config');

const SEED_UPLOADS_DIR = path.join(config.UPLOADS_DIR, 'seed');

function ensureDirectories() {
  if (!fs.existsSync(config.DATA_DIR)) {
    fs.mkdirSync(config.DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(config.UPLOADS_DIR)) {
    fs.mkdirSync(config.UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(SEED_UPLOADS_DIR)) {
    fs.mkdirSync(SEED_UPLOADS_DIR, { recursive: true });
  }
}

/**
 * High-fidelity SVG generators replicating the 9 reference tiles
 */
function createSvgAssets() {
  // 1. HBO GO / Spider-Man cinematic visual
  const tile1 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="100%" height="100%">
    <defs>
      <radialGradient id="hboGlow" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="#2d121c" />
        <stop offset="60%" stop-color="#0e0a14" />
        <stop offset="100%" stop-color="#050308" />
      </radialGradient>
      <linearGradient id="suitRed" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#e62020" />
        <stop offset="30%" stop-color="#a60c18" />
        <stop offset="70%" stop-color="#540710" />
        <stop offset="100%" stop-color="#1d0408" />
      </linearGradient>
      <linearGradient id="lensReflect" x1="0%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
        <stop offset="40%" stop-color="#76c8d5" stop-opacity="0.8" />
        <stop offset="70%" stop-color="#103a55" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#06121f" />
      </linearGradient>
    </defs>
    <!-- Background Nightscape -->
    <rect width="1200" height="900" fill="url(#hboGlow)" />
    <!-- City Skyline Silhouette in background -->
    <g fill="#161b26" opacity="0.6">
      <rect x="50" y="300" width="80" height="600" />
      <rect x="140" y="240" width="110" height="660" />
      <rect x="260" y="380" width="70" height="520" />
      <rect x="850" y="220" width="120" height="680" />
      <rect x="980" y="310" width="90" height="590" />
      <rect x="1080" y="260" width="100" height="640" />
    </g>
    <!-- Web Lines -->
    <g stroke="#ffffff" stroke-opacity="0.18" stroke-width="2" fill="none">
      <path d="M-100,-100 L1300,1000 M-100,500 L1300,400 M600,-100 L600,1000 M1300,-100 L-100,1000" />
      <ellipse cx="600" cy="500" rx="350" ry="250" />
      <ellipse cx="600" cy="500" rx="600" ry="420" />
      <ellipse cx="600" cy="500" rx="900" ry="650" />
    </g>
    <!-- Suit Face Mask -->
    <path d="M150,900 C150,450 350,150 600,150 C850,150 1050,450 1050,900 Z" fill="url(#suitRed)" />
    <!-- Mask Hexagonal Pattern Texture -->
    <g stroke="#000000" stroke-width="3" stroke-opacity="0.35" fill="none">
      <path d="M600,150 L600,900 M600,150 L300,900 M600,150 L900,900 M600,150 L100,600 M600,150 L1100,600" />
      <path d="M350,400 Q600,460 850,400 M300,550 Q600,630 900,550 M250,720 Q600,820 950,720" />
    </g>
    <!-- Dramatic Mask Eyes (Lens) -->
    <!-- Left Eye Lens -->
    <path d="M560,420 C540,320 400,280 260,340 C230,420 300,560 480,550 C540,540 565,490 560,420 Z" fill="#0c0c0e" />
    <path d="M545,420 C525,335 405,300 280,350 C255,415 315,535 470,535 C525,525 550,480 545,420 Z" fill="url(#lensReflect)" stroke="#ffffff" stroke-width="4" stroke-opacity="0.4" />
    <!-- Right Eye Lens -->
    <path d="M640,420 C660,320 800,280 940,340 C970,420 900,560 720,550 C660,540 635,490 640,420 Z" fill="#0c0c0e" />
    <path d="M655,420 C675,335 795,300 920,350 C945,415 885,535 730,535 C675,525 650,480 655,420 Z" fill="url(#lensReflect)" stroke="#ffffff" stroke-width="4" stroke-opacity="0.4" />
    <!-- Cinematic Vignette -->
    <rect width="1200" height="900" fill="none" stroke="#000" stroke-width="30" opacity="0.4" />
  </svg>`;

  // 2. Forbes '30 Under 30' (iPhone in hand editorial app)
  const tile2 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="100%" height="100%">
    <defs>
      <linearGradient id="bgMutedTeal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#b8cac7" />
        <stop offset="50%" stop-color="#9fb3af" />
        <stop offset="100%" stop-color="#849995" />
      </linearGradient>
      <linearGradient id="phoneBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fdfdfd" />
        <stop offset="100%" stop-color="#dedede" />
      </linearGradient>
      <filter id="phoneShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="25" stdDeviation="35" flood-color="#2a3b37" flood-opacity="0.25" />
      </filter>
    </defs>
    <rect width="1200" height="900" fill="url(#bgMutedTeal)" />
    <!-- Blurred human hand silhouette holding device -->
    <path d="M420,900 C430,750 450,680 470,620 C420,600 370,640 330,730 C300,800 280,900 280,900 Z" fill="#cfb2a6" opacity="0.65" filter="blur(15px)" />
    <path d="M720,900 C730,780 750,690 770,640 C830,680 870,760 900,900 Z" fill="#caa494" opacity="0.65" filter="blur(15px)" />
    <!-- iPhone Device -->
    <g transform="translate(420, 120)" filter="url(#phoneShadow)">
      <!-- Outer Body -->
      <rect x="0" y="0" width="360" height="700" rx="48" fill="url(#phoneBody)" stroke="#cccccc" stroke-width="2" />
      <!-- Top Speaker & Camera -->
      <circle cx="180" cy="30" r="4" fill="#666666" />
      <rect x="150" y="42" width="60" height="5" rx="2.5" fill="#555555" />
      <!-- Screen Display -->
      <rect x="22" y="75" width="316" height="550" fill="#ffffff" />
      <!-- Screen Content (Forbes 30 Under 30 App) -->
      <rect x="22" y="75" width="316" height="40" fill="#f8f8f8" />
      <rect x="35" y="90" width="28" height="24" rx="3" fill="#e6205c" />
      <text x="49" y="106" font-family="'Bitter', serif" font-weight="bold" font-size="12" fill="#fff" text-anchor="middle">30</text>
      <!-- Title -->
      <text x="180" y="175" font-family="'Bitter', Georgia, serif" font-weight="900" font-size="28" fill="#222" text-anchor="middle" letter-spacing="1">JON</text>
      <text x="180" y="205" font-family="'Bitter', Georgia, serif" font-weight="900" font-size="28" fill="#222" text-anchor="middle" letter-spacing="1">ROBINSON</text>
      <text x="180" y="228" font-family="sans-serif" font-size="9" fill="#888" text-anchor="middle" letter-spacing="0.5">FOUNDER &amp; CEO, HYBRID LABS</text>
      <!-- Card Image Mockup -->
      <rect x="45" y="250" width="270" height="150" rx="4" fill="#eaeaea" />
      <path d="M45,350 L120,290 L180,340 L250,270 L315,350 L315,400 L45,400 Z" fill="#d0d0d0" />
      <!-- Pink Action Banner -->
      <rect x="45" y="420" width="270" height="34" rx="4" fill="#e6205c" />
      <text x="180" y="442" font-family="sans-serif" font-weight="bold" font-size="10" fill="#ffffff" text-anchor="middle" letter-spacing="0.8">2015 30U30 LAUNCH PARTY</text>
      <line x1="45" y1="480" x2="315" y2="480" stroke="#f0f0f0" stroke-width="1" />
      <!-- Bottom Home Button -->
      <circle cx="180" cy="662" r="22" fill="#fafafa" stroke="#d5d5d5" stroke-width="2" />
    </g>
  </svg>`;

  // 3. Atmosphere & Weather (Minimalist weather & time UI dashboard)
  const tile3 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="100%" height="100%">
    <defs>
      <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#4aa8ea" />
        <stop offset="100%" stop-color="#87cef6" />
      </linearGradient>
      <linearGradient id="duskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#2a3f5f" />
        <stop offset="100%" stop-color="#1b2940" />
      </linearGradient>
      <linearGradient id="warmSavannah" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#d69b6b" />
        <stop offset="100%" stop-color="#ab6b3d" />
      </linearGradient>
    </defs>
    <!-- 4 Quadrants -->
    <!-- Top-Left: Surf/Ocean Weather -->
    <rect x="0" y="0" width="600" height="450" fill="url(#duskGrad)" />
    <text x="70" y="220" font-family="'Bitter', serif" font-weight="bold" font-size="120" fill="#ffffff">7</text>
    <text x="145" y="150" font-family="sans-serif" font-weight="bold" font-size="36" fill="#ffffff">ft</text>
    <!-- Wave Icon -->
    <path d="M380,180 C395,150 420,135 440,150 C460,165 480,140 495,160 C500,166 490,175 480,175 C450,175 430,160 410,180 Z" fill="#ffffff" />
    <path d="M360,195 Q430,180 500,195 L500,205 Q430,190 360,205 Z" fill="#ffffff" />
    <text x="430" y="240" font-family="sans-serif" font-size="13" font-weight="700" fill="#b0c5dd" text-anchor="middle" letter-spacing="1">4FT NW @ 14 SEC</text>
    <text x="430" y="260" font-family="sans-serif" font-size="13" font-weight="700" fill="#b0c5dd" text-anchor="middle" letter-spacing="1">HUNTINGTON BEACH, CA</text>

    <!-- Top-Right: Time & Sun in Luangwa Valley -->
    <rect x="600" y="0" width="600" height="450" fill="#494e57" />
    <text x="660" y="220" font-family="'Bitter', Georgia, serif" font-weight="bold" font-size="105" fill="#ffffff">5:03</text>
    <text x="910" y="160" font-family="sans-serif" font-weight="bold" font-size="30" fill="#ffffff">am</text>
    <circle cx="1060" cy="180" r="18" fill="#ffd15c" />
    <g stroke="#ffd15c" stroke-width="3" stroke-linecap="round">
      <line x1="1060" y1="150" x2="1060" y2="156" />
      <line x1="1060" y1="204" x2="1060" y2="210" />
      <line x1="1030" y1="180" x2="1036" y2="180" />
      <line x1="1084" y1="180" x2="1090" y2="180" />
      <line x1="1039" y1="159" x2="1044" y2="164" />
      <line x1="1076" y1="196" x2="1081" y2="201" />
      <line x1="1039" y1="201" x2="1044" y2="196" />
      <line x1="1076" y1="164" x2="1081" y2="159" />
    </g>
    <text x="1000" y="245" font-family="sans-serif" font-size="13" font-weight="700" fill="#c3c8cf" text-anchor="middle" letter-spacing="1">415.543° S 30.37</text>
    <text x="1000" y="265" font-family="sans-serif" font-size="13" font-weight="700" fill="#c3c8cf" text-anchor="middle" letter-spacing="1">LUANGWA VALLEY</text>

    <!-- Bottom-Left: Clear Sky -->
    <rect x="0" y="450" width="600" height="450" fill="url(#skyGrad)" />
    <!-- Light cirrus clouds -->
    <path d="M0,550 Q180,530 350,560 T600,530 L600,650 Q400,670 200,630 T0,650 Z" fill="#ffffff" opacity="0.3" filter="blur(20px)" />

    <!-- Bottom-Right: Savannah Giraffe -->
    <rect x="600" y="450" width="600" height="450" fill="url(#warmSavannah)" />
    <!-- Giraffe silhouette looking up -->
    <g transform="translate(850, 480)">
      <!-- Neck -->
      <path d="M40,370 L70,80 L95,65 L115,85 L140,370 Z" fill="#583115" />
      <!-- Spots -->
      <g fill="#371d0a" opacity="0.85">
        <polygon points="55,300 70,330 90,320 80,290" />
        <polygon points="65,240 85,260 105,245 95,225" />
        <polygon points="75,170 95,185 110,170 100,155" />
        <polygon points="85,115 100,125 110,115 102,105" />
      </g>
      <!-- Head & Horns -->
      <path d="M95,65 C95,50 115,45 125,55 C135,65 130,80 115,85 Z" fill="#583115" />
      <circle cx="102" cy="40" r="4" fill="#371d0a" />
      <line x1="102" y1="40" x2="102" y2="52" stroke="#583115" stroke-width="4" />
      <circle cx="118" cy="42" r="4" fill="#371d0a" />
      <line x1="118" y1="42" x2="116" y2="54" stroke="#583115" stroke-width="4" />
      <!-- Eye & Muzzle -->
      <circle cx="112" cy="62" r="3" fill="#111" />
      <path d="M125,55 C140,58 145,68 135,78 Z" fill="#2d1709" />
    </g>
    <!-- Quadrant subtle partition lines -->
    <line x1="600" y1="0" x2="600" y2="900" stroke="#ffffff" stroke-width="1" opacity="0.2" />
    <line x1="0" y1="450" x2="1200" y2="450" stroke="#ffffff" stroke-width="1" opacity="0.2" />
  </svg>`;

  // 4. Land Rover Explore (Range Rover in desert kicking up dust)
  const tile4 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="100%" height="100%">
    <defs>
      <linearGradient id="desertSky" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#6e8499" />
        <stop offset="50%" stop-color="#b0bcc7" />
        <stop offset="100%" stop-color="#dfd2bd" />
      </linearGradient>
      <linearGradient id="desertDunes" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#d6b185" />
        <stop offset="60%" stop-color="#c49b6b" />
        <stop offset="100%" stop-color="#e3be93" />
      </linearGradient>
    </defs>
    <rect width="1200" height="900" fill="url(#desertSky)" />
    <!-- Distant Dunes -->
    <path d="M0,600 Q300,520 650,560 T1200,500 L1200,900 L0,900 Z" fill="url(#desertDunes)" />
    <!-- Foreground Desert Ground -->
    <path d="M0,680 Q400,640 850,700 T1200,680 L1200,900 L0,900 Z" fill="#b98f5f" />
    <!-- Dust Cloud Explosion Behind Vehicle -->
    <g fill="#d8ba92" opacity="0.85" filter="blur(25px)">
      <circle cx="500" cy="730" r="120" />
      <circle cx="650" cy="700" r="150" />
      <circle cx="850" cy="650" r="180" />
      <circle cx="1050" cy="620" r="160" />
    </g>
    <!-- Land Rover Oval Logo Badge -->
    <g transform="translate(600, 150)">
      <ellipse cx="0" cy="0" rx="42" ry="24" fill="#0c4728" stroke="#d5c898" stroke-width="2" />
      <text x="0" y="4" font-family="'Bitter', serif" font-weight="bold" font-size="9" fill="#ffffff" text-anchor="middle" letter-spacing="1">LAND ROVER</text>
    </g>
    <!-- Subtitle -->
    <text x="600" y="210" font-family="sans-serif" font-size="16" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="5">2015 RANGE ROVER HSE</text>
    <!-- Large Bold White Typography: EXPLORE. -->
    <text x="600" y="440" font-family="'Bitter', Georgia, serif" font-weight="900" font-size="140" fill="#ffffff" text-anchor="middle" letter-spacing="8" opacity="0.95">EXPLORE.</text>
    <!-- Luxury SUV Silhouette Speeding Left -->
    <g transform="translate(60, 620)">
      <!-- Car Body -->
      <path d="M40,140 L80,120 L160,110 L250,55 L420,55 L460,95 L490,135 L470,165 L430,170 L380,170 L340,140 L280,140 L240,170 L140,170 L100,140 Z" fill="#d8dce2" stroke="#444" stroke-width="2" />
      <!-- Windows / Roof -->
      <path d="M255,62 L415,62 L445,98 L245,98 Z" fill="#1b2530" />
      <line x1="330" y1="62" x2="330" y2="98" stroke="#d8dce2" stroke-width="4" />
      <!-- Wheels -->
      <circle cx="140" cy="165" r="38" fill="#1a1a1a" />
      <circle cx="140" cy="165" r="24" fill="#888" stroke="#fff" stroke-width="2" />
      <circle cx="380" cy="165" r="38" fill="#1a1a1a" />
      <circle cx="380" cy="165" r="24" fill="#888" stroke="#fff" stroke-width="2" />
      <!-- Headlight Beam -->
      <polygon points="50,130 0,160 0,180 50,145" fill="#fff" opacity="0.7" />
    </g>
  </svg>`;

  // 5. Generations (Intimate warm portrait)
  const tile5 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="100%" height="100%">
    <defs>
      <linearGradient id="portraitBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#9ea49d" />
        <stop offset="50%" stop-color="#73827a" />
        <stop offset="100%" stop-color="#4e5b54" />
      </linearGradient>
      <radialGradient id="sunGlow" cx="20%" cy="20%" r="70%">
        <stop offset="0%" stop-color="#ffeed6" stop-opacity="0.8" />
        <stop offset="50%" stop-color="#ffcb99" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="1200" height="900" fill="url(#portraitBg)" />
    <!-- Warm Sun Flare -->
    <rect width="1200" height="900" fill="url(#sunGlow)" />
    <!-- Grandfather Silhouette and Face (Right) -->
    <g transform="translate(520, 200)">
      <!-- Torso / Red Polo Shirt -->
      <path d="M120,450 C120,380 200,340 280,340 C360,340 440,380 450,450 Z" fill="#9b1e22" />
      <!-- Head / Profile -->
      <path d="M180,240 C170,140 250,90 320,110 C390,130 400,240 370,310 C330,350 250,340 200,310 Z" fill="#dcb193" />
      <!-- Silver Hair -->
      <path d="M220,130 C250,90 340,90 370,120 C390,150 370,170 360,170 C340,130 280,120 230,140 Z" fill="#ededed" opacity="0.9" />
      <!-- Eyeglasses -->
      <ellipse cx="230" cy="210" rx="22" ry="18" fill="none" stroke="#222" stroke-width="5" />
      <line x1="252" y1="205" x2="280" y2="195" stroke="#222" stroke-width="4" />
      <!-- Smiling Expression lines -->
      <path d="M205,260 Q235,285 260,265" fill="none" stroke="#8c583f" stroke-width="4" stroke-linecap="round" />
    </g>
    <!-- Toddler Silhouette (Left) Touching Grandfather's Face -->
    <g transform="translate(180, 260)">
      <!-- Blue Longsleeve Shirt -->
      <path d="M100,450 C90,370 160,340 230,350 C300,360 330,420 340,450 Z" fill="#7597b8" />
      <!-- Head / Blond Hair -->
      <path d="M160,240 C140,160 210,120 270,140 C320,160 330,230 300,290 C260,330 190,310 160,250 Z" fill="#e8c2a5" />
      <!-- Golden Curls -->
      <path d="M150,220 C130,130 220,90 280,105 C330,120 340,180 320,190 C300,120 210,120 160,200 Z" fill="#f7d98c" />
      <!-- Smiling Eyes -->
      <path d="M280,215 Q295,225 310,215" fill="none" stroke="#75472e" stroke-width="4" stroke-linecap="round" />
      <!-- Little Hand touching cheek -->
      <path d="M320,290 C370,250 420,220 460,200 C475,200 480,220 450,240 C410,270 370,320 330,340 Z" fill="#e8c2a5" />
    </g>
    <!-- Cinematic Film Grain / Soft Tone -->
    <rect width="1200" height="900" fill="#ffecdb" opacity="0.08" />
  </svg>`;

  // 6. Telemetry Track App (High performance racing lap app + car)
  const tile6 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="100%" height="100%">
    <defs>
      <linearGradient id="asphaltBg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#7e8b99" />
        <stop offset="40%" stop-color="#55606d" />
        <stop offset="70%" stop-color="#2a3038" />
        <stop offset="100%" stop-color="#181c22" />
      </linearGradient>
      <linearGradient id="goldAccent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#f59e0b" />
        <stop offset="100%" stop-color="#d97706" />
      </linearGradient>
    </defs>
    <rect width="1200" height="900" fill="url(#asphaltBg)" />
    <!-- Distant Track Horizon & Curbing -->
    <line x1="0" y1="520" x2="1200" y2="520" stroke="#999" stroke-width="2" opacity="0.4" />
    <path d="M0,680 L1200,680" stroke="#dc2626" stroke-width="12" stroke-dasharray="40,40" />
    <!-- Sleek Supercar in Background -->
    <g transform="translate(620, 360)">
      <path d="M0,180 L80,140 L250,90 L380,95 L480,130 L520,180 Z" fill="#0d1117" stroke="#222" stroke-width="2" />
      <!-- Headlights -->
      <polygon points="40,165 0,175 30,180" fill="#38bdf8" />
      <polygon points="480,165 520,175 490,180" fill="#38bdf8" />
      <!-- License Plate -->
      <rect x="210" y="160" width="100" height="25" fill="#f8fafc" stroke="#333" rx="3" />
      <text x="260" y="177" font-family="sans-serif" font-weight="900" font-size="12" fill="#0f172a" text-anchor="middle" letter-spacing="2">RX60 HGG</text>
    </g>
    <!-- Telemetry Smartphone (Foreground) -->
    <g transform="translate(260, 160)">
      <!-- Outer Phone Case -->
      <rect x="0" y="0" width="340" height="680" rx="46" fill="#18181b" stroke="#3f3f46" stroke-width="4" />
      <!-- Top Speaker -->
      <rect x="140" y="30" width="60" height="6" rx="3" fill="#52525b" />
      <!-- Screen Display -->
      <rect x="20" y="65" width="300" height="540" fill="#09090b" />
      <!-- App Header Bar -->
      <rect x="20" y="65" width="300" height="40" fill="#18181b" />
      <text x="50" y="88" font-family="sans-serif" font-size="11" fill="#71717a">Track</text>
      <text x="120" y="88" font-family="sans-serif" font-size="11" fill="#71717a">Data</text>
      <text x="190" y="88" font-family="sans-serif" font-size="11" fill="#71717a">Videos</text>
      <!-- Telemetry Stats -->
      <!-- Fastest Lap -->
      <g transform="translate(35, 120)">
        <text x="0" y="18" font-family="sans-serif" font-size="10" fill="#a1a1aa" letter-spacing="1">FASTEST LAP</text>
        <text x="0" y="55" font-family="'Bitter', monospace, serif" font-weight="bold" font-size="34" fill="#ffffff">23:02:10</text>
      </g>
      <!-- Top Speed -->
      <g transform="translate(35, 205)">
        <text x="0" y="18" font-family="sans-serif" font-size="10" fill="#a1a1aa" letter-spacing="1">HIGHEST SPEED</text>
        <text x="0" y="55" font-family="'Bitter', monospace, serif" font-weight="bold" font-size="34" fill="#ffffff">235 <tspan font-size="16" font-family="sans-serif">mph</tspan></text>
      </g>
      <!-- Average Lap -->
      <g transform="translate(35, 290)">
        <text x="0" y="18" font-family="sans-serif" font-size="10" fill="#a1a1aa" letter-spacing="1">AVERAGE LAP</text>
        <text x="0" y="55" font-family="'Bitter', monospace, serif" font-weight="bold" font-size="34" fill="#ffffff">24:12:34</text>
      </g>
      <!-- Donington Park Track Map Box -->
      <rect x="180" y="130" width="125" height="130" rx="6" fill="#18181b" stroke="#27272a" />
      <path d="M195,200 Q200,160 230,155 Q260,150 280,180 Q290,210 270,230 Q240,240 210,225 Z" fill="none" stroke="#ffffff" stroke-width="3" />
      <text x="242" y="250" font-family="sans-serif" font-size="9" fill="#a1a1aa" text-anchor="middle">2.5 Miles / UK</text>
      <!-- Gold Bottom Active Lap Tab -->
      <rect x="20" y="420" width="300" height="90" fill="url(#goldAccent)" />
      <text x="45" y="475" font-family="'Bitter', serif" font-weight="900" font-size="46" fill="#ffffff">1</text>
      <text x="80" y="460" font-family="sans-serif" font-weight="bold" font-size="12" fill="#ffffff" letter-spacing="1">DONINGTON</text>
      <text x="80" y="476" font-family="sans-serif" font-weight="bold" font-size="10" fill="#ffffff" letter-spacing="2">PARK</text>
      <!-- Bottom App Nav Icons -->
      <rect x="20" y="510" width="300" height="50" fill="#18181b" />
      <text x="170" y="540" font-family="sans-serif" font-size="10" fill="#71717a" text-anchor="middle">Home  ·  Search  ·  Settings</text>
      <!-- Phone Home Button -->
      <circle cx="170" cy="642" r="22" fill="#27272a" stroke="#3f3f46" stroke-width="2" />
    </g>
  </svg>`;

  // 7. Kilimanjaro Digital (Beverage brand across responsive tablet & phone)
  const tile7 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="100%" height="100%">
    <defs>
      <linearGradient id="woodTable" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#eed8be" />
        <stop offset="50%" stop-color="#d8ba96" />
        <stop offset="100%" stop-color="#c19e78" />
      </linearGradient>
      <linearGradient id="beerBottle" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#4a2508" />
        <stop offset="40%" stop-color="#8a4d19" />
        <stop offset="70%" stop-color="#ba6f28" />
        <stop offset="100%" stop-color="#3d1e06" />
      </linearGradient>
    </defs>
    <!-- Woodgrain Surface -->
    <rect width="1200" height="900" fill="url(#woodTable)" />
    <!-- Wood Planks Lines -->
    <line x1="0" y1="280" x2="1200" y2="280" stroke="#ab8761" stroke-width="2" opacity="0.4" />
    <line x1="0" y1="580" x2="1200" y2="580" stroke="#ab8761" stroke-width="2" opacity="0.4" />
    <!-- Angled Tablet Device (Left) -->
    <g transform="translate(100, 100) rotate(-18)">
      <rect x="0" y="0" width="480" height="660" rx="30" fill="#ffffff" stroke="#d4d4d4" stroke-width="4" filter="drop-shadow(0 20px 30px rgba(0,0,0,0.25))" />
      <rect x="25" y="40" width="430" height="580" fill="#f4ede2" />
      <!-- Website Header -->
      <rect x="25" y="40" width="430" height="50" fill="#2d2d2d" />
      <text x="50" y="70" font-family="'Bitter', serif" font-weight="bold" font-size="14" fill="#ffffff">KILIMANJARO LAGER</text>
      <!-- Hero Image on Tablet with smiling man & mountain -->
      <rect x="25" y="90" width="430" height="280" fill="#2b4c5f" />
      <circle cx="160" cy="220" r="80" fill="#523223" />
      <text x="250" y="200" font-family="'Bitter', Georgia, serif" font-style="italic" font-size="28" fill="#ffd15c">The taste</text>
      <text x="250" y="240" font-family="'Bitter', Georgia, serif" font-weight="bold" font-size="36" fill="#ffffff">of success</text>
    </g>
    <!-- Real Glass Beer Bottle in Foreground -->
    <g transform="translate(260, 280) rotate(-12)">
      <!-- Neck -->
      <path d="M120,40 L160,40 L165,180 L195,240 L195,580 L85,580 L85,240 L115,180 Z" fill="url(#beerBottle)" stroke="#221105" stroke-width="2" filter="drop-shadow(15px 25px 25px rgba(0,0,0,0.35))" />
      <!-- Gold Foil Cap -->
      <rect x="118" y="25" width="44" height="25" rx="3" fill="#eab308" stroke="#ca8a04" stroke-width="2" />
      <!-- Label -->
      <rect x="87" y="320" width="106" height="150" fill="#d97706" rx="4" />
      <ellipse cx="140" cy="380" rx="40" ry="25" fill="#fef08a" />
      <text x="140" y="385" font-family="'Bitter', serif" font-weight="900" font-size="11" fill="#78350f" text-anchor="middle">KILIMANJARO</text>
    </g>
    <!-- Smartphone in Foreground (Right) -->
    <g transform="translate(560, 220) rotate(-6)">
      <rect x="0" y="0" width="300" height="580" rx="40" fill="#09090b" stroke="#27272a" stroke-width="3" filter="drop-shadow(10px 20px 25px rgba(0,0,0,0.3))" />
      <!-- Screen Display -->
      <rect x="18" y="55" width="264" height="460" fill="#ffffff" />
      <rect x="18" y="55" width="264" height="180" fill="#b45309" />
      <text x="150" y="140" font-family="'Bitter', Georgia, serif" font-weight="bold" font-size="20" fill="#ffffff" text-anchor="middle">TASTE</text>
      <text x="150" y="165" font-family="'Bitter', Georgia, serif" font-style="italic" font-size="16" fill="#fef08a" text-anchor="middle">REFRESHMENT</text>
      <rect x="35" y="260" width="230" height="14" rx="3" fill="#e2e8f0" />
      <rect x="35" y="290" width="180" height="14" rx="3" fill="#e2e8f0" />
      <rect x="35" y="320" width="200" height="14" rx="3" fill="#e2e8f0" />
      <circle cx="150" cy="548" r="18" fill="#18181b" stroke="#3f3f46" stroke-width="2" />
    </g>
  </svg>`;

  // 8. McLaren P1 Launch (Vibrant red sports car on coastal highway)
  const tile8 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="100%" height="100%">
    <defs>
      <linearGradient id="oceanCoast" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#698ca6" />
        <stop offset="40%" stop-color="#93afc4" />
        <stop offset="60%" stop-color="#b8ccd8" />
        <stop offset="100%" stop-color="#555a61" />
      </linearGradient>
      <linearGradient id="mclarenRed" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ff3b30" />
        <stop offset="40%" stop-color="#d31018" />
        <stop offset="80%" stop-color="#8a070c" />
        <stop offset="100%" stop-color="#3d0305" />
      </linearGradient>
      <linearGradient id="carbonWing" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#262626" />
        <stop offset="50%" stop-color="#141414" />
        <stop offset="100%" stop-color="#0a0a0a" />
      </linearGradient>
    </defs>
    <!-- Background Ocean & Sky -->
    <rect width="1200" height="900" fill="url(#oceanCoast)" />
    <!-- Distant Mountain Ridge -->
    <path d="M0,500 Q400,320 800,450 T1200,400 L1200,600 L0,600 Z" fill="#6f797f" opacity="0.6" />
    <!-- Curving Coastal Highway Asphalt -->
    <path d="M0,750 Q500,560 1200,600 L1200,900 L0,900 Z" fill="#3a3d42" />
    <!-- Road Guardrail & White Apex Lines -->
    <path d="M0,740 Q500,550 1200,590" stroke="#f1f5f9" stroke-width="8" stroke-dasharray="50,40" fill="none" />
    <!-- Red McLaren P1 (Rear 3/4 Dynamic Angle) -->
    <g transform="translate(320, 240)">
      <!-- Massive Active Aerodynamic Rear Wing -->
      <path d="M140,110 L420,110 L440,140 L120,140 Z" fill="url(#carbonWing)" />
      <!-- Wing Stalks -->
      <line x1="200" y1="140" x2="220" y2="230" stroke="#1f2937" stroke-width="12" />
      <line x1="360" y1="140" x2="340" y2="230" stroke="#1f2937" stroke-width="12" />
      <!-- Sleek Sculpted Bodywork -->
      <path d="M80,310 C100,200 180,180 280,180 C380,180 460,200 480,310 C510,340 540,380 520,440 L40,440 C20,380 50,340 80,310 Z" fill="url(#mclarenRed)" stroke="#59080c" stroke-width="3" filter="drop-shadow(0 30px 40px rgba(0,0,0,0.5))" />
      <!-- Glass Engine Canopy -->
      <path d="M190,195 L370,195 L390,260 L170,260 Z" fill="#0f172a" opacity="0.9" />
      <!-- Aggressive LED Taillight Ribbons -->
      <path d="M110,310 Q280,290 450,310" stroke="#ff2a2a" stroke-width="8" fill="none" stroke-linecap="round" filter="drop-shadow(0 0 10px #ff0000)" />
      <!-- Center High-Exit Exhaust Pipe -->
      <ellipse cx="280" cy="330" rx="30" ry="18" fill="#09090b" stroke="#71717a" stroke-width="4" />
      <!-- Rear Carbon Diffuser -->
      <path d="M60,430 L500,430 L480,480 L80,480 Z" fill="#111827" />
      <line x1="160" y1="430" x2="160" y2="480" stroke="#000" stroke-width="6" />
      <line x1="280" y1="430" x2="280" y2="480" stroke="#000" stroke-width="6" />
      <line x1="400" y1="430" x2="400" y2="480" stroke="#000" stroke-width="6" />
      <!-- License Badge -->
      <rect x="235" y="365" width="90" height="24" fill="#ffffff" rx="3" />
      <text x="280" y="381" font-family="'Bitter', sans-serif" font-weight="900" font-size="10" fill="#111" text-anchor="middle" letter-spacing="1">McLaren</text>
      <!-- Fat Rear Tires -->
      <ellipse cx="70" cy="420" rx="45" ry="60" fill="#09090b" />
      <ellipse cx="490" cy="420" rx="45" ry="60" fill="#09090b" />
    </g>
  </svg>`;

  // 9. Volvo FH Experience (Interactive transparent showroom display)
  const tile9 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="100%" height="100%">
    <defs>
      <linearGradient id="showroomBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#3c4354" />
        <stop offset="50%" stop-color="#2a3040" />
        <stop offset="100%" stop-color="#1b202e" />
      </linearGradient>
      <linearGradient id="glassScreen" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
        <stop offset="50%" stop-color="#e2ebf4" stop-opacity="0.85" />
        <stop offset="100%" stop-color="#bcd2e8" stop-opacity="0.9" />
      </linearGradient>
    </defs>
    <!-- Dark Architectural Showroom Interior -->
    <rect width="1200" height="900" fill="url(#showroomBg)" />
    <!-- Ambient Showroom Spotlights -->
    <ellipse cx="800" cy="100" rx="300" ry="80" fill="#88b5e2" opacity="0.15" filter="blur(40px)" />
    <!-- Huge Floating Transparent Glass Screen (Angled) -->
    <g transform="translate(180, 80) skewY(-6)" filter="drop-shadow(20px 30px 40px rgba(0,0,0,0.4))">
      <!-- Glass Screen Background -->
      <rect x="0" y="0" width="760" height="640" rx="16" fill="url(#glassScreen)" stroke="#ffffff" stroke-width="4" />
      <!-- Header / Volvo Logo -->
      <text x="50" y="70" font-family="sans-serif" font-weight="900" font-size="13" fill="#64748b" letter-spacing="2">360° INTERACTIVE</text>
      <!-- Title -->
      <text x="50" y="125" font-family="'Bitter', Georgia, serif" font-weight="900" font-size="44" fill="#1e293b" letter-spacing="1">EXPERIENCE</text>
      <text x="50" y="170" font-family="'Bitter', Georgia, serif" font-weight="900" font-size="44" fill="#1e293b" letter-spacing="1">THE FH</text>
      <!-- Volvo Iron Mark Logo -->
      <circle cx="680" cy="115" r="26" fill="none" stroke="#1e293b" stroke-width="5" />
      <text x="680" y="120" font-family="'Bitter', serif" font-weight="bold" font-size="9" fill="#1e293b" text-anchor="middle">VOLVO</text>
      <!-- Spec Text Paragraph -->
      <text x="50" y="220" font-family="sans-serif" font-size="10" fill="#475569">Engineered for long-haul performance.</text>
      <text x="50" y="240" font-family="sans-serif" font-size="10" fill="#475569">Featuring revolutionary I-Shift dual clutch.</text>
      <!-- 3D Turntable Base -->
      <ellipse cx="480" cy="460" rx="200" ry="45" fill="#a48c77" stroke="#ffffff" stroke-width="4" />
      <!-- Volvo FH Green Truck on Turntable -->
      <g transform="translate(360, 200)">
        <!-- Cab Body -->
        <rect x="50" y="40" width="140" height="200" rx="10" fill="#587965" stroke="#233529" stroke-width="3" />
        <!-- Huge Windshield Glass -->
        <path d="M55,60 L185,60 L180,120 L60,120 Z" fill="#0f172a" />
        <!-- Headlights -->
        <polygon points="55,190 75,190 70,225 55,220" fill="#f8fafc" />
        <polygon points="185,190 165,190 170,225 185,220" fill="#f8fafc" />
        <!-- Grille & Volvo Diagonal Sash -->
        <rect x="75" y="150" width="90" height="70" fill="#334155" rx="4" />
        <line x1="80" y1="155" x2="160" y2="215" stroke="#94a3b8" stroke-width="4" />
      </g>
    </g>
    <!-- Human Hand Touching Display in Foreground -->
    <g transform="translate(860, 380)">
      <!-- Arm coming from right -->
      <path d="M340,320 L160,220 L60,160 C30,140 10,100 0,60 C-10,30 20,20 40,40 L100,100 L180,140 L340,220 Z" fill="#d4aa94" filter="drop-shadow(0 15px 25px rgba(0,0,0,0.35))" />
      <!-- Interactive Touch Ripple -->
      <circle cx="0" cy="55" r="14" fill="#ffffff" opacity="0.8" />
      <circle cx="0" cy="55" r="30" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.6" />
    </g>
  </svg>`;

  // Write SVGs to disk
  fs.writeFileSync(path.join(SEED_UPLOADS_DIR, 'tile-1-hbogo.svg'), tile1, 'utf8');
  fs.writeFileSync(path.join(SEED_UPLOADS_DIR, 'tile-2-forbes.svg'), tile2, 'utf8');
  fs.writeFileSync(path.join(SEED_UPLOADS_DIR, 'tile-3-weather.svg'), tile3, 'utf8');
  fs.writeFileSync(path.join(SEED_UPLOADS_DIR, 'tile-4-landrover.svg'), tile4, 'utf8');
  fs.writeFileSync(path.join(SEED_UPLOADS_DIR, 'tile-5-portrait.svg'), tile5, 'utf8');
  fs.writeFileSync(path.join(SEED_UPLOADS_DIR, 'tile-6-telemetry.svg'), tile6, 'utf8');
  fs.writeFileSync(path.join(SEED_UPLOADS_DIR, 'tile-7-kilimanjaro.svg'), tile7, 'utf8');
  fs.writeFileSync(path.join(SEED_UPLOADS_DIR, 'tile-8-mclaren.svg'), tile8, 'utf8');
  fs.writeFileSync(path.join(SEED_UPLOADS_DIR, 'tile-9-volvo.svg'), tile9, 'utf8');

  // Also create a couple of high-impact wide images for project details
  const wideHero = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 750" width="100%" height="100%">
    <defs>
      <linearGradient id="wideGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#090a0f" />
        <stop offset="50%" stop-color="#1a1c29" />
        <stop offset="100%" stop-color="#050608" />
      </linearGradient>
    </defs>
    <rect width="1600" height="750" fill="url(#wideGrad)" />
    <!-- City reflections and ambient spider-man style webs across wide frame -->
    <g stroke="#ffffff" stroke-opacity="0.12" stroke-width="2" fill="none">
      <ellipse cx="800" cy="375" rx="700" ry="300" />
      <ellipse cx="800" cy="375" rx="500" ry="200" />
      <line x1="0" y1="0" x2="1600" y2="750" />
      <line x1="1600" y1="0" x2="0" y2="750" />
    </g>
    <text x="800" y="390" font-family="'Bitter', Georgia, serif" font-weight="900" font-size="54" fill="#ffffff" text-anchor="middle" letter-spacing="4">HBO GO · VISUAL SYSTEM SPECIFICATION</text>
  </svg>`;
  fs.writeFileSync(path.join(SEED_UPLOADS_DIR, 'hbogo-spiderman-wide.svg'), wideHero, 'utf8');

  console.log('Generated 10 high-fidelity visual assets in uploads/seed/');
}

/**
 * Builds and seeds the database
 */
async function generateSeedDb(force = false) {
  ensureDirectories();
  createSvgAssets();

  if (fs.existsSync(config.DB_PATH) && !force) {
    console.log('db.json already exists. Skipping database overwrite.');
    return;
  }

  // Generate bcrypt hash for default admin password
  const defaultPassword = config.ADMIN_PASSWORD;
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const seedData = {
    settings: {
      siteName: "THOMAS MOELLER",
      navLabels: {
        projects: "PROJECTS",
        about: "ABOUT ME",
        contact: "CONTACT"
      },
      socialLinks: [
        { id: "twitter", name: "Twitter/X", url: "https://twitter.com/thomas_moeller", icon: "twitter", visible: true },
        { id: "behance", name: "Behance", url: "https://behance.net/ThomasMoeller", icon: "behance", visible: true },
        { id: "linkedin", name: "LinkedIn", url: "https://linkedin.com/in/thomasjmoeller/", icon: "linkedin", visible: true },
        { id: "dribbble", name: "Dribbble", url: "https://dribbble.com/thomas_moeller", icon: "dribbble", visible: true }
      ],
      accentColor: "#7ec8b8",
      fontHeading: "Bitter",
      fontBody: "Source Sans 3",
      footerText: "Powered by Adobe Portfolio",
      faviconUrl: "",
      seo: {
        metaTitle: "Thomas Moeller — Design Portfolio",
        metaDescription: "Senior Product Designer & Creative Director. Crafting digital experiences, systems, and visual design."
      }
    },
    about: {
      heading: "About me",
      paragraphs: [
        "I'm a believer in the fight. Keeping it simple. Being obsessive over craft, making it personal and giving a shit. I'm curious, empathetic, rigorous, and experimental. I appreciate a holistic way of solving design problems in collaborative teams. I like accelerated methodologies. Thinking quick, rapid prototyping, and learning through testing but not discounting a designer's intuition.",
        "I seek to learn what works and do more of it. Learn what doesn't and change it.",
        "As a design leader, I seek to own creative excellence at every touch-point. I'm a passionate student of real-world design, users, consumers, trends, competitors and culture. Through listening, learning and mining insights, I fight for work that directs my client's brand into amazing places."
      ],
      pullquote: "I'm a firm believer that simple is hard. And that design is truly about problem solving and making people's lives better.",
      photoUrl: "",
      showPhoto: false
    },
    contact: {
      heading: "Contact",
      intro: "Feel free to contact me in the following ways:",
      directMethods: [
        { label: "Phone", value: "(347) 668-1576", link: "tel:3476681576" },
        { label: "Twitter", value: "twitter.com/thomas_moeller", link: "https://twitter.com/thomas_moeller" },
        { label: "Behance", value: "behance.net/ThomasMoeller", link: "https://behance.net/ThomasMoeller" },
        { label: "Dribbble", value: "dribbble.com/thomas_moeller", link: "https://dribbble.com/thomas_moeller" },
        { label: "Linkedin", value: "linkedin.com/in/thomasjmoeller/", link: "https://linkedin.com/in/thomasjmoeller/" }
      ],
      formIntro: "Or use the form below to send me an email!",
      contactEmail: "thomas.moeller@example.com",
      successMessage: "Thank you for getting in touch! I'll get back to you shortly.",
      showPhone: true,
      showSocials: true
    },
    projects: [
      {
        id: "proj_hbo_go",
        title: "HBO GO",
        slug: "hbo-go",
        year: "2014",
        shortDescription: "I was asked to quickly conceptualize some high level visual treatments for the HBO Go interface - establishing a top line visual language and system that could be then applied to their apps and other device platforms. As an initial dive into the system, the exploration touched upon a few visual elements that inspired us to dig deeper.",
        thumbnailUrl: "/uploads/seed/tile-1-hbogo.svg",
        hoverOverlayColor: "#7ec8b8",
        published: true,
        order: 0,
        blocks: [
          {
            id: "b1",
            type: "wide_image",
            url: "/uploads/seed/tile-1-hbogo.svg",
            alt: "HBO GO Cinematic Hero Visual",
            caption: "High-contrast visual language exploratory for streaming entertainment surfaces."
          },
          {
            id: "b2",
            type: "text",
            content: "<p>The core objective was to balance cinematic immersion with swift content discoverability. We explored fluid navigation paradigms, high-contrast imagery, and focused typography hierarchies that translate effortlessly from mobile screens to 10-foot living room displays.</p>"
          },
          {
            id: "b3",
            type: "two_image",
            images: [
              { url: "/uploads/seed/tile-2-forbes.svg", alt: "Interface Component 1", caption: "Typography and navigation grid" },
              { url: "/uploads/seed/tile-3-weather.svg", alt: "Interface Component 2", caption: "Color palette and tonal contrast" }
            ]
          },
          {
            id: "b4",
            type: "text",
            content: "<p>By stripping down superfluous borders and relying strictly on spatial rhythm and dramatic lighting, the interface steps back to allow the studio's premier storytelling to command complete focus.</p>"
          },
          {
            id: "b5",
            type: "wide_image",
            url: "/uploads/seed/hbogo-spiderman-wide.svg",
            alt: "HBO GO Architecture Diagram",
            caption: "Design system tokens and responsive breakout grid."
          }
        ],
        seo: {
          metaTitle: "HBO GO Interface System — Thomas Moeller",
          metaDescription: "Visual design treatments and conceptual design system for HBO GO cross-device streaming platforms."
        },
        createdAt: "2014-06-15T10:00:00.000Z",
        updatedAt: "2014-06-15T10:00:00.000Z"
      },
      {
        id: "proj_forbes_30u30",
        title: "Forbes '30 Under 30'",
        slug: "forbes-30-under-30",
        year: "2015",
        shortDescription: "An editorial mobile application experience celebrating the yearly innovators and game-changers across twelve global industries.",
        thumbnailUrl: "/uploads/seed/tile-2-forbes.svg",
        hoverOverlayColor: "#7ec8b8",
        published: true,
        order: 1,
        blocks: [
          {
            id: "fb1",
            type: "image",
            url: "/uploads/seed/tile-2-forbes.svg",
            alt: "Forbes 30 Under 30 App",
            caption: "Tactile card interactions designed for quick browsing on high-density displays."
          },
          {
            id: "fb2",
            type: "text",
            content: "<p>The annual Forbes 30 Under 30 list required a fresh, energetic presentation that departed from traditional newsprint feeds. We designed a swipeable profile system that combined bold editorial typography with personal interviews, audio snippets, and career milestones.</p>"
          }
        ],
        seo: { metaTitle: "Forbes 30 Under 30 — Thomas Moeller", metaDescription: "Mobile editorial app design for Forbes 30 Under 30." }
      },
      {
        id: "proj_weather_time",
        title: "Atmosphere & Weather",
        slug: "atmosphere-weather",
        year: "2015",
        shortDescription: "A glanceable environmental dashboard tracking atmospheric pressure, surf conditions, and daylight shifts across global locations.",
        thumbnailUrl: "/uploads/seed/tile-3-weather.svg",
        hoverOverlayColor: "#7ec8b8",
        published: true,
        order: 2,
        blocks: [
          {
            id: "w1",
            type: "image",
            url: "/uploads/seed/tile-3-weather.svg",
            alt: "Atmosphere Dashboard",
            caption: "Minimalist quadrant layout highlighting primary meteorological signals."
          },
          {
            id: "w2",
            type: "text",
            content: "<p>Designed for expedition leaders and ocean athletes who need immediate clarity without digging through nested menus. The four-quadrant layout adapts dynamically according to tidal shifts, wind direction, and solar zenith.</p>"
          }
        ]
      },
      {
        id: "proj_land_rover",
        title: "Land Rover Explore",
        slug: "land-rover-explore",
        year: "2015",
        shortDescription: "A digital campaign and interactive 3D configurator designed for the rugged 2015 Range Rover HSE launch across North America.",
        thumbnailUrl: "/uploads/seed/tile-4-landrover.svg",
        hoverOverlayColor: "#7ec8b8",
        published: true,
        order: 3,
        blocks: [
          {
            id: "lr1",
            type: "wide_image",
            url: "/uploads/seed/tile-4-landrover.svg",
            alt: "Land Rover Explore Campaign",
            caption: "Hero campaign imagery combining desert terrain photography with digital typography."
          },
          {
            id: "lr2",
            type: "text",
            content: "<p>The Explore campaign challenged conventional automotive configurators by pairing real GPS route data with tactile terrain rendering. Prospective drivers could simulate journeys across desert canyons, snow passes, and coastal highways while customizing vehicle specifications.</p>"
          }
        ]
      },
      {
        id: "proj_generations",
        title: "Generations",
        slug: "generations",
        year: "2016",
        shortDescription: "Art direction and brand photography capturing authentic moments of human connection, heritage, and timeless family legacy.",
        thumbnailUrl: "/uploads/seed/tile-5-portrait.svg",
        hoverOverlayColor: "#7ec8b8",
        published: true,
        order: 4,
        blocks: [
          {
            id: "g1",
            type: "image",
            url: "/uploads/seed/tile-5-portrait.svg",
            alt: "Generations Portrait Photography",
            caption: "Natural light photography focusing on unfiltered emotion and family connection."
          },
          {
            id: "g2",
            type: "text",
            content: "<p>A visual essay examining how design, values, and memory are transmitted across generations. Shot entirely in natural golden-hour illumination across Northern California.</p>"
          }
        ]
      },
      {
        id: "proj_telemetry_app",
        title: "Telemetry Track App",
        slug: "telemetry-track-app",
        year: "2014",
        shortDescription: "High-precision automotive telemetry software and companion mobile app developed for track-day drivers and performance tuning engineers.",
        thumbnailUrl: "/uploads/seed/tile-6-telemetry.svg",
        hoverOverlayColor: "#7ec8b8",
        published: true,
        order: 5,
        blocks: [
          {
            id: "t1",
            type: "image",
            url: "/uploads/seed/tile-6-telemetry.svg",
            alt: "Track Telemetry Mobile Application",
            caption: "Real-time lap timing, speed deltas, and G-force mapping."
          },
          {
            id: "t2",
            type: "text",
            content: "<p>Track drivers need instantaneous split-second telemetry without distracting from the road ahead. We engineered high-contrast typography and color-coded delta zones that remain readable under harsh cockpit sunlight and vibration.</p>"
          }
        ]
      },
      {
        id: "proj_kilimanjaro",
        title: "Kilimanjaro Digital",
        slug: "kilimanjaro-digital",
        year: "2013",
        shortDescription: "Cross-platform digital brand identity and responsive web application for East Africa's flagship beverage brand.",
        thumbnailUrl: "/uploads/seed/tile-7-kilimanjaro.svg",
        hoverOverlayColor: "#7ec8b8",
        published: true,
        order: 6,
        blocks: [
          {
            id: "k1",
            type: "image",
            url: "/uploads/seed/tile-7-kilimanjaro.svg",
            alt: "Kilimanjaro Responsive Ecosystem",
            caption: "Responsive web design tested across tablet, mobile, and desktop environments."
          },
          {
            id: "k2",
            type: "text",
            content: "<p>Emphasizing the authentic heritage of Mount Kilimanjaro, the digital brand system blends rich warm tones, wood textures, and interactive storytelling to engage both local communities and international travelers.</p>"
          }
        ]
      },
      {
        id: "proj_mclaren_p1",
        title: "McLaren P1 Launch",
        slug: "mclaren-p1-launch",
        year: "2014",
        shortDescription: "An interactive digital experience and web portal showcasing the groundbreaking aerodynamics and hybrid powertrain of the McLaren P1 hypercar.",
        thumbnailUrl: "/uploads/seed/tile-8-mclaren.svg",
        hoverOverlayColor: "#7ec8b8",
        published: true,
        order: 7,
        blocks: [
          {
            id: "m1",
            type: "wide_image",
            url: "/uploads/seed/tile-8-mclaren.svg",
            alt: "McLaren P1 Aerodynamics Visual",
            caption: "Dynamic computational fluid dynamics visualization and active rear wing aero simulation."
          },
          {
            id: "m2",
            type: "text",
            content: "<p>To unveil McLaren's pinnacle hybrid supercar, we crafted an interactive portal detailing active aerodynamic downforce, chassis dynamics, and powertrain telemetry at 200+ mph.</p>"
          }
        ]
      },
      {
        id: "proj_volvo_fh",
        title: "Volvo FH Experience",
        slug: "volvo-fh-experience",
        year: "2015",
        shortDescription: "An interactive multi-touch transparent glass showroom installation allowing customers to explore truck anatomy, custom cabins, and powertrain safety.",
        thumbnailUrl: "/uploads/seed/tile-9-volvo.svg",
        hoverOverlayColor: "#7ec8b8",
        published: true,
        order: 8,
        blocks: [
          {
            id: "v1",
            type: "image",
            url: "/uploads/seed/tile-9-volvo.svg",
            alt: "Volvo FH Interactive Showroom Glass Display",
            caption: "Touchscreen installation allowing commercial buyers to dissect truck engineering in real time."
          },
          {
            id: "v2",
            type: "text",
            content: "<p>Installed across premier European showroom centers, this interactive transparent glass screen lets prospective fleet buyers touch, rotate, and configure complex heavy transport vehicles with intuitive gestures.</p>"
          }
        ]
      }
    ],
    inbox: [],
    users: [
      {
        id: "admin",
        username: config.ADMIN_USER,
        passwordHash: passwordHash,
        mustChangePassword: true,
        updatedAt: new Date().toISOString()
      }
    ]
  };

  // Write canonical seed file
  fs.writeFileSync(config.SEED_PATH, JSON.stringify(seedData, null, 2), 'utf8');
  console.log('Saved canonical seed database to data/db.seed.json');

  // Also write db.json
  fs.writeFileSync(config.DB_PATH, JSON.stringify(seedData, null, 2), 'utf8');
  console.log('Initialized data/db.json with 9 projects and admin user.');

  const db = require('../server/db');
  db.initDb();
}

if (require.main === module) {
  generateSeedDb(true)
    .then(() => {
      console.log('Database and seed assets successfully generated.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}

module.exports = { generateSeedDb };
