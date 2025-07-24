// アプリケーション初期化
let cipher;
let uiController;

// 🔹 グリル作成モード：3x3初期化・回転・6x6生成
function initBaseMatrix() {
  const container = document.getElementById("baseMatrix");
  container.innerHTML = "";

  // 初期値設定：[2,4,1][1,4,3][3,2,2]
  const initialValues = [
    [2, 4, 1],
    [1, 4, 3],
    [3, 2, 2]
  ];

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const input = document.createElement("input");
      input.type = "number";
      input.min = "1";
      input.max = "4";
      input.value = initialValues[r][c];
      input.dataset.row = r;
      input.dataset.col = c;
      input.style.width = "50px";
      input.style.height = "50px";
      input.style.textAlign = "center";
      input.style.fontSize = "18px";
      input.style.border = "2px solid #ccc";
      input.style.borderRadius = "6px";
      container.appendChild(input);
    }
  }
}

// 平文入力チェック
function checkPlainTextAndUpdateButtons() {
  const inputField = document.getElementById("plainText");
  const startButton = document.getElementById("startEncryption");
  const nextButton = document.getElementById("nextRotation");
  
  if (inputField.value.trim() === "") {
    startButton.disabled = true;
    nextButton.disabled = true;
  } else {
    startButton.disabled = false;
  }
}

// コピー機能
function copyCipherText() {
  const text = document.getElementById("cipherText").value;
  navigator.clipboard.writeText(text).then(() => {
    const toast = document.getElementById("toast");
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
  });
}

// モードリセット
function resetAllModes() {
  uiController.initEncryptionMode();
  uiController.initDecryptionMode();
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

  // 平文入力時のチェック
  document.getElementById("plainText").addEventListener("input", () => {
    checkPlainTextAndUpdateButtons();
    document.getElementById("nextRotation").disabled = true;
  });
  checkPlainTextAndUpdateButtons();

  // 暗号化モードのイベント
  document.getElementById("startEncryption").addEventListener("click", () => {
    uiController.startEncryption();
  });
  
  document.getElementById("nextRotation").addEventListener("click", () => {
    uiController.nextRotationStep();
  });

  // 復号化モードのイベント
  document.getElementById("startDecryption").addEventListener("click", () => {
    uiController.startDecryption();
  });
  
  document.getElementById("nextDecryption").addEventListener("click", () => {
    uiController.nextDecryptionStep();
  });

  // その他のイベント
  document.getElementById("copyCipher").addEventListener("click", copyCipherText);

  // グリル生成
  initBaseMatrix();
  document.getElementById("generateGrille").addEventListener("click", () => {
    uiController.generateGrille();
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
      
      if (target === "encrypt") {
        document.getElementById("nextRotation").disabled = true;
        checkPlainTextAndUpdateButtons();
      }
    });
  });

  // 初期化
  resetAllModes();
});