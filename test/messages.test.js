const test = require('node:test');
const assert = require('node:assert/strict');
const messages = require('../js/messages.js');

test('message formatting replaces documented parameters', () => {
  assert.equal(messages.format('ja', 'key.length', { length: 8 }), '鍵は1〜4の数字を9個並べます（いまは8個）');
  assert.equal(messages.format('ja', 'cipher.length', { length: 42, missing: 30 }),
    '暗号文は36文字の倍数にしてください（いまは42文字。あと30文字）');
  assert.equal(messages.format('ja', 'pattern.orbit', { count: 1 }),
    'このパターンは回転グリルになりません。穴が重なる組、または穴のない組が1組あります');
});

test('the dictionary is complete and missing keys or values fail loudly', () => {
  assert.throws(() => messages.format('ja', 'missing.key'), /Unknown message key/);
  assert.throws(() => messages.format('ja', 'key.length'), /Missing message parameter/);
  for (const value of Object.values(messages.ja)) assert.notEqual(value, '');
  const expected = ['key.length', 'key.range', 'pattern.size', 'pattern.char', 'pattern.orbit',
    'input.noLetters', 'input.tooLong', 'cipher.length'];
  for (const key of expected) assert.equal(Object.prototype.hasOwnProperty.call(messages.ja, key), true);
});
