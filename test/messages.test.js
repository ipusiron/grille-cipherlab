const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const messages = require('../js/messages.js');

test('message formatting replaces documented parameters', () => {
  assert.equal(messages.format('ja', 'key.length', { length: 8 }), '鍵は1〜4の数字を9個並べます（いまは8個）');
  assert.equal(messages.format('ja', 'cipher.length', { length: 42, missing: 30 }),
    '暗号文は36文字の倍数にしてください（いまは42文字。あと30文字）');
  assert.equal(messages.format('ja', 'pattern.orbit', { count: 1 }),
    'このパターンは回転グリルになりません。穴が重なる組、または穴のない組が1組あります');
});

test('every literal t call in UI files has a dictionary entry', () => {
  const jsDir = path.join(__dirname, '..', 'js');
  const keys = [];
  for (const name of fs.readdirSync(jsDir).filter(name => name.endsWith('.js') && name !== 'messages.js')) {
    const source = fs.readFileSync(path.join(jsDir, name), 'utf8');
    for (const match of source.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g)) keys.push(match[1]);
  }
  assert.ok(keys.length > 0);
  for (const key of keys) assert.equal(Object.prototype.hasOwnProperty.call(messages.ja, key), true, key);
});

test('the dictionary is complete and missing keys or values fail loudly', () => {
  assert.throws(() => messages.format('ja', 'missing.key'), /Unknown message key/);
  assert.throws(() => messages.format('ja', 'key.length'), /Missing message parameter/);
  for (const value of Object.values(messages.ja)) assert.notEqual(value, '');
  const expected = ['key.length', 'key.range', 'pattern.size', 'pattern.char', 'pattern.orbit',
    'input.noLetters', 'input.tooLong', 'cipher.length'];
  for (const key of expected) assert.equal(Object.prototype.hasOwnProperty.call(messages.ja, key), true);
});
