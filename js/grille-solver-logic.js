// Pure solving helpers for the rotating grille cipher.

const GrilleSolver = ((logic, ngrams) => {
  const ALPHABET_START = 65;
  const CLASS_SIZE = 4;
  const DEFAULT_OPTIONS = Object.freeze({
    lang: 'en',
    directions: Object.freeze(['cw']),
    reverse: false,
    top: 10,
    maxBlocks: 3
  });

  function rotateKey(key) {
    const parsed = logic.parseKey(key);
    if (!parsed.ok) throw new TypeError(parsed.errorKey);
    return Array.from(parsed.key, digit => String((Number(digit) % CLASS_SIZE) + 1)).join('');
  }

  function keyClass(key) {
    const members = [logic.parseKey(key)];
    if (!members[0].ok) throw new TypeError(members[0].errorKey);
    const keys = [members[0].key];
    for (let index = 1; index < CLASS_SIZE; index++) keys.push(rotateKey(keys[index - 1]));
    return keys;
  }

  function canonicalKey(key) {
    return keyClass(key).slice().sort()[0];
  }

  function scoreLetters(letters, lang) {
    const text = String(letters);
    const trigrams = ngrams.trigrams(lang);
    let score = 0;
    for (let index = 0; index + 2 < text.length; index++) {
      const a = text.charCodeAt(index) - ALPHABET_START;
      const b = text.charCodeAt(index + 1) - ALPHABET_START;
      const c = text.charCodeAt(index + 2) - ALPHABET_START;
      score += trigrams[a * 676 + b * 26 + c];
    }
    return score;
  }

  function scorePerLetter(letters, lang) {
    return scoreLetters(letters, lang) / Math.max(1, String(letters).length - 2);
  }

  function workbench(cipherBlock36, key, direction = 'cw') {
    const block = String(cipherBlock36);
    const rows = Array.from({ length: logic.SIZE }, (_, row) =>
      block.slice(row * logic.SIZE, (row + 1) * logic.SIZE)
    );
    return Array.from({ length: CLASS_SIZE }, (_, step) => {
      const holes = logic.holesAt(key, step, direction);
      return {
        step,
        holes,
        letters: holes.map(([row, col]) => rows[row][col]).join('')
      };
    });
  }

  function keyFromIndex(index) {
    let value = Number(index);
    const digits = new Array(logic.HOLES);
    for (let position = logic.HOLES - 1; position >= 0; position--) {
      digits[position] = (value & 3) + 1;
      value >>= 2;
    }
    return digits.join('');
  }

  function buildPositionTable(direction) {
    const cells = Array.from({ length: logic.HOLES }, () =>
      Array.from({ length: CLASS_SIZE }, () => Array(CLASS_SIZE))
    );
    for (let base = 0; base < logic.HOLES; base++) {
      const baseRow = Math.floor(base / logic.HALF);
      const baseCol = base % logic.HALF;
      for (let quadrant = 0; quadrant < CLASS_SIZE; quadrant++) {
        let origin = [baseRow, baseCol];
        for (let turn = 0; turn < quadrant; turn++) origin = logic.rotateCellCw(origin);
        for (let step = 0; step < CLASS_SIZE; step++) {
          let cell = origin;
          const turns = ((direction === 'ccw' ? -step : step) % CLASS_SIZE + CLASS_SIZE) % CLASS_SIZE;
          for (let turn = 0; turn < turns; turn++) cell = logic.rotateCellCw(cell);
          cells[base][quadrant][step] = cell[0] * logic.SIZE + cell[1];
        }
      }
    }
    return cells;
  }

  const POSITION_TABLES = Object.freeze({
    cw: buildPositionTable('cw'),
    ccw: buildPositionTable('ccw')
  });

  function positionsForKey(key, direction) {
    const table = POSITION_TABLES[direction];
    const positions = [];
    for (let step = 0; step < CLASS_SIZE; step++) {
      const turn = [];
      for (let base = 0; base < logic.HOLES; base++) {
        turn.push(table[base][Number(key[base]) - 1][step]);
      }
      turn.sort((a, b) => a - b);
      positions.push(...turn);
    }
    return positions;
  }

  function normalizeOptions(options = {}) {
    const selected = { ...DEFAULT_OPTIONS, ...options };
    ngrams.trigrams(selected.lang);
    if (!Array.isArray(selected.directions) || !selected.directions.length ||
        selected.directions.some(direction => !logic.DIRECTIONS.includes(direction))) {
      throw new TypeError('search.direction');
    }
    selected.top = Math.max(1, Math.trunc(Number(selected.top) || DEFAULT_OPTIONS.top));
    selected.maxBlocks = Math.max(1, Math.trunc(Number(selected.maxBlocks) || DEFAULT_OPTIONS.maxBlocks));
    selected.reverse = Boolean(selected.reverse);
    return selected;
  }

  function prepareCipher(cipherLetters, options = {}) {
    const selected = normalizeOptions(options);
    const checked = logic.decrypt(cipherLetters, logic.DEFAULT_KEY, { direction: 'cw' });
    if (!checked.ok) return { ...checked, options: selected };
    const usedLength = Math.min(checked.letters.length, selected.maxBlocks * logic.BLOCK);
    return {
      ok: true,
      options: selected,
      letters: checked.letters.slice(0, usedLength),
      blocksUsed: usedLength / logic.BLOCK,
      truncated: usedLength < checked.letters.length
    };
  }

  function scoreKey(letters, key, direction, trigrams, reverse) {
    const positions = positionsForKey(key, direction);
    const codes = new Int8Array(letters.length);
    for (let block = 0; block < letters.length / logic.BLOCK; block++) {
      const offset = block * logic.BLOCK;
      for (let index = 0; index < logic.BLOCK; index++) {
        codes[offset + index] = letters.charCodeAt(offset + positions[index]) - ALPHABET_START;
      }
    }
    let forward = 0;
    for (let index = 0; index + 2 < codes.length; index++) {
      forward += trigrams[codes[index] * 676 + codes[index + 1] * 26 + codes[index + 2]];
    }
    if (!reverse) return { score: forward, reversed: false };
    let backward = 0;
    for (let index = codes.length - 1; index - 2 >= 0; index--) {
      backward += trigrams[codes[index] * 676 + codes[index - 1] * 26 + codes[index - 2]];
    }
    return backward > forward ? { score: backward, reversed: true } : { score: forward, reversed: false };
  }

  function searchRange(cipherLetters, options, fromIndex, toIndex, direction) {
    const prepared = prepareCipher(cipherLetters, options);
    if (!prepared.ok) return prepared;
    if (!logic.DIRECTIONS.includes(direction)) throw new TypeError('search.direction');
    const start = Math.max(0, Math.trunc(Number(fromIndex) || 0));
    const end = Math.min(logic.KEY_COUNT, Math.max(start, Math.trunc(Number(toIndex) || 0)));
    const trigrams = ngrams.trigrams(prepared.options.lang);
    const classes = new Map();
    for (let index = start; index < end; index++) {
      const key = keyFromIndex(index);
      const scored = scoreKey(prepared.letters, key, direction, trigrams, prepared.options.reverse);
      const canonical = canonicalKey(key);
      const id = `${canonical}/${direction}`;
      const current = classes.get(id);
      if (!current || scored.score > current.score) {
        classes.set(id, { canonical, bestKey: key, direction, ...scored });
      }
    }
    return {
      ok: true,
      classes: [...classes.values()],
      letters: prepared.letters,
      blocksUsed: prepared.blocksUsed,
      truncated: prepared.truncated,
      processed: end - start
    };
  }

  function mergeSearchRanges(rangeResults, options = {}, elapsedMs = 0, partial = false) {
    const successful = rangeResults.filter(result => result && result.ok);
    const failed = rangeResults.find(result => result && !result.ok);
    if (failed) return failed;
    const selected = normalizeOptions(options);
    const classes = new Map();
    for (const result of successful) {
      for (const candidate of result.classes) {
        const id = `${candidate.canonical}/${candidate.direction}`;
        const current = classes.get(id);
        if (!current || candidate.score > current.score) classes.set(id, candidate);
      }
    }
    const ranked = [...classes.values()].sort((a, b) =>
      b.score - a.score || a.canonical.localeCompare(b.canonical) || a.direction.localeCompare(b.direction)
    );
    const letters = successful[0] ? successful[0].letters : '';
    const top = ranked.slice(0, selected.top).map((candidate, index) => ({
      rank: index + 1,
      ...candidate,
      members: keyClass(candidate.canonical),
      perLetter: candidate.score / Math.max(1, letters.length - 2),
      plain: logic.decrypt(letters, candidate.bestKey, { direction: candidate.direction }).plaintext
    }));
    return {
      ok: true,
      top,
      classCount: ranked.length,
      letters,
      blocksUsed: successful[0] ? successful[0].blocksUsed : 0,
      truncated: successful.some(result => result.truncated),
      elapsedMs,
      partial
    };
  }

  function search(cipherLetters, options = {}) {
    const selected = normalizeOptions(options);
    const started = Date.now();
    const ranges = [];
    for (const direction of selected.directions) {
      ranges.push(searchRange(cipherLetters, selected, 0, logic.KEY_COUNT, direction));
    }
    return mergeSearchRanges(ranges, selected, Date.now() - started, false);
  }

  return Object.freeze({
    rotateKey,
    keyClass,
    canonicalKey,
    scoreLetters,
    scorePerLetter,
    workbench,
    searchRange,
    mergeSearchRanges,
    search
  });
})(
  typeof GrilleLogic !== 'undefined' ? GrilleLogic : require('./grille-cipher-logic.js'),
  typeof GrilleNgrams !== 'undefined' ? GrilleNgrams : require('./ngram-models.js')
);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GrilleSolver;
}
