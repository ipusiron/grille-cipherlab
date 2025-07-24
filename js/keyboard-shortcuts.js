// キーボードショートカット管理システム

class KeyboardShortcutManager {
  constructor(uiController) {
    this.uiController = uiController;
    this.currentMode = 'grille'; // grille, encrypt, decrypt
    this.isShortcutsEnabled = true;
    this.activeModifierKeys = new Set();
    
    this.initEventListeners();
  }

  // イベントリスナーの初期化
  initEventListeners() {
    document.addEventListener('keydown', (event) => this.handleKeyDown(event));
    document.addEventListener('keyup', (event) => this.handleKeyUp(event));
    
    // フォーカス管理
    document.addEventListener('focusin', (event) => this.handleFocusIn(event));
    document.addEventListener('focusout', (event) => this.handleFocusOut(event));
  }

  // キーダウンイベント処理
  handleKeyDown(event) {
    if (!this.isShortcutsEnabled) return;
    
    // 修飾キーの管理
    if (event.ctrlKey) this.activeModifierKeys.add('ctrl');
    if (event.shiftKey) this.activeModifierKeys.add('shift');
    if (event.altKey) this.activeModifierKeys.add('alt');
    
    // 入力フィールドでは一部のショートカットを無効化
    if (this.isInputField(event.target)) {
      // Ctrl+Cとタブのみ許可
      if (event.code === CONFIG.KEYBOARD_SHORTCUTS.CTRL_C && event.ctrlKey) {
        this.handleCopyShortcut(event);
      }
      return;
    }

    // ショートカット処理
    switch (event.code) {
      case 'Space':
        this.handleSpaceKey(event);
        break;
      case CONFIG.KEYBOARD_SHORTCUTS.ENTER:
        this.handleEnterKey(event);
        break;
      case CONFIG.KEYBOARD_SHORTCUTS.ESCAPE:
        this.handleEscapeKey(event);
        break;
      case CONFIG.KEYBOARD_SHORTCUTS.CTRL_C:
        if (event.ctrlKey) {
          this.handleCopyShortcut(event);
        }
        break;
    }
  }

  // キーアップイベント処理
  handleKeyUp(event) {
    // 修飾キーの管理
    if (!event.ctrlKey) this.activeModifierKeys.delete('ctrl');
    if (!event.shiftKey) this.activeModifierKeys.delete('shift');
    if (!event.altKey) this.activeModifierKeys.delete('alt');
  }

  // フォーカス管理
  handleFocusIn(event) {
    const target = event.target;
    if (this.isInputField(target)) {
      this.isShortcutsEnabled = false;
    }
  }

  handleFocusOut(event) {
    if (this.isInputField(event.target)) {
      this.isShortcutsEnabled = true;
    }
  }

  // 入力フィールドかどうかの判定
  isInputField(element) {
    const inputTypes = ['INPUT', 'TEXTAREA', 'SELECT'];
    return inputTypes.includes(element.tagName) || element.contentEditable === 'true';
  }

  // スペースキー処理（進むボタン）
  handleSpaceKey(event) {
    event.preventDefault();
    
    switch (this.currentMode) {
      case 'encrypt':
        const nextRotationBtn = document.getElementById(CONFIG.DOM_IDS.NEXT_ROTATION);
        if (!nextRotationBtn.disabled) {
          this.showShortcutFeedback('スペース: 進む');
          nextRotationBtn.click();
        }
        break;
        
      case 'decrypt':
        const nextDecryptionBtn = document.getElementById(CONFIG.DOM_IDS.NEXT_DECRYPTION);
        if (!nextDecryptionBtn.disabled) {
          this.showShortcutFeedback('スペース: 進む');
          nextDecryptionBtn.click();
        }
        break;
    }
  }

  // エンターキー処理（開始ボタン）
  handleEnterKey(event) {
    event.preventDefault();
    
    switch (this.currentMode) {
      case 'grille':
        const generateBtn = document.getElementById(CONFIG.DOM_IDS.GENERATE_GRILLE);
        this.showShortcutFeedback('Enter: グリル生成');
        generateBtn.click();
        break;
        
      case 'encrypt':
        const startEncryptionBtn = document.getElementById(CONFIG.DOM_IDS.START_ENCRYPTION);
        if (!startEncryptionBtn.disabled) {
          this.showShortcutFeedback('Enter: 暗号化開始');
          startEncryptionBtn.click();
        }
        break;
        
      case 'decrypt':
        const startDecryptionBtn = document.getElementById(CONFIG.DOM_IDS.START_DECRYPTION);
        if (!startDecryptionBtn.disabled) {
          this.showShortcutFeedback('Enter: 復号開始');
          startDecryptionBtn.click();
        }
        break;
    }
  }

  // エスケープキー処理（リセット）
  handleEscapeKey(event) {
    event.preventDefault();
    
    this.showShortcutFeedback('Esc: リセット');
    
    switch (this.currentMode) {
      case 'encrypt':
        this.uiController.initEncryptionMode();
        break;
      case 'decrypt':
        this.uiController.initDecryptionMode();
        break;
      case 'grille':
        // グリル作成モードのリセット
        this.resetGrilleMode();
        break;
    }
  }

  // Ctrl+C処理（コピー）
  handleCopyShortcut(event) {
    if (this.currentMode === 'encrypt') {
      const cipherText = document.getElementById(CONFIG.DOM_IDS.CIPHER_TEXT).value;
      if (cipherText) {
        event.preventDefault();
        this.showShortcutFeedback('Ctrl+C: コピー');
        navigator.clipboard.writeText(cipherText).then(() => {
          const toast = document.getElementById(CONFIG.DOM_IDS.TOAST);
          toast.classList.add('show');
          setTimeout(() => toast.classList.remove('show'), 2000);
        }).catch(error => {
          console.error('Copy failed:', error);
          NotificationSystem.error('コピーに失敗しました', CONFIG.DOM_IDS.ENCRYPT_NOTIFICATIONS);
        });
      }
    }
  }

  // グリル作成モードのリセット
  resetGrilleMode() {
    // 3x3マトリクスをデフォルト値にリセット
    const inputs = document.querySelectorAll(`#${CONFIG.DOM_IDS.BASE_MATRIX} input`);
    inputs.forEach((input, index) => {
      const r = Math.floor(index / CONFIG.BASE_SIZE);
      const c = index % CONFIG.BASE_SIZE;
      input.value = CONFIG.DEFAULT_BASE_MATRIX[r][c];
    });
    
    // グリルプレビューをクリア
    const preview = document.getElementById(CONFIG.DOM_IDS.GRILLE_PREVIEW);
    preview.innerHTML = '';
    
    // 通知をクリア
    NotificationSystem.clear(CONFIG.DOM_IDS.GRILLE_NOTIFICATIONS);
  }

  // ショートカットフィードバック表示
  showShortcutFeedback(message) {
    // 既存のフィードバックを削除
    const existingFeedback = document.querySelector('.shortcut-feedback');
    if (existingFeedback) {
      existingFeedback.remove();
    }

    // フィードバック要素を作成
    const feedback = document.createElement('div');
    feedback.className = 'shortcut-feedback';
    feedback.textContent = message;
    
    // スタイルを設定
    Object.assign(feedback.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '0.5em 1em',
      borderRadius: '6px',
      fontSize: '0.9em',
      zIndex: '10000',
      animation: 'fadeInOut 1.5s ease-in-out forwards'
    });

    document.body.appendChild(feedback);

    // 自動削除
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.remove();
      }
    }, 1500);
  }

  // 現在のモードを設定
  setCurrentMode(mode) {
    this.currentMode = mode;
  }

  // ショートカットの有効/無効切り替え
  toggleShortcuts(enabled) {
    this.isShortcutsEnabled = enabled;
  }

  // ショートカットヘルプを表示
  showHelp() {
    const helpContent = `
📋 キーボードショートカット

🔹 グリル作成モード:
  Enter - グリル生成
  Esc   - リセット

🔹 暗号化モード:
  Enter    - 暗号化開始
  スペース  - 進む
  Ctrl+C   - 暗号文コピー
  Esc      - リセット

🔹 復号化モード:
  Enter    - 復号開始
  スペース  - 進む
  Esc      - リセット

🔹 共通:
  Tab - フィールド移動
    `;

    // ヘルプ表示のモーダルを作成（簡易版）
    alert(helpContent);
  }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KeyboardShortcutManager;
}