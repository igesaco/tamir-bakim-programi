const test = require('node:test');
const assert = require('node:assert/strict');
const { parseResult, valueAfterLabel } = require('../src/documentOcrParser.cjs');

test('ADI does not match SOYADI', () => {
  const result = parseResult('SOYADI: BİLGİCİ\nADI: SERHAT', 'identity');
  assert.equal(result.firstName, 'SERHAT');
  assert.equal(result.lastName, 'BİLGİCİ');
});

test('MODEL does not match MODEL YILI', () => {
  const result = parseResult('MODEL YILI: 2022\nMODEL: COROLLA\nMARKA: TOYOTA\n47 ABC 123', 'vehicle');
  assert.equal(result.modelYear, '2022');
  assert.equal(result.model, 'COROLLA');
  assert.equal(result.brand, 'TOYOTA');
  assert.equal(result.plate, '47 ABC 123');
});

test('slash headings and next-line values are supported', () => {
  assert.equal(valueAfterLabel(['ADI / GIVEN NAMES', 'SERHAT'], ['ADI']), 'SERHAT');
});

test('vehicle registration field codes populate all vehicle fields', () => {
  const result = parseResult([
    '(A) PLAKA', '47 ABC 123',
    '(D.1) MARKASI', 'RENAULT',
    '(D.2) TİPİ', 'RJA',
    '(D.3) TİCARİ ADI', 'CLIO',
    '(D.4) MODEL YILI', '2021',
    '(E) ŞASİ NO', 'VF1RJA00012345678',
  ].join('\n'), 'registration');
  assert.deepEqual(
    { plate: result.plate, brand: result.brand, model: result.model, modelYear: result.modelYear, vin: result.vin },
    { plate: '47 ABC 123', brand: 'RENAULT', model: 'CLIO', modelYear: '2021', vin: 'VF1RJA00012345678' },
  );
});

test('vehicle registration labels without colons are supported', () => {
  const result = parseResult([
    'PLAKA 34 XYZ 987',
    'MARKASI TOYOTA',
    'TİCARİ ADI COROLLA',
    'MODEL YILI 2022',
    'ŞASİ NO NMTBZ3BE00R123456',
  ].join('\n'), 'registration');
  assert.equal(result.plate, '34 XYZ 987');
  assert.equal(result.brand, 'TOYOTA');
  assert.equal(result.model, 'COROLLA');
  assert.equal(result.modelYear, '2022');
  assert.equal(result.vin, 'NMTBZ3BE00R123456');
});
