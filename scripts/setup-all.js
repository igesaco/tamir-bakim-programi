const {
  spawnSync,
} = require('node:child_process');
const path = require('node:path');

const root =
  path.resolve(
    __dirname,
    '..',
  );

const npmCommand =
  process.platform ===
    'win32'
    ? 'npm.cmd'
    : 'npm';

const targets = [
  {
    name: 'ROOT',
    cwd: root,
    args: [
      'ci',
    ],
  },
  {
    name: 'API',
    cwd:
      path.join(
        root,
        'apps',
        'api',
      ),
    args: [
      'ci',
    ],
  },
  {
    name: 'WEB',
    cwd:
      path.join(
        root,
        'apps',
        'web',
      ),
    args: [
      'ci',
    ],
  },
  {
    name: 'MOBIL',
    cwd:
      path.join(
        root,
        'apps',
        'mobile',
      ),
    args: [
      'install',
      '--package-lock=false',
    ],
  },
];

for (
  const target of targets
) {
  console.log(
    `\n[SETUP] ${target.name} bağımlılıkları kuruluyor...`,
  );

  const result =
    spawnSync(
      npmCommand,
      target.args,
      {
        cwd:
          target.cwd,
        stdio:
          'inherit',
        shell:
          process.platform ===
          'win32',
      },
    );

  if (
    result.error
  ) {
    console.error(
      `\n[SETUP] ${target.name} başlatılamadı: ${result.error.message}`,
    );
    process.exit(1);
  }

  if (
    result.status !== 0
  ) {
    console.error(
      `\n[SETUP] ${target.name} kurulumu başarısız.`,
    );
    process.exit(
      result.status || 1,
    );
  }
}

console.log(
  '\n[SETUP] Tüm bağımlılıklar hazır.',
);
console.log(
  '[SETUP] Başlatmak için: npm.cmd run dev',
);
