import assert from 'node:assert/strict';
import test from 'node:test';

import { isPlaceholderMediaUrl, optionalContentMediaUrl } from '../lib/content-media-url';

test('rejects known placeholder media URLs while allowing uploaded and real media', () => {
  assert.equal(isPlaceholderMediaUrl('https://example.com/tomato.jpg'), true);
  assert.equal(isPlaceholderMediaUrl('https://cdn.test/images/placeholder.webp'), true);
  assert.equal(isPlaceholderMediaUrl('/uploads/recipes/tomato.webp'), false);
  assert.equal(isPlaceholderMediaUrl('https://images.example-cdn.com/tomato.webp'), false);

  const schema = optionalContentMediaUrl();
  assert.equal(schema.safeParse('https://example.com/tomato.jpg').success, false);
  assert.equal(schema.safeParse('/uploads/recipes/tomato.webp').success, true);
  assert.equal(schema.safeParse(null).success, true);
});
