const test = require('node:test');
const assert = require('node:assert/strict');
const logic = require('../js/grille-cipher-logic.js');
const samples = require('../js/samples.js');
const solver = require('../js/grille-solver-logic.js');

const sample = id => samples.find(item => item.id === id);
const letters = id => logic.normalizeText(sample(id).cipher).letters;

test('rotated keys form the documented equivalence classes', () => {
  assert.deepEqual(solver.keyClass('241143322'), ['241143322', '312214433', '423321144', '134432211']);
  assert.equal(solver.canonicalKey('241143322'), '134432211');
  assert.deepEqual(solver.keyClass('213324231'), ['213324231', '324431342', '431142413', '142213124']);
  assert.equal(solver.canonicalKey('213324231'), '142213124');
  let key = '241143322';
  for (let index = 0; index < 4; index++) key = solver.rotateKey(key);
  assert.equal(key, '241143322');
});

test('trigram totals and normalized scores match the reference output', () => {
  const cases = [
    ['HAPPYHOLIDAYSFROMTHEHUNTINGTONFAMILY', 'en', -11749, -345.6],
    ['TDHOAAPYHPEHUNFYASMFNROHOLTIIINLMGYT', 'en', -18030, -530.3],
    ['ATTACKATDAWNXXXXXXXXXXXXXXXXXXXXXXXX', 'en', -16400, -482.4],
    [sample('sandorf').plain, 'fr', -46781, -441.3],
    [sample('sandorf').plain, 'en', -47207, -445.3],
    [letters('sandorf'), 'fr', -49663, -468.5]
  ];
  for (const [text, lang, total, perLetter] of cases) {
    assert.equal(solver.scoreLetters(text, lang), total);
    assert.equal(Number(solver.scorePerLetter(text, lang).toFixed(1)), perLetter);
  }
});

test('the book and short examples rank their documented key classes first', () => {
  const book = solver.search(letters('book'), { lang: 'en', directions: ['cw'], reverse: false, top: 4 });
  assert.equal(book.classCount, 65536);
  assert.deepEqual(
    book.top.map(item => [item.canonical, item.bestKey, item.direction, item.score, item.plain.slice(0, 36)]),
    [
      ['134432211', '312214433', 'cw', -11694, 'DAYSFROMTHEHUNTINGTONFAMILYHAPPYHOLI'],
      ['132432211', '314214433', 'cw', -12518, 'DAYMFROMTHHEHUNTINTONFASILYAPPYHOLIG'],
      ['131432211', '313214433', 'cw', -12747, 'DAYFROMGTHEHUMNTINTHONFAILYAPPYSHOLI'],
      ['144432311', '144432311', 'cw', -12754, 'TNFAMHOILDHAPPYLIMAYHUSFROTOHENTINGY']
    ]
  );
  const both = solver.search(letters('book'), { lang: 'en', directions: ['cw', 'ccw'], top: 2 });
  assert.equal(both.classCount, 131072);
  assert.deepEqual(both.top.map(item => [item.canonical, item.direction, item.score]), [
    ['134432211', 'cw', -11694], ['134432211', 'ccw', -11814]
  ]);
  const short = solver.search(letters('short'), { lang: 'en', directions: ['cw'], top: 2 });
  assert.deepEqual(short.top.map(item => [item.canonical, item.bestKey, item.score]), [
    ['134432211', '241143322', -16400], ['141143322', '141143322', -16957]
  ]);
});

test('the Sandorf solution ranks first only when reverse scoring is enabled', () => {
  const cipher = letters('sandorf');
  const forward = solver.search(cipher, { lang: 'fr', directions: ['cw'], reverse: false, top: 1906 });
  assert.equal(forward.top[0].canonical, '124421341');
  assert.equal(forward.top[0].score, -42511);
  assert.equal(forward.top[1905].canonical, '142213124');
  const reverse = solver.search(cipher, { lang: 'fr', directions: ['cw'], reverse: true, top: 2 });
  assert.deepEqual(
    [reverse.top[0].canonical, reverse.top[0].bestKey, reverse.top[0].direction,
      reverse.top[0].score, reverse.top[0].reversed, reverse.top[0].plain.slice(0, 36)],
    ['142213124', '213324231', 'cw', -34782, true, 'HAZRXEIRGNOHALEDECNADNEPEDNILRUOPESS']
  );
  const both = solver.search(cipher, { lang: 'fr', directions: ['cw', 'ccw'], reverse: true, top: 2 });
  assert.deepEqual(both.top.map(item => [item.canonical, item.direction, item.score]), [
    ['142213124', 'cw', -34782], ['142213124', 'ccw', -37211]
  ]);
  const english = solver.search(cipher, { lang: 'en', directions: ['cw'], reverse: true, top: 1 });
  assert.deepEqual([english.top[0].canonical, english.top[0].score], ['142213124', -40102]);
  const oneBlock = solver.search(cipher.slice(0, 36), { lang: 'fr', directions: ['cw'], reverse: true, top: 2 });
  assert.deepEqual(oneBlock.top.map(item => [item.canonical, item.score]), [
    ['142213424', -12558], ['142213124', -12595]
  ]);
});

test('counterclockwise ciphertext and meaningless text keep their reference rankings', () => {
  const ccw = logic.encrypt(sample('book').plain, '241143322', { direction: 'ccw' }).ciphertext;
  const result = solver.search(ccw, { lang: 'en', directions: ['cw', 'ccw'], top: 2 });
  assert.deepEqual(result.top.map(item => [item.canonical, item.direction, item.score]), [
    ['134432211', 'ccw', -11694], ['134432211', 'cw', -11814]
  ]);
  const meaningless = 'DKRYFMTAHOVCJQXELSZGNUBIPWDKRYFMTAHO';
  assert.equal(solver.search(meaningless, { lang: 'en', directions: ['cw'], top: 1 }).top[0].score, -18261);
});

test('workbench readings and hole edits match the book example', () => {
  const rows = solver.workbench(letters('book'), '241143322', 'cw');
  assert.deepEqual(rows.map(row => row.letters), ['HAPPYHOLI', 'DAYSFROMT', 'HEHUNTING', 'TONFAMILY']);
  assert.deepEqual(rows[0].holes, [
    [0, 2], [0, 5], [1, 0], [1, 3], [2, 3], [3, 5], [4, 0], [4, 1], [4, 3]
  ]);
  const changed = logic.punch('241143322', 0, 0);
  assert.equal(changed, '141143322');
  assert.equal(solver.workbench(letters('book'), changed, 'cw')[0].letters, 'THPPYHOLI');
  const rotated = solver.rotateKey('241143322');
  assert.equal(rotated, '312214433');
  assert.equal(solver.workbench(letters('book'), rotated, 'cw').map(row => row.letters).join(''),
    'DAYSFROMTHEHUNTINGTONFAMILYHAPPYHOLI');
});

test('the optimized indexer agrees with decrypt for 500 seeded keys in both directions', () => {
  let seed = 246813579;
  const next = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed; };
  const keyIndex = key => Array.from(key).reduce((value, digit) => value * 4 + Number(digit) - 1, 0);
  const cipher = letters('book');
  for (let count = 0; count < 500; count++) {
    const key = logic.keyFromRandom(Array.from({ length: 9 }, next));
    for (const direction of logic.DIRECTIONS) {
      const index = keyIndex(key);
      const range = solver.searchRange(cipher, { lang: 'en', directions: [direction], top: 1 },
        index, index + 1, direction);
      const ranked = solver.mergeSearchRanges([range], { lang: 'en', directions: [direction], top: 1 });
      assert.equal(ranked.top[0].plain, logic.decrypt(cipher, key, { direction }).plaintext);
    }
  }
});

test('search rejects invalid ciphertext and language without mutating input', () => {
  const source = 'A'.repeat(35);
  assert.equal(solver.search(source).errorKey, 'cipher.length');
  assert.equal(solver.search('---').errorKey, 'input.noLetters');
  assert.equal(solver.search('A'.repeat(361)).errorKey, 'input.tooLong');
  assert.throws(() => solver.search('A'.repeat(36), { lang: 'de' }), /language|lang|de/i);
  assert.equal(source, 'A'.repeat(35));
});
