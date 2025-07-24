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
    return Array.from({ length: 6 }, () => Array(6).fill(''));
  }

  // DOM要素の取得（キャッシュ）
  getElement(id) {
    return document.getElementById(id);
  }

  // グリッドスタイルの設定
  setGridStyles(container) {
    container.style.display = "grid";
    container.style.gridTemplateColumns = "repeat(6, 40px)";
    container.style.gridTemplateRows = "repeat(6, 40px)";
    container.style.gap = "4px";
    container.style.width = "fit-content";
    container.style.margin = "1em auto";
  }

  // 回転アニメーション
  applyRotationAnimation(elementId, callback) {
    const element = this.getElement(elementId);
    element.classList.add("rotate-animation");
    setTimeout(() => {
      element.classList.remove("rotate-animation");
      if (callback) callback();
    }, 400);
  }

  // セルの作成
  createCell(r, c, content, classes = []) {
    const cell = document.createElement("div");
    cell.className = "cell";
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
      NotificationSystem.error(errors[0], "grille-notifications");
      return null;
    }
    
    try {
      const grille = this.cipher.generateGrille(base);
      this.state.currentGrille = grille;
      this.renderGrillePreview(grille);
      
      // 成功通知
      NotificationSystem.success(ErrorMessages.GRILLE_GENERATION_SUCCESS, "grille-notifications");
      
      return grille;
    } catch (error) {
      NotificationSystem.error("グリルの生成中にエラーが発生しました", "grille-notifications");
      console.error("Grille generation error:", error);
      return null;
    }
  }

  // ベース行列の値を取得
  getBaseMatrixValues() {
    const inputs = document.querySelectorAll("#baseMatrix input");
    const matrix = Array.from({ length: 3 }, () => Array(3).fill(0));
    
    inputs.forEach(input => {
      const r = parseInt(input.dataset.row);
      const c = parseInt(input.dataset.col);
      matrix[r][c] = parseInt(input.value);
    });
    
    return matrix;
  }

  // グリルプレビューの描画
  renderGrillePreview(grille) {
    const container = this.getElement("grillePreview");
    container.innerHTML = "";
    
    const base = this.getBaseMatrixValues();
    const regions = [
      base,
      this.cipher.rotateMatrix(base, 1),
      this.cipher.rotateMatrix(base, 2),
      this.cipher.rotateMatrix(base, 3)
    ];
    
    const offsets = [[0, 0], [0, 3], [3, 3], [3, 0]];
    
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        
        // 境界線の設定
        if ((r === 0 || r === 3) && (c >= 0 && c <= 5)) cell.style.borderTop = "2px solid #888";
        if ((r === 2 || r === 5) && (c >= 0 && c <= 5)) cell.style.borderBottom = "2px solid #888";
        if ((c === 0 || c === 3) && (r >= 0 && r <= 5)) cell.style.borderLeft = "2px solid #888";
        if ((c === 2 || c === 5) && (r >= 0 && r <= 5)) cell.style.borderRight = "2px solid #888";
        
        // 領域の値を表示
        for (let i = 0; i < 4; i++) {
          const [rowOffset, colOffset] = offsets[i];
          if (r >= rowOffset && r < rowOffset + 3 && c >= colOffset && c < colOffset + 3) {
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
          cell.classList.add("cell-hole");
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
    const inputField = this.getElement("plainText");
    
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
    
    if (result.filled > 0 && result.remainingChars > 0) {
      this.getElement("nextRotation").disabled = false;
    } else {
      this.getElement("nextRotation").disabled = true;
      this.showFinalCipher();
      NotificationSystem.success(ErrorMessages.ENCRYPTION_COMPLETE, "encrypt-notifications");
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
    
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
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
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
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
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        this.state.decryptionGrid[r][c] = this.state.cipherChars[index++] || "";
      }
    }
    
    this.drawDecryptionGrid();
    this.getElement("recoveredText").value = "";
    this.updateRotationLabel("decryptionRotationLabel", 0);
    this.getElement("nextDecryption").disabled = false;
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
    this.getElement("recoveredText").value = this.state.recoveredText;
    
    this.state.decryptionStep++;
    if (this.state.decryptionStep >= 4) {
      this.getElement("nextDecryption").disabled = true;
      NotificationSystem.success(ErrorMessages.DECRYPTION_COMPLETE, "decrypt-notifications");
    } else {
      this.applyRotationAnimation("decryptionGrid", () => {
        this.updateRotationLabel("decryptionRotationLabel", this.state.decryptionStep);
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
    
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
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

  // 初期化関数
  initEncryptionMode() {
    this.state.encryptionGrid = this.createEmptyGrid();
    this.state.encryptionStep = 0;
    this.state.rotationCount = 0;
    
    this.updateRotationLabel("rotationLabel", 0);
    this.getElement("nextRotation").disabled = true;
    this.getElement("cipherText").value = "";
    this.getElement("plainText").value = "HAPPY HOLIDAYS FROM THE HUNTINGTON FAMILY";
    
    const container = this.getElement("encryptionGrid");
    container.innerHTML = "";
    container.style.display = "none";
    
    this.getElement("startEncryption").disabled = false;
  }

  initDecryptionMode() {
    this.state.cipherChars = [];
    this.state.decryptionStep = 0;
    this.state.decryptionGrid = this.createEmptyGrid();
    this.state.recoveredText = "";
    
    this.getElement("recoveredText").value = "";
    this.getElement("cipherInput").value = "";
    this.getElement("nextDecryption").disabled = true;
    this.getElement("startDecryption").disabled = true; // 初期状態では無効
    this.updateRotationLabel("decryptionRotationLabel", 0);
    
    const container = this.getElement("decryptionGrid");
    container.innerHTML = "";
    container.style.display = "none";
  }
}