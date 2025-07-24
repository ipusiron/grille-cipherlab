// アプリケーション初期化
let cipher;
let uiController;
let keyboardManager;
let themeManager;

// 🔹 グリル作成モード：3x3初期化・回転・6x6生成
function initBaseMatrix() {
  const container = document.getElementById(CONFIG.DOM_IDS.BASE_MATRIX);
  container.innerHTML = "";

  // 初期値設定：CONFIG.DEFAULT_BASE_MATRIX
  const initialValues = CONFIG.DEFAULT_BASE_MATRIX;

  for (let r = 0; r < CONFIG.BASE_SIZE; r++) {
    for (let c = 0; c < CONFIG.BASE_SIZE; c++) {
      const input = document.createElement("input");
      input.type = "number";
      input.min = CONFIG.MATRIX_VALUE_MIN.toString();
      input.max = CONFIG.MATRIX_VALUE_MAX.toString();
      input.value = initialValues[r][c];
      input.dataset.row = r;
      input.dataset.col = c;
      Object.assign(input.style, CONFIG.INPUT_STYLES);
      container.appendChild(input);
    }
  }
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
    startButton.disabled = false;
    // 入力時に既存のエラーをクリア
    NotificationSystem.clear(CONFIG.DOM_IDS.ENCRYPT_NOTIFICATIONS);
  }
}

// 暗号文入力チェック
function checkCipherTextAndUpdateButtons() {
  const inputField = document.getElementById(CONFIG.DOM_IDS.CIPHER_INPUT);
  const startButton = document.getElementById(CONFIG.DOM_IDS.START_DECRYPTION);
  
  if (inputField.value.trim() === "") {
    startButton.disabled = true;
  } else {
    startButton.disabled = false;
    // 入力時に既存のエラーをクリア
    NotificationSystem.clear(CONFIG.DOM_IDS.DECRYPT_NOTIFICATIONS);
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
  document.getElementById(CONFIG.DOM_IDS.GENERATE_GRILLE).addEventListener("click", () => {
    uiController.generateGrille();
    // グリル生成後、暗号化・復号化開始ボタンの状態をチェック
    checkPlainTextAndUpdateButtons();
    checkCipherTextAndUpdateButtons();
  });

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