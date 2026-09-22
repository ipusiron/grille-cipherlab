// グリル暗号の純粋なロジック部分

const GrilleLogic = (() => {
  const SIZE = 6;
  const HALF = 3;
  const BLOCK = 36;
  const HOLES = 9;
  const KEY_COUNT = 262144;
  const MAX_BLOCKS = 10;
  const MAX_LETTERS = 360;
  const DEFAULT_KEY = '241143322';
  const DIRECTIONS = Object.freeze(['cw', 'ccw']);

  function rotateCellCw(cell) {
    return [cell[1], SIZE - 1 - cell[0]];
  }

  function rotateCellCcw(cell) {
    return [SIZE - 1 - cell[1], cell[0]];
  }

  function parseKey(text) {
    const compact = String(text).normalize('NFKC').replace(/[\s,-]/g, '');
    const digits = compact.match(/\d/g) || [];
    if (!/^\d{9}$/.test(compact)) {
      return { ok: false, errorKey: 'key.length', params: { length: digits.length } };
    }
    if (!/^[1-4]{9}$/.test(compact)) {
      return { ok: false, errorKey: 'key.range', params: {} };
    }
    return { ok: true, key: compact };
  }

  function keyToBase(key) {
    const parsed = parseKey(key);
    if (!parsed.ok) throw new TypeError(parsed.errorKey);
    return Array.from({ length: HALF }, (_, row) =>
      parsed.key.slice(row * HALF, (row + 1) * HALF).split('').map(Number)
    );
  }

  function baseToKey(base) {
    if (!Array.isArray(base) || base.length !== HALF || base.some(row => !Array.isArray(row) || row.length !== HALF)) {
      throw new TypeError('base.size');
    }
    const parsed = parseKey(base.flat().join(''));
    if (!parsed.ok) throw new TypeError(parsed.errorKey);
    return parsed.key;
  }

  function keyToGrille(key) {
    const base = keyToBase(key);
    const grille = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
    for (let row = 0; row < HALF; row++) {
      for (let col = 0; col < HALF; col++) {
        let cell = [row, col];
        for (let turn = 1; turn < base[row][col]; turn++) cell = rotateCellCw(cell);
        grille[cell[0]][cell[1]] = true;
      }
    }
    return grille;
  }

  function normalizeStep(step) {
    return ((Number(step) % 4) + 4) % 4;
  }

  function holesAt(key, step, direction = 'cw') {
    const grille = keyToGrille(key);
    const turns = normalizeStep(direction === 'ccw' ? -step : step);
    const holes = [];
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        if (!grille[row][col]) continue;
        let cell = [row, col];
        for (let turn = 0; turn < turns; turn++) cell = rotateCellCw(cell);
        holes.push(cell);
      }
    }
    holes.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    return holes;
  }

  function angleAt(step, direction = 'cw') {
    return (direction === 'ccw' ? -90 : 90) * Number(step);
  }

  function cellInfo(row, col) {
    for (let baseRow = 0; baseRow < HALF; baseRow++) {
      for (let baseCol = 0; baseCol < HALF; baseCol++) {
        let cell = [baseRow, baseCol];
        for (let quadrant = 1; quadrant <= 4; quadrant++) {
          if (cell[0] === row && cell[1] === col) return { baseRow, baseCol, quadrant };
          cell = rotateCellCw(cell);
        }
      }
    }
    throw new RangeError('cell.range');
  }

  function orbitOf(row, col) {
    const orbit = [];
    let cell = [row, col];
    for (let turn = 0; turn < 4; turn++) {
      orbit.push(cell);
      cell = rotateCellCw(cell);
    }
    return orbit;
  }

  function punch(key, row, col) {
    const parsed = parseKey(key);
    if (!parsed.ok) throw new TypeError(parsed.errorKey);
    const info = cellInfo(row, col);
    const index = info.baseRow * HALF + info.baseCol;
    return parsed.key.slice(0, index) + info.quadrant + parsed.key.slice(index + 1);
  }

  function keyFromRandom(ints) {
    if (!Array.isArray(ints) && !(ints && typeof ints.length === 'number')) throw new TypeError('random.length');
    if (ints.length !== HOLES) throw new TypeError('random.length');
    return Array.from(ints, value => {
      if (!Number.isInteger(value) || value < 0) throw new TypeError('random.value');
      return String((value % 4) + 1);
    }).join('');
  }

  function formatHolePattern(key) {
    return keyToGrille(key).map(row => row.map(hole => hole ? 'X' : '.').join('')).join('\n');
  }

  function parseHolePattern(text) {
    const rows = String(text).normalize('NFKC').split(/\r\n?|\n/)
      .map(row => row.replace(/[\s\t]/g, ''))
      .filter(Boolean);
    if (rows.length !== SIZE || rows.some(row => Array.from(row).length !== SIZE)) {
      return { ok: false, errorKey: 'pattern.size', params: { rows: rows.length } };
    }
    const holeChars = new Set(['X', 'x', '#', '1']);
    const solidChars = new Set(['.', '-', '_', '0']);
    for (const char of rows.join('')) {
      if (!holeChars.has(char) && !solidChars.has(char)) {
        return { ok: false, errorKey: 'pattern.char', params: { char } };
      }
    }
    const mask = rows.map(row => Array.from(row, char => holeChars.has(char)));
    const problems = [];
    const digits = [];
    for (let baseRow = 0; baseRow < HALF; baseRow++) {
      for (let baseCol = 0; baseCol < HALF; baseCol++) {
        const orbit = orbitOf(baseRow, baseCol);
        const selected = orbit.map((cell, index) => ({ cell, quadrant: index + 1 }))
          .filter(item => mask[item.cell[0]][item.cell[1]]);
        if (selected.length !== 1) {
          problems.push({ baseRow, baseCol, holes: selected.length });
        } else {
          digits.push(String(selected[0].quadrant));
        }
      }
    }
    if (problems.length) {
      return {
        ok: false,
        errorKey: 'pattern.orbit',
        params: { count: problems.length },
        problems
      };
    }
    return { ok: true, key: digits.join('') };
  }

  const EXTRA_LETTERS = Object.freeze({
    '\u00df': 'SS', '\u1e9e': 'SS', '\u0153': 'OE', '\u0152': 'OE',
    '\u00e6': 'AE', '\u00c6': 'AE', '\u00f8': 'O', '\u00d8': 'O',
    '\u0142': 'L', '\u0141': 'L'
  });

  function normalizeText(text) {
    let letters = '';
    let removed = 0;
    for (const original of String(text)) {
      const expanded = EXTRA_LETTERS[original] || original.normalize('NFKC');
      const candidate = expanded.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
      const accepted = candidate.replace(/[^A-Z]/g, '');
      letters += accepted;
      if (!accepted && !/\s/u.test(original) && !/\p{M}/u.test(original)) removed++;
    }
    return { letters, removed };
  }

  function fixedFiller(char) {
    const normalized = String(char).toUpperCase();
    return count => normalized.repeat(count);
  }

  function padLetters(letters, filler) {
    const source = String(letters);
    const padCount = (BLOCK - source.length % BLOCK) % BLOCK;
    const padding = filler(padCount);
    if (typeof padding !== 'string' || padding.length !== padCount || !/^[A-Z]*$/.test(padding)) {
      throw new TypeError('filler.invalid');
    }
    return { padded: source + padding, padCount };
  }

  function rowsOf(text) {
    return Array.from({ length: SIZE }, (_, row) => text.slice(row * SIZE, (row + 1) * SIZE));
  }

  function blocksOf(text) {
    return Array.from({ length: text.length / BLOCK }, (_, index) => text.slice(index * BLOCK, (index + 1) * BLOCK));
  }

  function encrypt(text, key, options = {}) {
    const direction = DIRECTIONS.includes(options.direction) ? options.direction : 'cw';
    const filler = options.filler || fixedFiller('X');
    const normalized = normalizeText(text);
    if (!normalized.letters) {
      return { ok: false, errorKey: 'input.noLetters', params: {}, removed: normalized.removed };
    }
    if (normalized.letters.length > MAX_LETTERS) {
      return {
        ok: false,
        errorKey: 'input.tooLong',
        params: { length: normalized.letters.length, max: MAX_LETTERS },
        removed: normalized.removed
      };
    }
    const padded = padLetters(normalized.letters, filler);
    const blocks = blocksOf(padded.padded).map((plain, index) => {
      const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(''));
      const steps = [];
      for (let step = 0; step < 4; step++) {
        const holes = holesAt(key, step, direction);
        const chunk = plain.slice(step * HOLES, (step + 1) * HOLES);
        holes.forEach((cell, offset) => { grid[cell[0]][cell[1]] = chunk[offset]; });
        steps.push({ step, angle: angleAt(step, direction), holes, letters: chunk });
      }
      const rows = grid.map(row => row.join(''));
      return { index, plain, rows, cipher: rows.join(''), steps };
    });
    return {
      ok: true,
      direction,
      letters: normalized.letters,
      removed: normalized.removed,
      padCount: padded.padCount,
      blocks,
      ciphertext: blocks.map(block => block.cipher).join(''),
      stepCount: blocks.length * 4
    };
  }

  function decrypt(text, key, options = {}) {
    const direction = DIRECTIONS.includes(options.direction) ? options.direction : 'cw';
    const normalized = normalizeText(text);
    if (!normalized.letters) {
      return { ok: false, errorKey: 'input.noLetters', params: {}, removed: normalized.removed };
    }
    if (normalized.letters.length > MAX_LETTERS) {
      return {
        ok: false,
        errorKey: 'input.tooLong',
        params: { length: normalized.letters.length, max: MAX_LETTERS },
        removed: normalized.removed
      };
    }
    if (normalized.letters.length % BLOCK) {
      return {
        ok: false,
        errorKey: 'cipher.length',
        params: { length: normalized.letters.length, missing: BLOCK - normalized.letters.length % BLOCK },
        removed: normalized.removed
      };
    }
    const blocks = blocksOf(normalized.letters).map((cipher, index) => {
      const rows = rowsOf(cipher);
      const steps = [];
      let plain = '';
      for (let step = 0; step < 4; step++) {
        const holes = holesAt(key, step, direction);
        const letters = holes.map(cell => rows[cell[0]][cell[1]]).join('');
        plain += letters;
        steps.push({ step, angle: angleAt(step, direction), holes, letters });
      }
      return { index, cipher, rows, steps, plain };
    });
    return {
      ok: true,
      direction,
      letters: normalized.letters,
      removed: normalized.removed,
      blocks,
      plaintext: blocks.map(block => block.plain).join(''),
      stepCount: blocks.length * 4
    };
  }

  function formatGroups(letters) {
    const groups = String(letters).match(/.{1,6}/g) || [];
    return groups.map((group, index) => index && index % 6 === 0 ? '\n' + group : group).join(' ')
      .replace(/ \n/g, '\n');
  }

  function reverseLetters(letters) {
    return Array.from(String(letters)).reverse().join('');
  }

  function clampDone(done, total) {
    return Math.max(0, Math.min(total, Number.isFinite(Number(done)) ? Math.trunc(Number(done)) : 0));
  }

  function encryptionView(result, done) {
    const safeDone = clampDone(done, result.stepCount);
    const turns = safeDone ? safeDone - 1 : 0;
    const blockIndex = Math.min(Math.floor(turns / 4), result.blocks.length - 1);
    const rotation = turns % 4;
    const block = result.blocks[blockIndex];
    const localDone = safeDone ? rotation + 1 : 0;
    const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill('_'));
    for (let step = 0; step < localDone; step++) {
      block.steps[step].holes.forEach((cell, offset) => {
        grid[cell[0]][cell[1]] = block.steps[step].letters[offset];
      });
    }
    const completeBlocks = Math.floor(safeDone / 4);
    return {
      done: safeDone,
      total: result.stepCount,
      blockIndex,
      blockCount: result.blocks.length,
      rotation,
      turns,
      angle: angleAt(turns, result.direction),
      holes: block.steps[rotation].holes.map(cell => [...cell]),
      paper: grid.map(row => row.join('')),
      fresh: safeDone ? block.steps[rotation].holes.map(cell => [...cell]) : [],
      placed: safeDone * HOLES,
      output: result.blocks.slice(0, completeBlocks).map(item => item.cipher).join(''),
      finished: safeDone === result.stepCount
    };
  }

  function decryptionView(result, done) {
    const safeDone = clampDone(done, result.stepCount);
    const turns = safeDone ? safeDone - 1 : 0;
    const blockIndex = Math.min(Math.floor(turns / 4), result.blocks.length - 1);
    const rotation = turns % 4;
    const block = result.blocks[blockIndex];
    let output = '';
    for (let index = 0; index < safeDone; index++) {
      const source = result.blocks[Math.floor(index / 4)];
      output += source.steps[index % 4].letters;
    }
    return {
      done: safeDone,
      total: result.stepCount,
      blockIndex,
      blockCount: result.blocks.length,
      rotation,
      turns,
      angle: angleAt(turns, result.direction),
      holes: block.steps[rotation].holes.map(cell => [...cell]),
      paper: [...block.rows],
      fresh: safeDone ? block.steps[rotation].holes.map(cell => [...cell]) : [],
      read: safeDone * HOLES,
      output,
      finished: safeDone === result.stepCount
    };
  }

  return Object.freeze({
    SIZE, HALF, BLOCK, HOLES, KEY_COUNT, MAX_BLOCKS, MAX_LETTERS, DEFAULT_KEY, DIRECTIONS,
    rotateCellCw, rotateCellCcw, parseKey, keyToBase, baseToKey, keyToGrille, holesAt, angleAt,
    cellInfo, orbitOf, punch, keyFromRandom, formatHolePattern, parseHolePattern, normalizeText,
    fixedFiller, padLetters, encrypt, decrypt, formatGroups, reverseLetters, encryptionView, decryptionView
  });
})();

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GrilleLogic;
}
