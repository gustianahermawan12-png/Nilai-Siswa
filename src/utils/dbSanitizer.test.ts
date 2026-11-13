import test from 'node:test';
import assert from 'node:assert/strict';
import {
  stripUndefined,
  normalizeUsername,
  validateCredentialsInput,
  getShareableAppUrl,
  formatPasswordDisplay,
  validateAcademicYearInput,
} from './dbSanitizer';

test('stripUndefined removes undefined object properties recursively', () => {
  const input = {
    id: 'usr-1',
    username: 'wali_test',
    linkedStudentId: undefined,
    nested: {
      a: 1,
      b: undefined,
      arr: [{ x: 1, y: undefined }, undefined, { x: 2 }],
    },
  };

  const cleaned = stripUndefined(input);
  assert.equal('linkedStudentId' in cleaned, false);
  assert.equal('b' in cleaned.nested, false);
  assert.equal(cleaned.nested.arr.length, 2);
  assert.equal('y' in (cleaned.nested.arr[0] as Record<string, unknown>), false);
  assert.equal(cleaned.nested.a, 1);
});

test('normalizeUsername trims and lowercases username', () => {
  assert.equal(normalizeUsername('  Admin_Madrasah '), 'admin_madrasah');
  assert.equal(normalizeUsername('Wali Ahmad'), 'waliahmad');
});

test('validateCredentialsInput enforces username and password rules cleanly', () => {
  const emptyUser = validateCredentialsInput({
    username: '   ',
    password: 'secret',
    requirePassword: true,
  });
  assert.equal(emptyUser.valid, false);
  assert.ok(emptyUser.error);

  const spaceUser = validateCredentialsInput({
    username: 'wali ahmad',
    password: 'secret',
    requirePassword: true,
  });
  assert.equal(spaceUser.valid, false);

  const shortPass = validateCredentialsInput({
    username: 'wali_ahmad',
    password: '123',
    requirePassword: true,
  });
  assert.equal(shortPass.valid, false);

  const validEditNoPass = validateCredentialsInput({
    username: ' Wali_Baru ',
    password: '',
    requirePassword: false,
  });
  assert.equal(validEditNoPass.valid, true);
  assert.equal(validEditNoPass.cleanUsername, 'wali_baru');
  assert.equal(validEditNoPass.cleanPassword, '');
});

test('getShareableAppUrl maps ais-dev to ais-pre for sharing', () => {
  assert.equal(
    getShareableAppUrl('https://ais-dev-abc123.asia-southeast1.run.app'),
    'https://ais-pre-abc123.asia-southeast1.run.app'
  );
  assert.equal(
    getShareableAppUrl('https://ais-pre-abc123.asia-southeast1.run.app'),
    'https://ais-pre-abc123.asia-southeast1.run.app'
  );
});

test('formatPasswordDisplay hides sha256 hashes', () => {
  assert.equal(formatPasswordDisplay('sha256:abcdef1234'), '•••••••• (Terenkripsi)');
  assert.equal(formatPasswordDisplay(undefined), '-');
  assert.equal(formatPasswordDisplay('wali123'), 'wali123');
});

test('validateAcademicYearInput trims spaces and validates non-empty year', () => {
  assert.equal(validateAcademicYearInput('   ').valid, false);
  assert.equal(validateAcademicYearInput('24').valid, false);
  const ok = validateAcademicYearInput('  2025 / 2026  ');
  assert.equal(ok.valid, true);
  assert.equal(ok.cleanYear, '2025/2026');
});
