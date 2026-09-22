// UI制御部分

class UIController {
  constructor(cipher) {
    this.cipher = cipher;
    this.state = {
      // 暗号化状態
      encryptionStep: 0,
      encryptionGrid: this.createEmptyGrid(),
      plainChars: [],
      rotationCount: 0,
      encryption: { result: null, done: 0 },
      
      // 復号化状態
      decryptionStep: 0,
      decryptionGrid: this.createEmptyGrid(),
      cipherChars: [],
      recoveredText: '',
      decryption: { result: null, done: 0, reversed: false },
      
      // 共通
      key: GrilleLogic.DEFAULT_KEY,
      direction: 'cw',
      currentGrille: GrilleLogic.keyToGrille(GrilleLogic.DEFAULT_KEY)
    };
  }

  createEmptyGrid() {
    return Array.from({ length: CONFIG.GRILLE_SIZE }, () => Array(CONFIG.GRILLE_SIZE).fill(''));
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
    this.state.encryptionGrid = this.createEmptyGrid();
    this.state.plainChars = [];
    this.state.rotationCount = 0;
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
    this.state.decryptionGrid = this.createEmptyGrid();
    this.state.cipherChars = [];
    this.state.decryptionStep = 0;
    this.state.recoveredText = '';
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

  // グリッドスタイルの設定
  setGridStyles(container) {
    container.style.display = "grid";
    container.style.gridTemplateColumns = `repeat(${CONFIG.GRILLE_SIZE}, ${CONFIG.CELL_SIZE}px)`;
    container.style.gridTemplateRows = `repeat(${CONFIG.GRILLE_SIZE}, ${CONFIG.CELL_SIZE}px)`;
    container.style.gap = `${CONFIG.GRID_GAP}px`;
    container.style.width = "fit-content";
    container.style.margin = "1em auto";
  }

  // 回転アニメーション
  applyRotationAnimation(elementId, callback) {
    const element = this.getElement(elementId);
    element.classList.add(CONFIG.CSS_CLASSES.ROTATE_ANIMATION);
    setTimeout(() => {
      element.classList.remove(CONFIG.CSS_CLASSES.ROTATE_ANIMATION);
      if (callback) callback();
    }, CONFIG.ANIMATION_DURATION);
  }

  // セルの作成
  createCell(r, c, content, classes = []) {
    const cell = document.createElement("div");
    cell.className = CONFIG.CSS_CLASSES.CELL;
    classes.forEach(cls => cell.classList.add(cls));
    cell.id = `cell-${r}-${c}`;
    if (content) cell.textContent = content;
    return cell;
  }

  // グリル生成
  generateGrille() {
    const base = this.getBaseMatrixValues();
    
    // バリデーション
    const errors = ValidationHelper.validateBaseMatrix(base);
    if (errors.length > 0) {
      NotificationSystem.error(errors[0], CONFIG.DOM_IDS.GRILLE_NOTIFICATIONS);
      return null;
    }
    
    try {
      const grille = this.cipher.generateGrille(base);
      this.state.currentGrille = grille;
      this.renderGrillePreview(grille);
      
      // 成功通知
      NotificationSystem.success(ErrorMessages.GRILLE_GENERATION_SUCCESS, CONFIG.DOM_IDS.GRILLE_NOTIFICATIONS);
      
      return grille;
    } catch (error) {
      NotificationSystem.error("グリルの生成中にエラーが発生しました", CONFIG.DOM_IDS.GRILLE_NOTIFICATIONS);
      console.error("Grille generation error:", error);
      return null;
    }
  }

  // ベース行列の値を取得
  getBaseMatrixValues() {
    const inputs = document.querySelectorAll(`#${CONFIG.DOM_IDS.BASE_MATRIX} input`);
    const matrix = Array.from({ length: CONFIG.BASE_SIZE }, () => Array(CONFIG.BASE_SIZE).fill(0));
    
    inputs.forEach(input => {
      const r = parseInt(input.dataset.row);
      const c = parseInt(input.dataset.col);
      matrix[r][c] = parseInt(input.value);
    });
    
    return matrix;
  }

  // グリルプレビューの描画
  renderGrillePreview(grille) {
    const container = this.getElement(CONFIG.DOM_IDS.GRILLE_PREVIEW);
    container.innerHTML = "";
    
    const base = this.getBaseMatrixValues();
    const regions = [
      base,
      this.cipher.rotateMatrix(base, 1),
      this.cipher.rotateMatrix(base, 2),
      this.cipher.rotateMatrix(base, 3)
    ];
    
    const offsets = CONFIG.GRILLE_OFFSETS;
    
    for (let r = 0; r < CONFIG.GRILLE_SIZE; r++) {
      for (let c = 0; c < CONFIG.GRILLE_SIZE; c++) {
        const cell = document.createElement("div");
        cell.className = CONFIG.CSS_CLASSES.CELL;
        
        // 境界線の設定
        if ((r === 0 || r === 3) && (c >= 0 && c <= 5)) cell.style.borderTop = "2px solid #888";
        if ((r === 2 || r === 5) && (c >= 0 && c <= 5)) cell.style.borderBottom = "2px solid #888";
        if ((c === 0 || c === 3) && (r >= 0 && r <= 5)) cell.style.borderLeft = "2px solid #888";
        if ((c === 2 || c === 5) && (r >= 0 && r <= 5)) cell.style.borderRight = "2px solid #888";
        
        // 領域の値を表示
        for (let i = 0; i < CONFIG.ROTATION_COUNT; i++) {
          const [rowOffset, colOffset] = offsets[i];
          if (r >= rowOffset && r < rowOffset + CONFIG.BASE_SIZE && c >= colOffset && c < colOffset + CONFIG.BASE_SIZE) {
            const localR = r - rowOffset;
            const localC = c - colOffset;
            const val = regions[i][localR][localC];
            cell.textContent = val;
            cell.style.opacity = "0.4";
            break;
          }
        }
        
        // グリルの穴を表示
        if (grille[r][c]) {
          cell.classList.add(CONFIG.CSS_CLASSES.CELL_HOLE);
          const mark = document.createElement("div");
          mark.textContent = "○";
          mark.style.position = "absolute";
          mark.style.top = "50%";
          mark.style.left = "50%";
          mark.style.transform = "translate(-50%, -50%)";
          mark.style.zIndex = "2";
          mark.style.fontSize = "1.2em";
          cell.style.position = "relative";
          cell.appendChild(mark);
        }
        
        container.appendChild(cell);
      }
    }
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

  // セルのアニメーション
  animateCell(r, c, gridId) {
    const id = gridId === "encryptionGrid" ? `enc-${r}-${c}` : `dec-${r}-${c}`;
    const cell = this.getElement(id);
    if (!cell) return;
    
    cell.classList.add("highlight-once");
    setTimeout(() => cell.classList.remove("highlight-once"), 400);
  }

  // 回転ラベルの更新
  updateRotationLabel(elementId, rotationCount) {
    this.getElement(elementId).textContent = `回転：${rotationCount * 90}度`;
  }

  // 進捗表示の更新（暗号化）
  updateEncryptionProgress(step, totalChars, usedChars, nextChars = 0) {
    const progressContainer = this.getElement(CONFIG.DOM_IDS.ENCRYPTION_PROGRESS);
    const stepInfo = this.getElement(CONFIG.DOM_IDS.ENCRYPTION_STEP_INFO);
    const charInfo = this.getElement(CONFIG.DOM_IDS.ENCRYPTION_CHAR_INFO);
    const progressBar = this.getElement(CONFIG.DOM_IDS.ENCRYPTION_PROGRESS_BAR);
    const nextInfo = this.getElement(CONFIG.DOM_IDS.ENCRYPTION_NEXT_INFO);
    
    // 進捗コンテナを表示
    progressContainer.style.display = 'block';
    
    // ステップ情報
    stepInfo.textContent = `ステップ ${step + 1}/${CONFIG.ROTATION_COUNT}`;
    
    // 文字情報
    charInfo.textContent = `${usedChars}/${totalChars} 文字埋込済み`;
    
    // 進捗バー
    const percentage = totalChars > 0 ? (usedChars / totalChars) * 100 : 0;
    progressBar.style.width = `${percentage}%`;
    
    // 次の情報
    if (step < CONFIG.ROTATION_COUNT - 1 && nextChars > 0) {
      nextInfo.textContent = `次：${nextChars}文字を埋め込みます`;
    } else if (usedChars >= totalChars) {
      nextInfo.textContent = '暗号化完了';
    } else {
      nextInfo.textContent = '最終ステップ';
    }
  }

  // 進捗表示の更新（復号化）
  updateDecryptionProgress(step, totalRecovered, nextChars = 0) {
    const progressContainer = this.getElement(CONFIG.DOM_IDS.DECRYPTION_PROGRESS);
    const stepInfo = this.getElement(CONFIG.DOM_IDS.DECRYPTION_STEP_INFO);
    const charInfo = this.getElement(CONFIG.DOM_IDS.DECRYPTION_CHAR_INFO);
    const progressBar = this.getElement(CONFIG.DOM_IDS.DECRYPTION_PROGRESS_BAR);
    const nextInfo = this.getElement(CONFIG.DOM_IDS.DECRYPTION_NEXT_INFO);
    
    // 進捗コンテナを表示
    progressContainer.style.display = 'block';
    
    // ステップ情報（復号化は現在実行中のステップを表示）
    const displayStep = step === 0 ? 1 : Math.min(step, CONFIG.ROTATION_COUNT);
    stepInfo.textContent = `ステップ ${displayStep}/${CONFIG.ROTATION_COUNT}`;
    
    // 文字情報
    charInfo.textContent = `${totalRecovered} 文字復号済み`;
    
    // 進捗バー（復号化は完了ステップ数ベース）
    const percentage = (step / CONFIG.ROTATION_COUNT) * 100;
    progressBar.style.width = `${percentage}%`;
    
    // 次の情報
    if (step < CONFIG.ROTATION_COUNT - 1) {
      nextInfo.textContent = `次：${nextChars}文字を読み取ります`;
    } else {
      nextInfo.textContent = '復号化完了';
    }
  }

  // 進捗表示をリセット
  resetProgress(mode = 'encryption') {
    const progressId = mode === 'encryption' 
      ? CONFIG.DOM_IDS.ENCRYPTION_PROGRESS 
      : CONFIG.DOM_IDS.DECRYPTION_PROGRESS;
    
    const progressContainer = this.getElement(progressId);
    if (progressContainer) {
      progressContainer.style.display = 'none';
    }
  }

  // 次のステップで埋まる文字数を計算
  getNextStepCharCount(rotationStep) {
    if (!this.state.currentGrille) return 0;
    const holes = this.cipher.getGrilleHoles(this.state.currentGrille, rotationStep);
    return holes.length;
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
