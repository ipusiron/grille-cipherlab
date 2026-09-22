const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const ngrams = require('../js/ngram-models.js');

test('the English and French trigram models match their documented values', () => {
  assert.deepEqual(ngrams.LANGS, ['en', 'fr']);
  const en = ngrams.trigrams('en');
  const fr = ngrams.trigrams('fr');
  assert.equal(en.length, 17576);
  assert.equal(fr.length, 17576);
  const index = word => [...word].reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 65, 0);
  assert.equal(en[index('THE')], -172);
  assert.equal(fr[index('QUE')], -221);
  assert.equal(fr[index('ZZZ')], -851);
  assert.equal(ngrams.info('en').floor, -871);
  assert.equal(ngrams.info('fr').floor, -851);
  assert.equal(ngrams.info('en').totalLetters, 5141270);
  assert.equal(ngrams.info('fr').totalLetters, 3228303);
  assert.deepEqual(ngrams.info('fr').sources.map(source => source.id), [798, 800, 4791, 5097, 14155, 17989]);
  for (const [lang, model] of [['en', en], ['fr', fr]]) {
    const floor = ngrams.info(lang).floor;
    assert.equal([...model].every(value => Number.isInteger(value) && value >= floor && value <= 0), true);
  }
});

test('the generated ngram model remains byte-for-byte unchanged', () => {
  const file = fs.readFileSync(path.join(__dirname, '..', 'js', 'ngram-models.js'), 'utf8').replace(/\r\n/g, '\n');
  const digest = crypto.createHash('sha256').update(file).digest('hex');
  assert.equal(digest, 'bc9c02b9b9fe19a9c1012b28e872fefc2cd5338d5a123b68a5de78e353fc12b9');
});
