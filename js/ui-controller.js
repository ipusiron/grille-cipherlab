// UI制御部分

class UIController {
  constructor() {
    this.state = {
      encryption: { result: null, done: 0 },
      decryption: { result: null, done: 0, reversed: false },
      solve: {
        blocks: [],
        blockIndex: 0,
        searchToken: 0,
        searching: false,
        ranges: [],
        options: null,
        startedAt: 0,
        processed: 0,
        total: 0
      },
      key: GrilleLogic.DEFAULT_KEY,
      direction: 'cw',
      currentGrille: GrilleLogic.keyToGrille(GrilleLogic.DEFAULT_KEY)
    };
  }

  createEmptyGrid() {
    return Array.from({ length: GrilleLogic.SIZE }, () => Array(GrilleLogic.SIZE).fill(''));
  }

  // DOM要素の取得（キャッシュ）
  getElement(id) {
    return document.getElementById(id);
  }

  // グリル作成画面を初期化
  initGrilleCreator() {
    const matrix = this.getElement('baseMatrix');
    matrix.replaceChildren();
    for (let row = 0; row < GrilleLogic.HALF; row++) {
      for (let col = 0; col < GrilleLogic.HALF; col++) {
        const select = document.createElement('select');
        select.dataset.row = row;
        select.dataset.col = col;
        select.setAttribute('aria-label', GrilleMessages.t('matrix.label', { row: row + 1, col: col + 1 }));
        for (let value = 1; value <= 4; value++) {
          const option = document.createElement('option');
          option.value = String(value);
          option.textContent = String(value);
          select.appendChild(option);
        }
        matrix.appendChild(select);
      }
    }

    const board = this.getElement('punchBoard');
    board.replaceChildren();
    for (let row = 0; row < GrilleLogic.SIZE; row++) {
      for (let col = 0; col < GrilleLogic.SIZE; col++) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.row = row;
        button.dataset.col = col;
        button.addEventListener('pointerenter', () => this.highlightOrbit(row, col, true));
        button.addEventListener('pointerleave', () => this.highlightOrbit(row, col, false));
        button.addEventListener('focus', () => this.highlightOrbit(row, col, true));
        button.addEventListener('blur', () => this.highlightOrbit(row, col, false));
        button.addEventListener('click', () => this.setKey(GrilleLogic.punch(this.state.key, row, col)));
        board.appendChild(button);
      }
    }

    const samples = this.getElement('sampleSelect');
    samples.replaceChildren();
    GrilleSamples.forEach(sample => {
      const option = document.createElement('option');
      option.value = sample.id;
      option.textContent = GrilleMessages.t(sample.nameKey);
      samples.appendChild(option);
    });
    this.renderGrilleCreator();
  }

  // 4つの鍵表示を同じ状態から描画
  renderGrilleCreator() {
    const base = GrilleLogic.keyToBase(this.state.key);
    document.querySelectorAll('#baseMatrix select').forEach(select => {
      select.value = String(base[Number(select.dataset.row)][Number(select.dataset.col)]);
    });
    const holes = new Set(GrilleLogic.holesAt(this.state.key, 0, this.state.direction).map(cell => cell.join(',')));
    document.querySelectorAll('#punchBoard button').forEach(button => {
      const row = Number(button.dataset.row);
      const col = Number(button.dataset.col);
      const hole = holes.has(`${row},${col}`);
      const info = GrilleLogic.cellInfo(row, col);
      button.textContent = String(base[info.baseRow][info.baseCol]);
      button.setAttribute('aria-pressed', String(hole));
      button.setAttribute('aria-label', GrilleMessages.t(hole ? 'punch.hole' : 'punch.label', {
        row: row + 1,
        col: col + 1
      }));
      button.classList.toggle('is-hole', hole);
    });
    const keyInput = this.getElement('keyText');
    if (document.activeElement !== keyInput) keyInput.value = this.state.key;
    this.getElement('patternText').value = GrilleLogic.formatHolePattern(this.state.key);
    this.getElement('directionCw').checked = this.state.direction === 'cw';
    this.getElement('directionCcw').checked = this.state.direction === 'ccw';
  }

  highlightOrbit(row, col, active) {
    const orbit = new Set(GrilleLogic.orbitOf(row, col).map(cell => cell.join(',')));
    document.querySelectorAll('#punchBoard button').forEach(button => {
      button.classList.toggle('is-orbit', active && orbit.has(`${button.dataset.row},${button.dataset.col}`));
    });
  }

  highlightSolveOrbit(row, col, active) {
    const orbit = new Set(GrilleLogic.orbitOf(row, col).map(cell => cell.join(',')));
    document.querySelectorAll('#solveBoard button').forEach(button => {
      button.classList.toggle('is-orbit', active && orbit.has(`${button.dataset.row},${button.dataset.col}`));
    });
  }

  clearEncryption(showMessage = false) {
    const wasRunning = this.state.encryption.result !== null;
    this.state.encryption = { result: null, done: 0 };
    const legacyEncryptionGrid = this.getElement('encryptionGrid');
    if (legacyEncryptionGrid) legacyEncryptionGrid.replaceChildren();
    this.getElement('cipherText').value = '';
    this.updateFrequencyLink('encryptFrequencyLink', '');
    this.getElement('nextRotation').disabled = true;
    const encryptionBoard = this.getElement('encryptionBoard');
    if (encryptionBoard) {
      encryptionBoard.hidden = true;
      encryptionBoard.replaceChildren();
    }
    const status = this.getElement('encryptionStatus');
    if (status) status.textContent = '';
    for (const id of ['encFirst', 'encPrev', 'encLast', 'copyCipher']) {
      const button = this.getElement(id);
      if (button) button.disabled = true;
    }
    this.getElement('encryptionProgressBar').style.width = '0%';
    if (wasRunning && showMessage) {
      NotificationSystem.info(GrilleMessages.t('run.cleared'), 'encrypt-notifications', 0);
    }
    return wasRunning;
  }

  clearRuns(showMessage = false) {
    const wasRunning = this.clearEncryption(showMessage);
    this.clearDecryption(showMessage);
    return wasRunning;
  }

  clearDecryption(showMessage = false) {
    const wasRunning = this.state.decryption.result !== null;
    this.state.decryption = { result: null, done: 0, reversed: false };
    const legacyGrid = this.getElement('decryptionGrid');
    if (legacyGrid) legacyGrid.replaceChildren();
    this.getElement('recoveredText').value = '';
    this.getElement('nextDecryption').disabled = true;
    const board = this.getElement('decryptionBoard');
    if (board) {
      board.hidden = true;
      board.replaceChildren();
    }
    const status = this.getElement('decryptionStatus');
    if (status) status.textContent = '';
    for (const id of ['decFirst', 'decPrev', 'decLast', 'reverseOutput', 'copyRecovered']) {
      const button = this.getElement(id);
      if (button) button.disabled = true;
    }
    const reverseButton = this.getElement('reverseOutput');
    if (reverseButton) reverseButton.setAttribute('aria-pressed', 'false');
    const progress = this.getElement('decryptionProgressBar');
    if (progress) progress.style.width = '0%';
    if (wasRunning && showMessage) {
      NotificationSystem.info(GrilleMessages.t('run.cleared'), 'decrypt-notifications', 0);
    }
    return wasRunning;
  }

  setKey(key) {
    const parsed = GrilleLogic.parseKey(key);
    if (!parsed.ok) return false;
    const changed = parsed.key !== this.state.key;
    this.state.key = parsed.key;
    this.state.currentGrille = GrilleLogic.keyToGrille(parsed.key);
    if (changed) this.clearRuns(true);
    this.renderGrilleCreator();
    this.renderSolve();
    if (typeof syncShareHash === 'function') syncShareHash();
    return true;
  }

  setDirection(direction) {
    const next = direction === 'ccw' ? 'ccw' : 'cw';
    if (next !== this.state.direction) this.clearRuns(true);
    this.state.direction = next;
    this.renderGrilleCreator();
    this.renderSolve();
    if (typeof syncShareHash === 'function') syncShareHash();
  }

  showGrilleMessage(message, type = 'info') {
    NotificationSystem.show(message, type, 'grille-notifications', 0);
  }

  // 暗号化の開始
  startEncryption(filler) {
    const result = GrilleLogic.encrypt(this.getElement('plainText').value, this.state.key, {
      direction: this.state.direction,
      filler
    });
    NotificationSystem.clear('encrypt-notifications');
    if (!result.ok) {
      NotificationSystem.error(GrilleMessages.t(result.errorKey, result.params), 'encrypt-notifications', 0);
      return false;
    }
    this.state.encryption = { result, done: 0 };
    const notices = [];
    if (result.removed) notices.push(GrilleMessages.t('input.removed', { count: result.removed }));
    if (result.padCount) notices.push(GrilleMessages.t('encrypt.padded', { count: result.padCount }));
    if (notices.length) {
      NotificationSystem.info(notices.join(GrilleMessages.t('message.separator')), 'encrypt-notifications', 0);
    }
    this.renderEncryption();
    return true;
  }

  setEncryptionDone(done) {
    const result = this.state.encryption.result;
    if (!result) return;
    this.state.encryption.done = Math.max(0, Math.min(result.stepCount, done));
    this.renderEncryption();
  }

  nextRotationStep() {
    this.setEncryptionDone(this.state.encryption.done + 1);
  }

  renderBoard(containerId, view, mode) {
    const container = this.getElement(containerId);
    const board = document.createElement('div');
    board.className = 'board';
    board.setAttribute('role', 'img');

    const paper = document.createElement('div');
    paper.className = 'paper';
    const fresh = new Set(view.fresh.map(cell => cell.join(',')));
    view.paper.forEach((row, rowIndex) => {
      Array.from(row).forEach((char, colIndex) => {
        const cell = document.createElement('div');
        cell.className = 'paper-cell';
        cell.classList.toggle('is-fresh', fresh.has(`${rowIndex},${colIndex}`));
        cell.textContent = char === '_' ? '' : char;
        paper.appendChild(cell);
      });
    });

    const card = document.createElement('div');
    card.className = 'card';
    card.style.transform = `rotate(${view.angle}deg)`;
    card.hidden = this.getElement(mode === 'encrypt' ? 'encHideCard' : 'decHideCard').checked;
    const mark = document.createElement('span');
    mark.className = 'card-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = '▲';
    card.appendChild(mark);
    const cardGrid = document.createElement('div');
    cardGrid.className = 'card-grid';
    const baseHoles = new Set(GrilleLogic.holesAt(this.state.key, 0, this.state.direction).map(cell => cell.join(',')));
    for (let row = 0; row < GrilleLogic.SIZE; row++) {
      for (let col = 0; col < GrilleLogic.SIZE; col++) {
        const cell = document.createElement('div');
        cell.className = 'card-cell';
        cell.classList.toggle('is-hole', baseHoles.has(`${row},${col}`));
        cardGrid.appendChild(cell);
      }
    }
    card.appendChild(cardGrid);
    board.append(paper, card);
    container.replaceChildren(board);
    container.hidden = false;

    const letters = view.fresh.map(([row, col]) => view.paper[row][col]).join(' ');
    const key = view.done ? `${mode}.board` : `${mode}.board.start`;
    const params = view.done ? {
      block: view.blockIndex + 1,
      blocks: view.blockCount,
      turn: view.rotation + 1,
      angle: view.angle,
      letters
    } : { blocks: view.blockCount };
    board.setAttribute('aria-label', GrilleMessages.t(key, params));
  }

  renderEncryption() {
    const { result, done } = this.state.encryption;
    if (!result) return;
    const view = GrilleLogic.encryptionView(result, done);
    this.renderBoard('encryptionBoard', view, 'encrypt');
    const totalLetters = result.blocks.length * GrilleLogic.BLOCK;
    let statusKey = 'encrypt.status';
    let params = {
      block: view.blockIndex + 1,
      blocks: view.blockCount,
      turn: view.rotation + 1,
      angle: view.angle,
      placed: view.placed,
      total: totalLetters
    };
    if (!view.done) {
      statusKey = 'encrypt.status.start';
      params = { blocks: view.blockCount, total: totalLetters };
    } else if (view.finished) {
      statusKey = 'encrypt.status.done';
    }
    this.getElement('encryptionStatus').textContent = GrilleMessages.t(statusKey, params);
    this.getElement('encryptionProgressBar').style.width = `${view.total ? view.done / view.total * 100 : 0}%`;
    const formatted = GrilleLogic.formatGroups(view.output);
    this.getElement('cipherText').value = formatted;
    this.updateFrequencyLink('encryptFrequencyLink', formatted);
    this.getElement('encFirst').disabled = view.done === 0;
    this.getElement('encPrev').disabled = view.done === 0;
    this.getElement('nextRotation').disabled = view.finished;
    this.getElement('encLast').disabled = view.finished;
    this.getElement('copyCipher').disabled = !view.finished;
  }

  // 復号の開始
  startDecryption() {
    const result = GrilleLogic.decrypt(this.getElement('cipherInput').value, this.state.key, {
      direction: this.state.direction
    });
    NotificationSystem.clear('decrypt-notifications');
    if (!result.ok) {
      NotificationSystem.error(GrilleMessages.t(result.errorKey, result.params), 'decrypt-notifications', 0);
      return false;
    }
    this.state.decryption = { result, done: 0, reversed: false };
    if (result.removed) {
      NotificationSystem.info(GrilleMessages.t('input.removed', { count: result.removed }), 'decrypt-notifications', 0);
    }
    this.renderDecryption();
    return true;
  }

  setDecryptionDone(done) {
    const result = this.state.decryption.result;
    if (!result) return;
    this.state.decryption.done = Math.max(0, Math.min(result.stepCount, done));
    this.renderDecryption();
  }

  // 次の復号ステップ
  nextDecryptionStep() {
    this.setDecryptionDone(this.state.decryption.done + 1);
  }

  toggleDecryptionReverse() {
    if (!this.state.decryption.result) return;
    this.state.decryption.reversed = !this.state.decryption.reversed;
    this.renderDecryption();
  }

  renderDecryption() {
    const { result, done, reversed } = this.state.decryption;
    if (!result) return;
    const view = GrilleLogic.decryptionView(result, done);
    this.renderBoard('decryptionBoard', view, 'decrypt');
    const totalLetters = result.blocks.length * GrilleLogic.BLOCK;
    let statusKey = 'decrypt.status';
    let params = {
      block: view.blockIndex + 1,
      blocks: view.blockCount,
      turn: view.rotation + 1,
      angle: view.angle,
      read: view.read,
      total: totalLetters
    };
    if (!view.done) {
      statusKey = 'decrypt.status.start';
      params = { blocks: view.blockCount, total: totalLetters };
    } else if (view.finished) {
      statusKey = 'decrypt.status.done';
    }
    this.getElement('decryptionStatus').textContent = GrilleMessages.t(statusKey, params);
    this.getElement('decryptionProgressBar').style.width = `${view.total ? view.done / view.total * 100 : 0}%`;
    this.getElement('recoveredText').value = reversed ? GrilleLogic.reverseLetters(view.output) : view.output;
    this.getElement('decFirst').disabled = view.done === 0;
    this.getElement('decPrev').disabled = view.done === 0;
    this.getElement('nextDecryption').disabled = view.finished;
    this.getElement('decLast').disabled = view.finished;
    this.getElement('reverseOutput').disabled = !view.output;
    this.getElement('reverseOutput').setAttribute('aria-pressed', String(reversed));
    this.getElement('copyRecovered').disabled = !view.finished;
  }

  clearSolveSearch() {
    this.state.solve.searchToken++;
    this.state.solve.searching = false;
    this.state.solve.ranges = [];
    this.state.solve.options = null;
    this.state.solve.processed = 0;
    this.state.solve.total = 0;
    this.getElement('solveSearch').disabled = false;
    this.getElement('solveCancel').disabled = true;
    this.getElement('solveProgress').value = 0;
    this.getElement('solveStatus').textContent = '';
    this.getElement('solveResults').replaceChildren();
  }

  loadSolve() {
    const checked = GrilleLogic.decrypt(this.getElement('solveCipher').value, this.state.key, {
      direction: this.state.direction
    });
    NotificationSystem.clear('solve-notifications');
    if (!checked.ok) {
      NotificationSystem.error(GrilleMessages.t(checked.errorKey, checked.params), 'solve-notifications', 0);
      return false;
    }
    this.state.solve.blocks = checked.blocks.map(block => block.cipher);
    this.state.solve.blockIndex = 0;
    const select = this.getElement('solveBlock');
    select.replaceChildren();
    checked.blocks.forEach((_block, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = GrilleMessages.t('solve.block', { block: index + 1, blocks: checked.blocks.length });
      select.appendChild(option);
    });
    select.disabled = checked.blocks.length < 2;
    NotificationSystem.success(GrilleMessages.t('solve.loaded', { blocks: checked.blocks.length }),
      'solve-notifications', 0);
    this.renderSolve();
    this.updateFrequencyLink('solveFrequencyLink', GrilleLogic.formatGroups(checked.letters));
    return true;
  }

  updateFrequencyLink(id, text) {
    const link = this.getElement(id);
    if (!link) return;
    const value = String(text || '');
    link.hidden = !value;
    link.href = value
      // 「#」より後ろで渡す（サーバーへ送られず、URLの長さの上限もない。Day009は#text=を先に読む）
      ? `https://ipusiron.github.io/frequency-analyzer/#text=${encodeURIComponent(value)}`
      : 'https://ipusiron.github.io/frequency-analyzer/';
  }

  renderPrintSheet() {
    const stencil = this.getElement('printStencil');
    const paper = this.getElement('printPaper');
    stencil.replaceChildren();
    paper.replaceChildren();
    const holes = new Set(GrilleLogic.holesAt(this.state.key, 0, this.state.direction)
      .map(cell => cell.join(',')));
    for (let row = 0; row < GrilleLogic.SIZE; row++) {
      for (let col = 0; col < GrilleLogic.SIZE; col++) {
        const stencilCell = document.createElement('div');
        stencilCell.className = 'print-cell';
        if (holes.has(`${row},${col}`)) stencilCell.classList.add('is-hole');
        stencil.appendChild(stencilCell);
        const paperCell = document.createElement('div');
        paperCell.className = 'print-cell';
        paperCell.textContent = `${row + 1},${col + 1}`;
        paper.appendChild(paperCell);
      }
    }
  }

  renderSolve() {
    const block = this.state.solve.blocks[this.state.solve.blockIndex];
    const board = this.getElement('solveBoard');
    const readout = this.getElement('solveReadout');
    if (!board || !readout) return;
    if (!block) {
      board.replaceChildren();
      readout.replaceChildren();
      return;
    }
    const holes = new Set(GrilleLogic.holesAt(this.state.key, 0, this.state.direction)
      .map(cell => cell.join(',')));
    board.replaceChildren();
    Array.from(block).forEach((char, index) => {
      const row = Math.floor(index / GrilleLogic.SIZE);
      const col = index % GrilleLogic.SIZE;
      const button = document.createElement('button');
      const hole = holes.has(`${row},${col}`);
      button.type = 'button';
      button.dataset.row = String(row);
      button.dataset.col = String(col);
      button.textContent = char;
      button.classList.toggle('is-hole', hole);
      button.setAttribute('aria-pressed', String(hole));
      button.setAttribute('aria-label', GrilleMessages.t(hole ? 'solve.cell.hole' : 'solve.cell', {
        row: row + 1,
        col: col + 1,
        char
      }));
      button.addEventListener('pointerenter', () => this.highlightSolveOrbit(row, col, true));
      button.addEventListener('pointerleave', () => this.highlightSolveOrbit(row, col, false));
      button.addEventListener('focus', () => this.highlightSolveOrbit(row, col, true));
      button.addEventListener('blur', () => this.highlightSolveOrbit(row, col, false));
      button.addEventListener('click', () => this.setKey(GrilleLogic.punch(this.state.key, row, col)));
      board.appendChild(button);
    });
    const turns = GrilleSolver.workbench(block, this.state.key, this.state.direction);
    let combined = turns.map(turn => turn.letters).join('');
    if (this.getElement('solveReverse').checked) combined = GrilleLogic.reverseLetters(combined);
    const fragment = document.createDocumentFragment();
    turns.forEach(turn => {
      const line = document.createElement('p');
      line.textContent = GrilleMessages.t('solve.turn', {
        turn: turn.step + 1,
        letters: Array.from(turn.letters).join(' ')
      });
      fragment.appendChild(line);
    });
    const output = document.createElement('p');
    output.className = 'solve-combined';
    output.textContent = GrilleMessages.t('solve.combined', { letters: combined });
    fragment.appendChild(output);
    const lang = this.getElement('solveLang').value;
    const score = document.createElement('p');
    score.textContent = GrilleMessages.t('solve.score', {
      score: GrilleSolver.scoreLetters(combined, lang),
      perLetter: GrilleSolver.scorePerLetter(combined, lang).toFixed(1)
    });
    fragment.appendChild(score);
    readout.replaceChildren(fragment);
  }

  rotateSolveKey() {
    this.setKey(GrilleSolver.rotateKey(this.state.key));
    NotificationSystem.info(GrilleMessages.t('solve.rotated', { key: this.state.key }), 'solve-notifications', 0);
  }

  solveOptions() {
    const directions = this.getElement('solveDirections').value;
    return {
      lang: this.getElement('solveLang').value,
      directions: directions === 'both' ? ['cw', 'ccw'] : [directions],
      reverse: this.getElement('solveReverseScore').checked,
      top: 10,
      maxBlocks: 3
    };
  }

  startSolveSearch() {
    const options = this.solveOptions();
    const probe = GrilleSolver.searchRange(this.getElement('solveCipher').value, options, 0, 0,
      options.directions[0]);
    NotificationSystem.clear('solve-notifications');
    if (!probe.ok) {
      NotificationSystem.error(GrilleMessages.t(probe.errorKey, probe.params), 'solve-notifications', 0);
      return false;
    }
    this.clearSolveSearch();
    const solve = this.state.solve;
    solve.searching = true;
    solve.options = options;
    solve.startedAt = performance.now();
    solve.total = GrilleLogic.KEY_COUNT * options.directions.length;
    const token = solve.searchToken;
    this.getElement('solveSearch').disabled = true;
    this.getElement('solveCancel').disabled = false;
    this.getElement('solveProgress').max = solve.total;
    const queue = options.directions.flatMap(direction =>
      Array.from({ length: GrilleLogic.KEY_COUNT / 4096 }, (_value, slice) => ({
        direction,
        from: slice * 4096,
        to: (slice + 1) * 4096
      }))
    );
    const runSlice = () => {
      if (!solve.searching || solve.searchToken !== token) return;
      const next = queue.shift();
      if (!next) return this.finishSolveSearch(false);
      solve.ranges.push(GrilleSolver.searchRange(this.getElement('solveCipher').value, options,
        next.from, next.to, next.direction));
      solve.processed += next.to - next.from;
      this.renderSolveProgress();
      setTimeout(runSlice, 0);
    };
    setTimeout(runSlice, 0);
    return true;
  }

  renderSolveProgress() {
    const solve = this.state.solve;
    const seconds = (performance.now() - solve.startedAt) / 1000;
    this.getElement('solveProgress').value = solve.processed;
    this.getElement('solveStatus').textContent = GrilleMessages.t('solve.search.progress', {
      done: solve.processed.toLocaleString(),
      total: solve.total.toLocaleString(),
      seconds: seconds.toFixed(1)
    });
  }

  finishSolveSearch(partial) {
    const solve = this.state.solve;
    if (!solve.options) return;
    solve.searching = false;
    const elapsedMs = performance.now() - solve.startedAt;
    const result = GrilleSolver.mergeSearchRanges(solve.ranges, solve.options, elapsedMs, partial);
    this.getElement('solveSearch').disabled = false;
    this.getElement('solveCancel').disabled = true;
    this.renderSolveResults(result);
    const key = partial ? 'solve.search.partial' : 'solve.search.done';
    const params = partial ? {} : { classes: result.classCount.toLocaleString(), seconds: (elapsedMs / 1000).toFixed(1) };
    this.getElement('solveStatus').textContent = GrilleMessages.t(key, params);
    if (result.truncated) {
      NotificationSystem.info(GrilleMessages.t('solve.search.truncated'), 'solve-notifications', 0);
    }
  }

  cancelSolveSearch() {
    if (!this.state.solve.searching) return;
    this.state.solve.searchToken++;
    this.finishSolveSearch(true);
  }

  renderSolveResults(result) {
    const container = this.getElement('solveResults');
    container.replaceChildren();
    if (!result.ok || !result.top.length) return;
    const table = document.createElement('table');
    const caption = document.createElement('caption');
    caption.textContent = GrilleMessages.t('solve.results.caption');
    table.appendChild(caption);
    const head = document.createElement('thead');
    const headRow = document.createElement('tr');
    for (const key of ['rank', 'canonical', 'direction', 'score', 'reverse', 'plain', 'action']) {
      const cell = document.createElement('th');
      cell.scope = 'col';
      cell.textContent = GrilleMessages.t(`solve.results.${key}`);
      headRow.appendChild(cell);
    }
    head.appendChild(headRow);
    table.appendChild(head);
    const body = document.createElement('tbody');
    result.top.forEach(item => {
      const row = document.createElement('tr');
      const shownPlain = item.reversed ? GrilleLogic.reverseLetters(item.plain) : item.plain;
      const values = [
        item.rank,
        `${item.canonical} / ${item.bestKey}`,
        GrilleMessages.t(`solve.direction.${item.direction}`),
        `${item.score} / ${item.perLetter.toFixed(1)}`,
        GrilleMessages.t(item.reversed ? 'solve.results.reversed' : 'solve.results.forward'),
        shownPlain.slice(0, 36)
      ];
      values.forEach(value => {
        const cell = document.createElement('td');
        cell.textContent = String(value);
        row.appendChild(cell);
      });
      const action = document.createElement('td');
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = item.canonical;
      const members = document.createElement('p');
      members.textContent = GrilleMessages.t('solve.results.members', { members: item.members.join(' ') });
      const best = document.createElement('p');
      best.textContent = GrilleMessages.t('solve.results.best', { key: item.bestKey });
      details.append(summary, members, best);
      const use = document.createElement('button');
      use.type = 'button';
      use.textContent = GrilleMessages.t('solve.results.use');
      use.addEventListener('click', () => this.useSolveResult(item, false));
      const inspect = document.createElement('button');
      inspect.type = 'button';
      inspect.textContent = GrilleMessages.t('solve.results.workbench');
      inspect.addEventListener('click', () => this.useSolveResult(item, true));
      action.append(details, use, inspect);
      row.appendChild(action);
      body.appendChild(row);
    });
    table.appendChild(body);
    const wrap = document.createElement('div');
    wrap.className = 'table-wrap';
    wrap.appendChild(table);
    const difference = document.createElement('p');
    difference.textContent = GrilleMessages.t('solve.results.difference', {
      difference: result.top.length > 1 ? result.top[0].score - result.top[1].score : 0
    });
    container.append(difference, wrap);
  }

  useSolveResult(item, workbench) {
    this.setKey(item.bestKey);
    this.setDirection(item.direction);
    if (workbench) {
      this.loadSolve();
      return;
    }
    this.getElement('cipherInput').value = this.getElement('solveCipher').value;
    this.startDecryption();
    this.state.decryption.reversed = item.reversed;
    this.setDecryptionDone(this.state.decryption.result.stepCount);
    const tab = document.querySelector('[role="tab"][data-target="decrypt"]');
    if (typeof activateTab === 'function') activateTab(tab);
  }

  // 初期化関数
  initEncryptionMode() {
    this.clearEncryption(false);
    this.getElement(CONFIG.DOM_IDS.START_ENCRYPTION).disabled = false;
  }

  initDecryptionMode() {
    this.clearDecryption(false);
    this.getElement(CONFIG.DOM_IDS.CIPHER_INPUT).value = '';
    this.getElement(CONFIG.DOM_IDS.START_DECRYPTION).disabled = false;
  }

  initSolveMode() {
    this.clearSolveSearch();
    this.state.solve.blocks = [];
    this.state.solve.blockIndex = 0;
    this.getElement('solveBlock').replaceChildren();
    this.getElement('solveBoard').replaceChildren();
    this.getElement('solveReadout').replaceChildren();
    this.updateFrequencyLink('solveFrequencyLink', '');
  }
}
