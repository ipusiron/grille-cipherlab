const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const logic = require('../js/grille-cipher-logic.js');
const samples = require('../js/samples.js');

const NORMAL = 'TOUTESTPRETAUPREMIERSIGNALQUEVOUSNOUSENVERREZDETRIESTETOUSSELEVERONTENMASSEPOURLINDEPENDANCEDELAHONGRIEXRZAH';
const REVERSED = 'HAZRXEIRGNOHALEDECNADNEPEDNILRUOPESSAMNETNOREVELESSUOTETSEIRTEDZERREVNESUONSUOVEUQLANGISREIMERPUATERPTSETUOT';

test('the Sandorf known answer matches all 18 words and 12 readings', () => {
  const sandorf = samples.find(sample => sample.id === 'sandorf');
  assert.equal(logic.normalizeText(sandorf.original).letters, NORMAL);
  assert.equal(logic.normalizeText(sandorf.original).removed, 5);
  assert.equal(sandorf.plain, REVERSED);
  const encrypted = logic.encrypt(sandorf.plain, sandorf.key, { direction: sandorf.direction });
  assert.equal(logic.formatGroups(encrypted.ciphertext), sandorf.cipher);
  const decrypted = logic.decrypt(sandorf.cipher, sandorf.key, { direction: sandorf.direction });
  assert.deepEqual(decrypted.blocks.flatMap(block => block.steps.map(step => step.letters)), [
    'HAZRXEIRG', 'NOHALEDEC', 'NADNEPEDN', 'ILRUOPESS',
    'AMNETNORE', 'VELESSUOT', 'ETSEIRTED', 'ZERREVNES',
    'UONSUOVEU', 'QLANGISRE', 'IMERPUATE', 'RPTSETUOT'
  ]);
  assert.equal(logic.reverseLetters(decrypted.plaintext), NORMAL);
  assert.notEqual(logic.decrypt(sandorf.cipher, sandorf.key, { direction: 'ccw' }).plaintext, REVERSED);
});

test('all three samples encrypt and decrypt using their declared values', () => {
  assert.equal(samples.length, 3);
  for (const sample of samples) {
    const encrypted = logic.encrypt(sample.plain, sample.key, { direction: sample.direction });
    assert.equal(encrypted.ciphertext, logic.normalizeText(sample.cipher).letters);
    const decrypted = logic.decrypt(sample.cipher, sample.key, { direction: sample.direction });
    assert.equal(decrypted.plaintext, encrypted.blocks.map(block => block.plain).join(''));
  }
});

test('sample data contains no Japanese text', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'samples.js'), 'utf8');
  assert.doesNotMatch(source.replace(/\/\/.*$/gm, ''), /[\u3040-\u30ff\u3400-\u9fff]/u);
});
