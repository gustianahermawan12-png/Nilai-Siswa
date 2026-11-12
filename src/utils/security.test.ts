import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from './security';

test('hashPassword creates a sha256 formatted hash', async () => {
  const hash = await hashPassword('rahasia123');
  assert.ok(hash.startsWith('sha256:'));
  assert.equal(hash.split(':').length, 2);
  assert.equal(hash.split(':')[1].length, 64);
});

test('verifyPassword verifies matching password with sha256 hash', async () => {
  const hash = await hashPassword('kuncirahasia');
  const valid = await verifyPassword('kuncirahasia', hash);
  assert.equal(valid, true);

  const invalid = await verifyPassword('passwordsalah', hash);
  assert.equal(invalid, false);
});

test('verifyPassword handles legacy plaintext password gracefully', async () => {
  const valid = await verifyPassword('admin123', 'admin123');
  assert.equal(valid, true);

  const invalid = await verifyPassword('wrongpassword', 'admin123');
  assert.equal(invalid, false);
});
