const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const messages = require('../js/messages.js');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const readmeJa = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const readmeEn = fs.readFileSync(path.join(root, 'README.en.md'), 'utf8');

function treeLines(markdown) {
  const section = markdown.match(/^## 📁[^\n]*\n[\s\S]*?```text\n([\s\S]*?)```/m);
  assert.ok(section, 'directory tree');
  return section[1].trimEnd().split('\n');
}

test('Japanese and English dictionaries have identical, complete key sets', () => {
  const ja = Object.keys(messages.dictionaries.ja).sort();
  const en = Object.keys(messages.dictionaries.en).sort();
  assert.deepEqual(en, ja);
  assert.doesNotMatch(Object.values(messages.dictionaries.en).join('\n'), /[ぁ-んァ-ヶ一-龠]/);
  for (const value of Object.values(messages.dictionaries.ja)) assert.notEqual(value, '');
});

test('HTML i18n attributes refer to dictionary keys', () => {
  const keys = [...html.matchAll(/\bdata-i18n(?:-[a-z-]+)?="([^"]+)"/g)].map(match => match[1]);
  assert.ok(keys.length > 0);
  for (const key of keys) assert.ok(Object.prototype.hasOwnProperty.call(messages.dictionaries.ja, key), key);
});

test('the Japanese dictionary retains representative first-release wording', () => {
  const ja = messages.dictionaries.ja;
  assert.equal(ja['sample.book'], '書籍の例（36文字）');
  assert.equal(ja['key.reset'], '既定のグリルに戻しました');
  assert.equal(ja['copy.done'], 'コピーしました');
  assert.equal(ja['shortcut.next'], '進む');
  assert.equal(ja['theme.auto.changed'], 'システム連動モードに切り替えました');
});

test('English README mirrors the Japanese section and tree structure', () => {
  assert.ok(fs.existsSync(path.join(root, 'README.en.md')));
  assert.equal((readmeEn.match(/^## /gm) || []).length, (readmeJa.match(/^## /gm) || []).length);
  assert.equal(treeLines(readmeEn).length, treeLines(readmeJa).length);
  assert.doesNotMatch(readmeEn, /[ぁ-んァ-ヶ一-龠]/);
  const jaImages = [...readmeJa.matchAll(/!\[[^\]]*\]\((assets\/[^)]+)\)/g)].map(match => match[1]);
  const enImages = [...readmeEn.matchAll(/!\[[^\]]*\]\((assets\/[^)]+)\)/g)].map(match => match[1]);
  assert.deepEqual(enImages, jaImages);
});
