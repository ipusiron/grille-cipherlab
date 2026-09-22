const test = require('node:test');
const assert = require('node:assert/strict');
const logic = require('../js/grille-cipher-logic.js');

const DEFAULT_HOLES = [
  [[0, 2], [0, 5], [1, 0], [1, 3], [2, 3], [3, 5], [4, 0], [4, 1], [4, 3]],
  [[0, 1], [0, 4], [1, 1], [2, 5], [3, 1], [3, 3], [3, 4], [5, 2], [5, 5]],
  [[1, 2], [1, 4], [1, 5], [2, 0], [3, 2], [4, 2], [4, 5], [5, 0], [5, 3]],
  [[0, 0], [0, 3], [2, 1], [2, 2], [2, 4], [3, 0], [4, 4], [5, 1], [5, 4]]
];

test('constants match the 6 by 6 format', () => {
  assert.deepEqual(
    [logic.SIZE, logic.HALF, logic.BLOCK, logic.HOLES, logic.KEY_COUNT, logic.MAX_BLOCKS, logic.MAX_LETTERS],
    [6, 3, 36, 9, 262144, 10, 360]
  );
  assert.equal(logic.DEFAULT_KEY, '241143322');
  assert.deepEqual(logic.DIRECTIONS, ['cw', 'ccw']);
});

test('key parsing accepts documented notation and rejects bad keys', () => {
  for (const input of ['241143322', '241 143 322', '2,4,1,1,4,3,3,2,2', '2-4-1-1-4-3-3-2-2', '２４１１４３３２２']) {
    assert.deepEqual(logic.parseKey(input), { ok: true, key: '241143322' });
  }
  assert.deepEqual(logic.parseKey('24114332'), { ok: false, errorKey: 'key.length', params: { length: 8 } });
  assert.deepEqual(logic.parseKey('2411433225'), { ok: false, errorKey: 'key.length', params: { length: 10 } });
  assert.deepEqual(logic.parseKey('abcdefghi'), { ok: false, errorKey: 'key.length', params: { length: 0 } });
  assert.deepEqual(logic.parseKey('241143325'), { ok: false, errorKey: 'key.range', params: {} });
  assert.deepEqual(logic.parseKey('241143320'), { ok: false, errorKey: 'key.range', params: {} });
});

test('keys, base matrices, rotations, and holes use the documented convention', () => {
  const base = [[2, 4, 1], [1, 4, 3], [3, 2, 2]];
  assert.deepEqual(logic.keyToBase(logic.DEFAULT_KEY), base);
  assert.equal(logic.baseToKey(base), logic.DEFAULT_KEY);
  assert.deepEqual(logic.rotateCellCw([0, 1]), [1, 5]);
  assert.deepEqual(logic.rotateCellCcw([0, 1]), [4, 0]);
  DEFAULT_HOLES.forEach((holes, step) => {
    assert.deepEqual(logic.holesAt(logic.DEFAULT_KEY, step, 'cw'), holes);
    assert.equal(logic.angleAt(step, 'cw'), step * 90);
  });
  assert.deepEqual(logic.holesAt(logic.DEFAULT_KEY, 1, 'ccw'), DEFAULT_HOLES[3]);
  assert.equal(logic.angleAt(3, 'ccw'), -270);
});

test('cell information, orbits, punching, and deterministic random keys match examples', () => {
  assert.deepEqual(logic.orbitOf(0, 1), [[0, 1], [1, 5], [5, 4], [4, 0]]);
  assert.deepEqual(logic.orbitOf(2, 2), [[2, 2], [2, 3], [3, 3], [3, 2]]);
  assert.deepEqual(logic.cellInfo(5, 5), { baseRow: 0, baseCol: 0, quadrant: 3 });
  const cases = [
    [0, 0, '141143322'], [0, 5, '241143322'], [5, 5, '341143322'], [5, 0, '441143322'],
    [2, 3, '241143322'], [3, 3, '241143323'], [0, 2, '241143322'], [3, 2, '241143324']
  ];
  for (const [row, col, expected] of cases) assert.equal(logic.punch(logic.DEFAULT_KEY, row, col), expected);
  assert.equal(logic.keyFromRandom([0, 1, 2, 3, 4, 5, 6, 7, 8]), '123412341');
});

test('hole patterns round-trip and documented invalid patterns report details', () => {
  const standard = '..X..X\nX..X..\n...X..\n.....X\nXX.X..\n......';
  const sandorf = '.X.X.X\n....X.\n..X...\n.X..X.\n.....X\n...X..';
  assert.equal(logic.formatHolePattern(logic.DEFAULT_KEY), standard);
  assert.deepEqual(logic.parseHolePattern(standard), { ok: true, key: logic.DEFAULT_KEY });
  assert.deepEqual(logic.parseHolePattern(sandorf), { ok: true, key: '213324231' });
  assert.deepEqual(logic.parseHolePattern('010101\n000010\n001000\n010010\n000001\n000100'), {
    ok: true,
    key: '213324231'
  });
  assert.deepEqual(logic.parseHolePattern('.X.X.X\n....X.\n..?...\n.X..X.\n.....X\n...X..'), {
    ok: false,
    errorKey: 'pattern.char',
    params: { char: '?' }
  });
  assert.deepEqual(logic.parseHolePattern('.X.X.X\n....X.\n..X...\n.X..X.\n.....X'), {
    ok: false,
    errorKey: 'pattern.size',
    params: { rows: 5 }
  });
  const overlap = logic.parseHolePattern('XX.X.X\n....X.\n..X...\n.X..X.\n.....X\n...X..');
  assert.equal(overlap.errorKey, 'pattern.orbit');
  assert.deepEqual(overlap.problems, [{ baseRow: 0, baseCol: 0, holes: 2 }]);
});

test('normalization handles full-width, accents, ligatures, marks, and removals', () => {
  const cases = [
    ['HAPPY HOLIDAYS FROM THE HUNTINGTON FAMILY', 'HAPPYHOLIDAYSFROMTHEHUNTINGTONFAMILY', 0],
    ["DON'T PANIC!", 'DONTPANIC', 2], ['ＨＥＬＬＯ　ＷＯＲＬＤ', 'HELLOWORLD', 0],
    ['Tout est prêt.', 'TOUTESTPRET', 1], ['lèveront indépendance', 'LEVERONTINDEPENDANCE', 0],
    ['Straße Œuvre Æther', 'STRASSEOEUVREAETHER', 0], ['été', 'ETE', 0], ['abc 123', 'ABC', 3],
    ['こんにちは', '', 5], ['AあB', 'AB', 1], ['   ', '', 0], ['', '', 0], ['a\tb\nc', 'ABC', 0],
    ['😀OK', 'OK', 1]
  ];
  for (const [input, letters, removed] of cases) assert.deepEqual(logic.normalizeText(input), { letters, removed });
});

test('padding validates filler output', () => {
  assert.deepEqual(logic.padLetters('ABC', logic.fixedFiller('X')), { padded: 'ABC' + 'X'.repeat(33), padCount: 33 });
  assert.throws(() => logic.padLetters('ABC', () => 'X'), /filler\.invalid/);
  assert.throws(() => logic.padLetters('ABC', count => 'x'.repeat(count)), /filler\.invalid/);
});

test('encryption and decryption match all documented examples', () => {
  const book = logic.encrypt('HAPPY HOLIDAYS FROM THE HUNTINGTON FAMILY', logic.DEFAULT_KEY, { direction: 'cw' });
  assert.equal(book.ciphertext, 'TDHOAAPYHPEHUNFYASMFNROHOLTIIINLMGYT');
  assert.deepEqual(book.blocks[0].steps.map(step => step.letters), ['HAPPYHOLI', 'DAYSFROMT', 'HEHUNTING', 'TONFAMILY']);
  assert.equal(logic.formatGroups(book.ciphertext), 'TDHOAA PYHPEH UNFYAS MFNROH OLTIII NLMGYT');
  const counter = logic.encrypt('HAPPY HOLIDAYS FROM THE HUNTINGTON FAMILY', logic.DEFAULT_KEY, { direction: 'ccw' });
  assert.equal(counter.ciphertext, 'DTHAOAPNHPEHUYSYFFRANMIHOLTIOINMLGTY');
  assert.equal(logic.decrypt(book.ciphertext, logic.DEFAULT_KEY, { direction: 'ccw' }).plaintext,
    'HAPPYHOLITONFAMILYHEHUNTINGDAYSFROMT');
  const short = logic.encrypt('ATTACK AT DAWN', logic.DEFAULT_KEY);
  assert.equal(short.padCount, 24);
  assert.equal(short.ciphertext, 'XAAXWTTNXAXXXXXCXXXXXXXKATXDXXXXXXXX');
  assert.equal(logic.decrypt(short.ciphertext, logic.DEFAULT_KEY).plaintext, 'ATTACKATDAWN' + 'X'.repeat(24));
  const long = logic.encrypt('HAPPY HOLIDAYS FROM THE HUNTINGTON FAMILY Z', logic.DEFAULT_KEY);
  assert.equal(long.blocks.length, 2);
  assert.equal(long.stepCount, 8);
  assert.equal(logic.reverseLetters('ABC'), 'CBA');
});

test('input length errors are explicit', () => {
  assert.deepEqual(logic.encrypt('', logic.DEFAULT_KEY), {
    ok: false, errorKey: 'input.noLetters', params: {}, removed: 0
  });
  assert.deepEqual(logic.encrypt('A'.repeat(361), logic.DEFAULT_KEY), {
    ok: false, errorKey: 'input.tooLong', params: { length: 361, max: 360 }, removed: 0
  });
  assert.deepEqual(logic.decrypt('A'.repeat(42), logic.DEFAULT_KEY), {
    ok: false, errorKey: 'cipher.length', params: { length: 42, missing: 30 }, removed: 0
  });
});

test('all 262144 keys cover every cell exactly once and have unique patterns', () => {
  const patterns = new Set();
  for (let value = 0; value < logic.KEY_COUNT; value++) {
    let number = value;
    let key = '';
    for (let index = 0; index < 9; index++) {
      key = String(number % 4 + 1) + key;
      number = Math.floor(number / 4);
    }
    const cells = logic.DIRECTIONS.length ? Array.from({ length: 4 }, (_, step) => logic.holesAt(key, step, 'cw')).flat() : [];
    assert.equal(new Set(cells.map(cell => cell.join(','))).size, 36);
    patterns.add(logic.formatHolePattern(key));
  }
  assert.equal(patterns.size, logic.KEY_COUNT);
});

test('punching every cell produces a valid key with that hole', () => {
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      const key = logic.punch(logic.DEFAULT_KEY, row, col);
      assert.equal(logic.holesAt(key, 0, 'cw').some(cell => cell[0] === row && cell[1] === col), true);
      assert.deepEqual(logic.parseHolePattern(logic.formatHolePattern(key)), { ok: true, key });
    }
  }
});

test('seeded round trips preserve every letter count in both directions', () => {
  let seed = 123456789;
  const next = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed; };
  for (let sample = 0; sample < 400; sample++) {
    const key = logic.keyFromRandom(Array.from({ length: 9 }, next));
    const length = next() % 120 + 1;
    const source = Array.from({ length }, () => String.fromCharCode(65 + next() % 26)).join('');
    for (const direction of logic.DIRECTIONS) {
      const encrypted = logic.encrypt(source, key, { direction });
      const decrypted = logic.decrypt(encrypted.ciphertext, key, { direction });
      assert.equal(decrypted.plaintext, source + 'X'.repeat(encrypted.padCount));
      assert.equal(encrypted.ciphertext.split('').sort().join(''), decrypted.plaintext.split('').sort().join(''));
    }
  }
});
