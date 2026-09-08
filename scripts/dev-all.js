const {
  spawn,
} = require('node:child_process');
const {
  existsSync,
} = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root =
  path.resolve(
    __dirname,
    '..',
  );

const onlineMode =
  process.argv.includes(
    '--online',
  );

const productionApi =
  'https://tamir-bakim-api.onrender.com';

function getLanIp() {
  const interfaces =
    os.networkInterfaces();

  for (
    const entries of
      Object.values(interfaces)
  ) {
    for (
      const entry of
        entries || []
    ) {
      if (
        entry.family ===
          'IPv4' &&
        !entry.internal &&
        !entry.address.startsWith(
          '169.254.',
        )
      ) {
        return entry.address;
      }
    }
  }

  return null;
}

const lanIp =
  getLanIp();

const webApiUrl =
  onlineMode
    ? productionApi
    : 'http://localhost:3000';

const mobileApiUrl =
  onlineMode
    ? productionApi
    : lanIp
      ? `http://${lanIp}:3000`
      : 'http://127.0.0.1:3000';

const npmCommand =
  process.platform ===
    'win32'
    ? 'npm.cmd'
    : 'npm';

const children = [];

function start(
  name,
  cwd,
  args,
  env = {},
) {
  console.log(
    `\n[DEV] ${name} başlatılıyor...`,
  );

  const child =
    spawn(
      npmCommand,
      args,
      {
        cwd:
          path.join(
            root,
            cwd,
          ),
        stdio: 'inherit',
        env: {
          ...process.env,
          ...env,
        },
        shell: false,
      },
    );

  child.on(
    'exit',
    (code) => {
      if (
        code &&
        code !== 0
      ) {
        console.error(
          `[DEV] ${name} ${code} koduyla kapandı.`,
        );
      }
    },
  );

  children.push(
    child,
  );
}

function shutdown() {
  console.log(
    '\n[DEV] Servisler kapatılıyor...',
  );

  for (
    const child of children
  ) {
    if (
      !child.killed
    ) {
      child.kill();
    }
  }

  setTimeout(
    () =>
      process.exit(0),
    250,
  );
}

process.on(
  'SIGINT',
  shutdown,
);
process.on(
  'SIGTERM',
  shutdown,
);

console.log(
  '========================================',
);
console.log(
  ' TAMİR BAKIM - TEK KOMUT GELİŞTİRME',
);
console.log(
  '========================================',
);
console.log(
  `Mod: ${onlineMode ? 'ONLINE API' : 'LOCAL FULL STACK'}`,
);
console.log(
  `Web API: ${webApiUrl}`,
);
console.log(
  `Mobil API: ${mobileApiUrl}`,
);

if (
  !onlineMode &&
  !existsSync(
    path.join(
      root,
      'apps',
      'api',
      '.env',
    ),
  )
) {
  console.warn(
    '\n[UYARI] apps/api/.env bulunamadı.',
  );
  console.warn(
    'Local API için apps/api/.env dosyasını hazırlaman gerekiyor.',
  );
  console.warn(
    'İstersen geçici olarak "npm.cmd run dev:online" kullanabilirsin.\n',
  );
}

if (
  !onlineMode &&
  !lanIp
) {
  console.warn(
    '[UYARI] LAN IP bulunamadı. iPhone local API’ye erişemeyebilir.',
  );
}

if (
  !onlineMode
) {
  start(
    'API',
    'apps/api',
    [
      'run',
      'start:dev',
    ],
  );
}

start(
  'WEB',
  'apps/web',
  [
    'run',
    'dev',
  ],
  {
    VITE_API_URL:
      webApiUrl,
  },
);

start(
  'MOBIL',
  'apps/mobile',
  [
    'run',
    'start',
    '--',
    '--clear',
  ],
  {
    EXPO_PUBLIC_API_URL:
      mobileApiUrl,
  },
);

console.log(
  '\n[DEV] Hepsi başlatıldı.',
);
console.log(
  '[DEV] Kapatmak için Ctrl+C.',
);
