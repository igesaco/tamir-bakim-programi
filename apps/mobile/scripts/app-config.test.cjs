const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');
const eas = require('../eas.json');
const base = require('../app.json').expo;

function evaluate(overrides = {}) {
  const env = { ...process.env };
  for (const key of ['APP_VARIANT', 'EAS_BUILD_PROFILE', 'EXPO_PUBLIC_API_URL']) delete env[key];
  return spawnSync(process.execPath, ['-e',
    "console.log(JSON.stringify(require('./app.config')({ config: require('./app.json').expo })))",
  ], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...env, ...overrides },
    encoding: 'utf8',
  });
}

test('Normal build keeps the existing application identity and configuration', () => {
  const result = evaluate();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), base);
});

for (const value of [undefined, '', 'invalid', 'http://test.example.com',
  'https://tamir-bakim-api.onrender.com', 'https://TAMIR-BAKIM-API.ONRENDER.COM./',
  'https://user:password@test.example.com', 'https://test.example.com?token=secret']) {
  test(`Trial configuration rejects unsafe or missing API: ${value}`, () => {
    const env = { APP_VARIANT: 'workflowD' };
    if (value !== undefined) env.EXPO_PUBLIC_API_URL = value;
    const result = evaluate(env);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Workflow D/);
  });
}

test('EAS profile cannot silently fall back to production without APP_VARIANT', () => {
  const result = evaluate({ EAS_BUILD_PROFILE: 'workflowD-testflight' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Workflow D/);
});

test('Trial API produces a labeled build using the existing store identities', () => {
  const result = evaluate({ APP_VARIANT: 'workflowD', EXPO_PUBLIC_API_URL: 'https://test.example.com' });
  assert.equal(result.status, 0, result.stderr);
  const config = JSON.parse(result.stdout);
  assert.equal(config.name, 'Tamir Bakım Deneme');
  assert.equal(config.ios.bundleIdentifier, base.ios.bundleIdentifier);
  assert.equal(config.android.package, base.android.package);
  assert.deepEqual(config.plugins, base.plugins);
});

test('TestFlight uses store distribution and preview environment, without a production URL override', () => {
  const profile = { ...eas.build.workflowD, ...eas.build['workflowD-testflight'] };
  assert.equal(profile.distribution, 'store');
  assert.equal(profile.environment, 'preview');
  assert.equal(profile.autoIncrement, true);
  assert.equal(profile.env.APP_VARIANT, 'workflowD');
  assert.equal(profile.env.EXPO_PUBLIC_API_URL, undefined);
});
