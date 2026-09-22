// UI制御部分

class UIController {
  constructor() {
    this.state = {
      encryption: { result: null, done: 0 },
      decryption: { result: null, done: 0, reversed: false },
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

  clearEncryption(showMessage = false) {
    const wasRunning = this.state.encryption.result !== null;
    this.state.encryption = { result: null, done: 0 };
    const legacyEncryptionGrid = this.getElement('encryptionGrid');
    if (legacyEncryptionGrid) legacyEncryptionGrid.replaceChildren();
    this.getElement('cipherText').value = '';
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
    return true;
  }

  setDirection(direction) {
    const next = direction === 'ccw' ? 'ccw' : 'cw';
    if (next !== this.state.direction) this.clearRuns(true);
    this.state.direction = next;
    this.renderGrilleCreator();
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
    if (notices.length) NotificationSystem.info(notices.join('／'), 'encrypt-notifications', 0);
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
    this.getElement('cipherText').value = GrilleLogic.formatGroups(view.output);
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
}
