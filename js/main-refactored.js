// アプリケーション初期化
let cipher;
let uiController;
let keyboardManager;
let themeManager;
const t = (key, params) => GrilleMessages.t(key, params);

// 🔹 グリル作成モード：3x3初期化・回転・6x6生成
function initBaseMatrix() {
  uiController.initGrilleCreator();
}

function showParseError(result) {
  uiController.showGrilleMessage(t(result.errorKey, result.params), 'error');
}

function bindGrilleCreator() {
  document.getElementById('baseMatrix').addEventListener('change', () => {
    const values = Array.from(document.querySelectorAll('#baseMatrix select'), select => select.value);
    uiController.setKey(values.join(''));
  });

  document.getElementById('loadKey').addEventListener('click', () => {
    const parsed = GrilleLogic.parseKey(document.getElementById('keyText').value);
    if (!parsed.ok) return showParseError(parsed);
    uiController.setKey(parsed.key);
    uiController.showGrilleMessage(t('key.loaded'), 'success');
  });

  document.getElementById('randomKey').addEventListener('click', () => {
    const bytes = new Uint8Array(9);
    crypto.getRandomValues(bytes);
    uiController.setKey(GrilleLogic.keyFromRandom(bytes));
    uiController.showGrilleMessage(t('key.random'), 'success');
  });

  document.getElementById('resetKey').addEventListener('click', () => {
    uiController.setKey(GrilleLogic.DEFAULT_KEY);
    uiController.showGrilleMessage(t('key.reset'), 'success');
  });

  document.querySelectorAll('input[name="direction"]').forEach(input => {
    input.addEventListener('change', () => uiController.setDirection(input.value));
  });

  document.getElementById('loadPattern').addEventListener('click', () => {
    const parsed = GrilleLogic.parseHolePattern(document.getElementById('patternText').value);
    if (!parsed.ok) return showParseError(parsed);
    uiController.setKey(parsed.key);
    uiController.showGrilleMessage(t('pattern.loaded'), 'success');
  });

  document.getElementById('copyPattern').addEventListener('click', async () => {
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') throw new Error('clipboard');
      await navigator.clipboard.writeText(document.getElementById('patternText').value);
      uiController.showGrilleMessage(t('copy.done'), 'success');
    } catch (_error) {
      uiController.showGrilleMessage(t('copy.failed'), 'error');
    }
  });

  document.getElementById('loadSample').addEventListener('click', () => {
    const id = document.getElementById('sampleSelect').value;
    const sample = GrilleSamples.find(item => item.id === id);
    if (!sample) return;
    uiController.clearRuns();
    uiController.setKey(sample.key);
    uiController.setDirection(sample.direction);
    document.getElementById('plainText').value = sample.plain;
    document.getElementById('cipherInput').value = sample.cipher;
    const name = t(sample.nameKey);
    const note = sample.noteKey ? ` ${t(sample.noteKey)}` : '';
    uiController.showGrilleMessage(t('sample.loaded', { name }) + note, 'success');
    checkPlainTextAndUpdateButtons();
    checkCipherTextAndUpdateButtons();
  });

  const randomButton = document.getElementById('randomKey');
  randomButton.disabled = !globalThis.crypto || typeof globalThis.crypto.getRandomValues !== 'function';
}

// 平文入力チェック
function checkPlainTextAndUpdateButtons() {
  const inputField = document.getElementById(CONFIG.DOM_IDS.PLAIN_TEXT);
  const startButton = document.getElementById(CONFIG.DOM_IDS.START_ENCRYPTION);
  const nextButton = document.getElementById(CONFIG.DOM_IDS.NEXT_ROTATION);
  
  if (inputField.value.trim() === "") {
    startButton.disabled = true;
    nextButton.disabled = true;
  } else {
    // 文字種検証
    const charValidation = ValidationHelper.validateTextCharacters(inputField.value);
    if (charValidation.errors.length > 0) {
      startButton.disabled = true;
      nextButton.disabled = true;
      NotificationSystem.error(charValidation.errors[0], CONFIG.DOM_IDS.ENCRYPT_NOTIFICATIONS);
    } else {
      startButton.disabled = false;
      // 入力時に既存のエラーをクリア
      NotificationSystem.clear(CONFIG.DOM_IDS.ENCRYPT_NOTIFICATIONS);
      
      // 警告があれば表示（ボタンは有効のまま）
      if (charValidation.warnings.length > 0) {
        NotificationSystem.warning(charValidation.warnings[0], CONFIG.DOM_IDS.ENCRYPT_NOTIFICATIONS);
      }
    }
  }
}

// 暗号文入力チェック
function checkCipherTextAndUpdateButtons() {
  const inputField = document.getElementById(CONFIG.DOM_IDS.CIPHER_INPUT);
  const startButton = document.getElementById(CONFIG.DOM_IDS.START_DECRYPTION);
  
  if (inputField.value.trim() === "") {
    startButton.disabled = true;
  } else {
    // 文字種検証
    const charValidation = ValidationHelper.validateTextCharacters(inputField.value);
    if (charValidation.errors.length > 0) {
      startButton.disabled = true;
      NotificationSystem.error(charValidation.errors[0], CONFIG.DOM_IDS.DECRYPT_NOTIFICATIONS);
    } else {
      startButton.disabled = false;
      // 入力時に既存のエラーをクリア
      NotificationSystem.clear(CONFIG.DOM_IDS.DECRYPT_NOTIFICATIONS);
      
      // 警告があれば表示（ボタンは有効のまま）
      if (charValidation.warnings.length > 0) {
        NotificationSystem.warning(charValidation.warnings[0], CONFIG.DOM_IDS.DECRYPT_NOTIFICATIONS);
      }
    }
  }
}

// コピー機能
function copyCipherText() {
  const text = document.getElementById(CONFIG.DOM_IDS.CIPHER_TEXT).value;
  if (!text) {
    NotificationSystem.warning("コピーする暗号文がありません", CONFIG.DOM_IDS.ENCRYPT_NOTIFICATIONS);
    return;
  }
  
  navigator.clipboard.writeText(text).then(() => {
    const toast = document.getElementById(CONFIG.DOM_IDS.TOAST);
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
  }).catch(error => {
    NotificationSystem.error("コピーに失敗しました", CONFIG.DOM_IDS.ENCRYPT_NOTIFICATIONS);
    console.error("Copy failed:", error);
  });
}

// モードリセット
function resetAllModes() {
  uiController.initEncryptionMode();
  uiController.initDecryptionMode();
  
  // すべての通知をクリア
  NotificationSystem.clearAll();
  
  const sections = document.querySelectorAll(".tab-content");
  sections.forEach(sec => sec.classList.remove("active"));
  document.getElementById("grille").classList.add("active");
  const tabs = document.querySelectorAll(".tab-button");
  tabs.forEach(tab => tab.classList.remove("active"));
  tabs[0].classList.add("active");
}

// イベント登録
document.addEventListener("DOMContentLoaded", () => {
  // インスタンス作成
  cipher = new GrilleCipher();
  uiController = new UIController(cipher);
  keyboardManager = new KeyboardShortcutManager(uiController);
  themeManager = new ThemeManager();

  // 平文入力時のチェック
  document.getElementById(CONFIG.DOM_IDS.PLAIN_TEXT).addEventListener("input", () => {
    checkPlainTextAndUpdateButtons();
    document.getElementById(CONFIG.DOM_IDS.NEXT_ROTATION).disabled = true;
  });
  checkPlainTextAndUpdateButtons();

  // 暗号文入力時のチェック
  document.getElementById(CONFIG.DOM_IDS.CIPHER_INPUT).addEventListener("input", () => {
    checkCipherTextAndUpdateButtons();
    document.getElementById(CONFIG.DOM_IDS.NEXT_DECRYPTION).disabled = true;
  });
  checkCipherTextAndUpdateButtons();

  // 暗号化モードのイベント
  document.getElementById(CONFIG.DOM_IDS.START_ENCRYPTION).addEventListener("click", () => {
    uiController.startEncryption();
  });
  
  document.getElementById(CONFIG.DOM_IDS.NEXT_ROTATION).addEventListener("click", () => {
    uiController.nextRotationStep();
  });

  // 復号化モードのイベント
  document.getElementById(CONFIG.DOM_IDS.START_DECRYPTION).addEventListener("click", () => {
    uiController.startDecryption();
  });
  
  document.getElementById(CONFIG.DOM_IDS.NEXT_DECRYPTION).addEventListener("click", () => {
    uiController.nextDecryptionStep();
  });

  // その他のイベント
  document.getElementById(CONFIG.DOM_IDS.COPY_CIPHER).addEventListener("click", copyCipherText);
  
  // ショートカットヘルプ
  document.getElementById("showShortcutHelp").addEventListener("click", () => {
    keyboardManager.showHelp();
  });
  
  // テーマ切り替え
  document.getElementById(CONFIG.DOM_IDS.THEME_TOGGLE).addEventListener("click", () => {
    themeManager.toggleTheme();
  });

  // ヘルプモーダル
  const helpButton = document.getElementById(CONFIG.DOM_IDS.HELP_BUTTON);
  const helpModal = document.getElementById(CONFIG.DOM_IDS.HELP_MODAL);
  const helpClose = document.getElementById(CONFIG.DOM_IDS.HELP_CLOSE);

  // ヘルプボタンクリック
  helpButton.addEventListener("click", () => {
    helpModal.classList.add("show");
    document.body.style.overflow = "hidden"; // スクロール無効化
  });

  // 閉じるボタンクリック
  helpClose.addEventListener("click", () => {
    helpModal.classList.remove("show");
    document.body.style.overflow = ""; // スクロール復活
  });

  // オーバーレイクリックで閉じる
  helpModal.addEventListener("click", (e) => {
    if (e.target === helpModal) {
      helpModal.classList.remove("show");
      document.body.style.overflow = "";
    }
  });

  // ESCキーで閉じる
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && helpModal.classList.contains("show")) {
      helpModal.classList.remove("show");
      document.body.style.overflow = "";
    }
  });

  // グリル生成
  initBaseMatrix();
  bindGrilleCreator();

  // タブ切り替え
  const tabs = document.querySelectorAll(".tab-button");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.target;
      document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(sec => sec.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(target).classList.add("active");
      
      // キーボードショートカットのモードを更新
      keyboardManager.setCurrentMode(target);
      
      if (target === "encrypt") {
        document.getElementById(CONFIG.DOM_IDS.NEXT_ROTATION).disabled = true;
        checkPlainTextAndUpdateButtons();
      } else if (target === "decrypt") {
        document.getElementById(CONFIG.DOM_IDS.NEXT_DECRYPTION).disabled = true;
        checkCipherTextAndUpdateButtons();
      }
    });
  });

  // 初期化
  resetAllModes();
  
  // キーボードショートカット初期モード設定
  keyboardManager.setCurrentMode('grille');
});
