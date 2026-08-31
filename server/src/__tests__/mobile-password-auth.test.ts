import assert from 'node:assert/strict';
import test from 'node:test';

import {
  compareMobilePassword,
  hashMobilePassword,
  isValidMobilePassword
} from '../services/mobile-password';

test('mobile password rule requires 8+ chars with a letter and digit', () => {
  assert.equal(isValidMobilePassword('abcdefg1'), true);
  assert.equal(isValidMobilePassword('abcdefgh'), false);
  assert.equal(isValidMobilePassword('12345678'), false);
  assert.equal(isValidMobilePassword('abc123'), false);
});

test('mobile passwords are bcrypt hashed and compared', async () => {
  const hash = await hashMobilePassword('secure123');

  assert.notEqual(hash, 'secure123');
  assert.match(hash, /^\$2[aby]\$/);
  assert.equal(await compareMobilePassword('secure123', hash), true);
  assert.equal(await compareMobilePassword('wrong123', hash), false);
});
