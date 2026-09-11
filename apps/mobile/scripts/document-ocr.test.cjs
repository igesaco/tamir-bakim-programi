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
