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
      
      // 復号化状態
      decryptionStep: 0,
      decryptionGrid: this.createEmptyGrid(),
      cipherChars: [],
      recoveredText: '',
      
      // 共通
      currentGrille: null
    };
  }

  createEmptyGrid() {
    return Array.from({ length: CONFIG.GRILLE_SIZE }, () => Array(CONFIG.GRILLE_SIZE).fill(''));
  }

  // DOM要素の取得（キャッシュ）
  getElement(id) {
    return document.getElementById(id);
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
  startEncryption() {
    const inputField = this.getElement(CONFIG.DOM_IDS.PLAIN_TEXT);
    
    // 入力検証
    const textErrors = ValidationHelper.validateNotEmpty(inputField.value, "平文");
    if (textErrors.length > 0) {
      NotificationSystem.error(textErrors[0], "encrypt-notifications");
      return;
    }
    
    const lengthErrors = ValidationHelper.validateTextLength(inputField.value);
    if (lengthErrors.length > 0) {
      NotificationSystem.warning(lengthErrors[0], "encrypt-notifications");
      return;
    }
    
    if (!this.state.currentGrille) {
      NotificationSystem.error(ErrorMessages.GRILLE_NOT_GENERATED, "encrypt-notifications");
      return;
    }
    
    // エラーなしの場合、既存の通知をクリア
    NotificationSystem.clear("encrypt-notifications");
    
    const normalizedText = this.cipher.normalizeText(inputField.value);
    this.state.plainChars = normalizedText.split('');
    this.state.encryptionGrid = this.createEmptyGrid();
    this.state.rotationCount = 0;
    
    this.updateRotationLabel("rotationLabel", 0);
    this.getElement("nextRotation").disabled = true;
    this.getElement("cipherText").value = "";
    
    // 進捗表示の初期化
    const totalChars = normalizedText.length;
    const nextChars = this.getNextStepCharCount(0);
    this.updateEncryptionProgress(0, totalChars, 0, nextChars);
    
    this.fillNextStep();
  }

  // 次のステップを埋める
  fillNextStep() {
    const result = this.cipher.encryptStep(
      this.state.plainChars,
      this.state.encryptionGrid,
      this.state.currentGrille,
      this.state.rotationCount
    );
    
    this.state.encryptionGrid = result.grid;
    this.drawEncryptionGrid();
    
    // 進捗表示を更新
    const originalLength = this.cipher.normalizeText(this.getElement(CONFIG.DOM_IDS.PLAIN_TEXT).value).length;
    const usedChars = originalLength - result.remainingChars;
    const nextChars = result.remainingChars > 0 ? this.getNextStepCharCount(this.state.rotationCount + 1) : 0;
    this.updateEncryptionProgress(this.state.rotationCount, originalLength, usedChars, nextChars);
    
    if (result.filled > 0 && result.remainingChars > 0) {
      this.getElement(CONFIG.DOM_IDS.NEXT_ROTATION).disabled = false;
    } else {
      this.getElement(CONFIG.DOM_IDS.NEXT_ROTATION).disabled = true;
      this.showFinalCipher();
      NotificationSystem.success(ErrorMessages.ENCRYPTION_COMPLETE, CONFIG.DOM_IDS.ENCRYPT_NOTIFICATIONS);
    }
  }

  // 暗号化グリッドの描画
  drawEncryptionGrid() {
    const container = this.getElement("encryptionGrid");
    container.innerHTML = "";
    this.setGridStyles(container);
    
    const holes = this.cipher.getGrilleHoles(
      this.state.currentGrille,
      this.state.rotationCount
    );
    const holeSet = new Set(holes.map(([r, c]) => `${r},${c}`));
    
    for (let r = 0; r < CONFIG.GRILLE_SIZE; r++) {
      for (let c = 0; c < CONFIG.GRILLE_SIZE; c++) {
        const isHole = holeSet.has(`${r},${c}`);
        const content = this.state.encryptionGrid[r][c];
        const classes = [];
        
        if (isHole) classes.push("cell-hole");
        if (!isHole && content) classes.push("cell-faded");
        
        const cell = this.createCell(r, c, content, classes);
        cell.id = `enc-${r}-${c}`;
        container.appendChild(cell);
      }
    }
  }

  // 最終暗号文の表示
  showFinalCipher() {
    let result = "";
    for (let r = 0; r < CONFIG.GRILLE_SIZE; r++) {
      for (let c = 0; c < CONFIG.GRILLE_SIZE; c++) {
        result += this.state.encryptionGrid[r][c] || "";
      }
    }
    this.getElement("cipherText").value = result;
  }

  // 次の回転ステップ
  nextRotationStep() {
    this.state.rotationCount++;
    this.updateRotationLabel("rotationLabel", this.state.rotationCount);
    this.applyRotationAnimation("encryptionGrid", () => this.fillNextStep());
  }

  // 復号化の開始
  startDecryption() {
    const cipherInput = this.getElement("cipherInput").value;
    
    // 入力検証
    const textErrors = ValidationHelper.validateNotEmpty(cipherInput, "暗号文");
    if (textErrors.length > 0) {
      NotificationSystem.error(textErrors[0], "decrypt-notifications");
      return;
    }
    
    if (!this.state.currentGrille) {
      NotificationSystem.error(ErrorMessages.GRILLE_NOT_GENERATED, "decrypt-notifications");
      return;
    }
    
    // エラーなしの場合、既存の通知をクリア
    NotificationSystem.clear("decrypt-notifications");
    
    const input = this.cipher.normalizeText(cipherInput);
    this.state.cipherChars = input.split('');
    this.state.decryptionGrid = this.createEmptyGrid();
    this.state.decryptionStep = 0;
    this.state.recoveredText = "";
    
    // 暗号文をグリッドに配置
    let index = 0;
    for (let r = 0; r < CONFIG.GRILLE_SIZE; r++) {
      for (let c = 0; c < CONFIG.GRILLE_SIZE; c++) {
        this.state.decryptionGrid[r][c] = this.state.cipherChars[index++] || "";
      }
    }
    
    this.drawDecryptionGrid();
    this.getElement(CONFIG.DOM_IDS.RECOVERED_TEXT).value = "";
    this.updateRotationLabel(CONFIG.DOM_IDS.DECRYPTION_ROTATION_LABEL, 0);
    this.getElement(CONFIG.DOM_IDS.NEXT_DECRYPTION).disabled = false;
    
    // 進捗表示の初期化
    const nextChars = this.getNextStepCharCount(0);
    this.updateDecryptionProgress(0, 0, nextChars);
  }

  // 次の復号化ステップ
  nextDecryptionStep() {
    const result = this.cipher.decryptStep(
      this.state.decryptionGrid,
      this.state.currentGrille,
      this.state.decryptionStep
    );
    
    this.state.recoveredText += result.chars;
    
    // アニメーション
    result.holes.forEach(([r, c]) => {
      this.animateCell(r, c, "decryptionGrid");
    });
    
    this.drawDecryptionGrid(result.holes);
    this.getElement(CONFIG.DOM_IDS.RECOVERED_TEXT).value = this.state.recoveredText;
    
    this.state.decryptionStep++;
    
    // 進捗表示を更新
    const nextChars = this.state.decryptionStep < CONFIG.ROTATION_COUNT ? this.getNextStepCharCount(this.state.decryptionStep) : 0;
    this.updateDecryptionProgress(this.state.decryptionStep - 1, this.state.recoveredText.length, nextChars);
    
    if (this.state.decryptionStep >= CONFIG.ROTATION_COUNT) {
      this.getElement(CONFIG.DOM_IDS.NEXT_DECRYPTION).disabled = true;
      NotificationSystem.success(ErrorMessages.DECRYPTION_COMPLETE, CONFIG.DOM_IDS.DECRYPT_NOTIFICATIONS);
    } else {
      this.applyRotationAnimation(CONFIG.DOM_IDS.DECRYPTION_GRID, () => {
        this.updateRotationLabel(CONFIG.DOM_IDS.DECRYPTION_ROTATION_LABEL, this.state.decryptionStep);
        this.drawDecryptionGrid();
      });
    }
  }

  // 復号化グリッドの描画
  drawDecryptionGrid(highlight = []) {
    const container = this.getElement("decryptionGrid");
    container.innerHTML = "";
    this.setGridStyles(container);
    
    const holes = this.cipher.getGrilleHoles(
      this.state.currentGrille,
      this.state.decryptionStep
    );
    const holeSet = new Set(holes.map(([r, c]) => `${r},${c}`));
    const highlightSet = new Set(highlight.map(([r, c]) => `${r},${c}`));
    
    for (let r = 0; r < CONFIG.GRILLE_SIZE; r++) {
      for (let c = 0; c < CONFIG.GRILLE_SIZE; c++) {
        const isHole = holeSet.has(`${r},${c}`);
        const isHighlight = highlightSet.has(`${r},${c}`);
        const content = this.state.decryptionGrid[r][c];
        const classes = [];
        
        if (isHole) classes.push("cell-hole");
        if (!isHole && content) classes.push("cell-faded");
        if (isHighlight) classes.push("cell-rotated");
        
        const cell = this.createCell(r, c, content, classes);
        cell.id = `dec-${r}-${c}`;
        container.appendChild(cell);
      }
    }
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
    
    // ステップ情報
    stepInfo.textContent = `ステップ ${step + 1}/${CONFIG.ROTATION_COUNT}`;
    
    // 文字情報
    charInfo.textContent = `${totalRecovered} 文字復号済み`;
    
    // 進捗バー
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
    this.state.encryptionGrid = this.createEmptyGrid();
    this.state.encryptionStep = 0;
    this.state.rotationCount = 0;
    
    this.updateRotationLabel(CONFIG.DOM_IDS.ROTATION_LABEL, 0);
    this.getElement(CONFIG.DOM_IDS.NEXT_ROTATION).disabled = true;
    this.getElement(CONFIG.DOM_IDS.CIPHER_TEXT).value = "";
    this.getElement(CONFIG.DOM_IDS.PLAIN_TEXT).value = CONFIG.DEFAULT_PLAINTEXT;
    
    const container = this.getElement(CONFIG.DOM_IDS.ENCRYPTION_GRID);
    container.innerHTML = "";
    container.style.display = "none";
    
    // 進捗表示をリセット
    this.resetProgress('encryption');
    
    this.getElement(CONFIG.DOM_IDS.START_ENCRYPTION).disabled = false;
  }

  initDecryptionMode() {
    this.state.cipherChars = [];
    this.state.decryptionStep = 0;
    this.state.decryptionGrid = this.createEmptyGrid();
    this.state.recoveredText = "";
    
    this.getElement(CONFIG.DOM_IDS.RECOVERED_TEXT).value = "";
    this.getElement(CONFIG.DOM_IDS.CIPHER_INPUT).value = "";
    this.getElement(CONFIG.DOM_IDS.NEXT_DECRYPTION).disabled = true;
    this.getElement(CONFIG.DOM_IDS.START_DECRYPTION).disabled = true; // 初期状態では無効
    this.updateRotationLabel(CONFIG.DOM_IDS.DECRYPTION_ROTATION_LABEL, 0);
    
    const container = this.getElement(CONFIG.DOM_IDS.DECRYPTION_GRID);
    container.innerHTML = "";
    container.style.display = "none";
    
    // 進捗表示をリセット
    this.resetProgress('decryption');
  }
}