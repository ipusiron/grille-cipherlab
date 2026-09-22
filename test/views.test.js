const test = require('node:test');
const assert = require('node:assert/strict');
const logic = require('../js/grille-cipher-logic.js');
const samples = require('../js/samples.js');

test('book encryption views are derived only from done', () => {
  const result = logic.encrypt(samples[0].plain, samples[0].key, { direction: 'cw' });
  const zero = logic.encryptionView(result, 0);
  assert.deepEqual([zero.blockIndex, zero.blockCount, zero.rotation, zero.turns, zero.angle, zero.placed, zero.finished],
    [0, 1, 0, 0, 0, 0, false]);
  assert.deepEqual(zero.paper, Array(6).fill('______'));
  assert.deepEqual(zero.fresh, []);
  const two = logic.encryptionView(result, 2);
  assert.deepEqual(two.paper, ['_DH_AA', 'PY_P__', '___Y_S', '_F_ROH', 'OL_I__', '__M__T']);
  assert.equal(two.output, '');
  const four = logic.encryptionView(result, 4);
  assert.deepEqual(four.paper, ['TDHOAA', 'PYHPEH', 'UNFYAS', 'MFNROH', 'OLTIII', 'NLMGYT']);
  assert.equal(four.output, result.ciphertext);
  assert.equal(four.finished, true);
  assert.deepEqual(logic.encryptionView(result, -1), zero);
  assert.deepEqual(logic.encryptionView(result, 99), four);
});

test('multi-block and Sandorf views expose block progress and cumulative output', () => {
  const long = logic.encrypt('HAPPY HOLIDAYS FROM THE HUNTINGTON FAMILY Z', logic.DEFAULT_KEY);
  const five = logic.encryptionView(long, 5);
  assert.deepEqual([five.blockIndex, five.blockCount, five.turns, five.angle, five.placed], [1, 2, 4, 360, 45]);
  assert.deepEqual(five.paper, ['__Z__X', 'X__X__', '___X__', '_____X', 'XX_X__', '______']);
  const sandorf = samples[1];
  const decrypted = logic.decrypt(sandorf.cipher, sandorf.key, { direction: sandorf.direction });
  const first = logic.decryptionView(decrypted, 1);
  assert.equal(first.output, 'HAZRXEIRG');
  const last = logic.decryptionView(decrypted, 12);
  assert.deepEqual([last.blockIndex, last.blockCount, last.rotation, last.turns, last.angle, last.read, last.finished],
    [2, 3, 3, 11, 990, 108, true]);
  assert.equal(last.output, sandorf.plain);
});

test('views are order independent for every sample', () => {
  for (const sample of samples) {
    const encrypted = logic.encrypt(sample.plain, sample.key, { direction: sample.direction });
    const decrypted = logic.decrypt(sample.cipher, sample.key, { direction: sample.direction });
    for (let done = 0; done <= encrypted.stepCount; done++) {
      const before = logic.encryptionView(encrypted, done);
      logic.encryptionView(encrypted, encrypted.stepCount);
      assert.deepEqual(logic.encryptionView(encrypted, done), before);
      assert.equal(before.placed, done * 9);
      assert.equal(before.finished, done === encrypted.stepCount);
      const read = logic.decryptionView(decrypted, done);
      assert.equal(read.read, done * 9);
      assert.equal(read.finished, done === decrypted.stepCount);
    }
  }
});
