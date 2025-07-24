// 暗号化関連グローバル変数
let plainChars = [];
let encryptionStep = 0;
let rotationCount = 0;
let encryptionGrid = []; // 6x6配列

// 復号関連
let cipherChars = [];
let decryptionStep = 0;
let decryptionGrid = []; // 6x6配列
let recoveredText = "";

// 🔹 グリル作成モード：3x3初期化・回転・6x6生成
function initBaseMatrix() {
  const container = document.getElementById("baseMatrix");
  container.innerHTML = "";
  const defaultValues = [
    [2, 4, 1],
    [1, 4, 3],
    [3, 2, 2]
  ];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const input = document.createElement("input");
      input.type = "number";
      input.min = 1;
      input.max = 4;
      input.value = defaultValues[r][c];
      input.className = "cell";
      input.style.width = "50px";
      input.style.height = "50px";
      input.dataset.row = r;
      input.dataset.col = c;
      container.appendChild(input);
    }
  }
}

function getBaseMatrixValues() {
  const inputs = document.querySelectorAll("#baseMatrix input");
  const matrix = Array.from({ length: 3 }, () => []);
  inputs.forEach(input => {
    const r = parseInt(input.dataset.row);
    const c = parseInt(input.dataset.col);
    matrix[r][c] = parseInt(input.value);
  });
  return matrix;
}

function rotateMatrix(matrix, times) {
  let res = matrix.map(row => [...row]);
  for (let t = 0; t < times; t++) {
    res = res[0].map((_, i) => res.map(row => row[i]).reverse());
  }
  return res;
}

function buildRotatingGrille(base3x3) {
  const grille6x6 = Array.from({ length: 6 }, () => Array(6).fill(false));
  const offsets = [
    [0, 0],  // 0° → 左上
    [0, 3],  // 90° → 右上
    [3, 3],  // 180° → 右下
    [3, 0]   // 270° → 左下
  ];

  for (let rot = 0; rot < 4; rot++) {
    const rotated = rotateMatrix(base3x3, rot);
    const [rowOffset, colOffset] = offsets[rot];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (rotated[r][c] === rot + 1) {
          grille6x6[rowOffset + r][colOffset + c] = true;
        }
      }
    }
  }
  return grille6x6;
}

function renderGrillePreview(grille) {
  const container = document.getElementById("grillePreview");
  container.innerHTML = "";

  const base = getBaseMatrixValues();
  const regions = [
    rotateMatrix(base, 0),
    rotateMatrix(base, 1),
    rotateMatrix(base, 2),
    rotateMatrix(base, 3)
  ];

  const offsets = [
    [0, 0], [0, 3], [3, 3], [3, 0]
  ];

  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";

      if ((r === 0 || r === 3) && (c >= 0 && c <= 5)) cell.style.borderTop = "2px solid #888";
      if ((r === 2 || r === 5) && (c >= 0 && c <= 5)) cell.style.borderBottom = "2px solid #888";
      if ((c === 0 || c === 3) && (r >= 0 && r <= 5)) cell.style.borderLeft = "2px solid #888";
      if ((c === 2 || c === 5) && (r >= 0 && r <= 5)) cell.style.borderRight = "2px solid #888";

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

function initEncryptionGrid() {
  encryptionGrid = Array.from({ length: 6 }, () => Array(6).fill(""));
  encryptionStep = 0;
  rotationCount = 0;
  document.getElementById("rotationLabel").textContent = "回転：0度";
  document.getElementById("nextRotation").disabled = true;
  document.getElementById("cipherText").value = "";
  document.getElementById("plainText").value = "HAPPY HOLIDAYS FROM THE HUNTINGTON FAMILY";
  drawEncryptionGrid();
  // 初期テキストがあるので暗号化開始ボタンは有効
  document.getElementById("startEncryption").disabled = false;
}

function initDecryptionGrid() {
  cipherChars = [];
  decryptionStep = 0;
  decryptionGrid = Array.from({ length: 6 }, () => Array(6).fill(""));
  recoveredText = "";
  document.getElementById("recoveredText").value = "";
  document.getElementById("cipherInput").value = "";
  document.getElementById("nextDecryption").disabled = true;
  document.getElementById("decryptionRotationLabel").textContent = "回転：0度";
  drawDecryptionGrid();
}

function resetAllModes() {
  initEncryptionGrid();
  initDecryptionGrid();
  const sections = document.querySelectorAll(".tab-content");
  sections.forEach(sec => sec.classList.remove("active"));
  document.getElementById("grille").classList.add("active");
  const tabs = document.querySelectorAll(".tab-button");
  tabs.forEach(tab => tab.classList.remove("active"));
  tabs[0].classList.add("active");
}

// 文字埋め処理（暗号化）
function checkPlainTextAndUpdateButtons() {
  const inputField = document.getElementById("plainText");
  const startButton = document.getElementById("startEncryption");
  const nextButton = document.getElementById("nextRotation");
  
  if (inputField.value.trim() === "") {
    startButton.disabled = true;
    nextButton.disabled = true;
  } else {
    startButton.disabled = false;
    // nextButton は startEncryption 実行後に有効化される
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("plainText").addEventListener("input", () => {
    checkPlainTextAndUpdateButtons();
    document.getElementById("nextRotation").disabled = true;
  });
  // 初期状態でもチェック
  checkPlainTextAndUpdateButtons();
});
function startEncryption() {
  const inputField = document.getElementById("plainText");
  if (inputField.value.trim() === "") {
    return;
  }
  
  document.getElementById("nextRotation").disabled = true;
  document.getElementById("cipherText").value = "";
  
  const input = inputField.value.toUpperCase();
  plainChars = input.replace(/[^A-Z]/g, "").split("");
  encryptionGrid = Array.from({ length: 6 }, () => Array(6).fill(""));
  rotationCount = 0;
  document.getElementById("rotationLabel").textContent = "回転：0度";
  fillNextStep();
}

function nextRotationStep() {
  rotationCount++;
  document.getElementById("rotationLabel").textContent = `回転：${rotationCount * 90}度`;
  document.getElementById("encryptionGrid").classList.add("rotate-animation");
  setTimeout(() => {
    document.getElementById("encryptionGrid").classList.remove("rotate-animation");
    fillNextStep();
  }, 400);
}

function fillNextStep() {
  const holes = getCurrentRotatedGrilleMap();
  let filled = 0;
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if (holes[r][c] && encryptionGrid[r][c] === "" && plainChars.length > 0) {
        encryptionGrid[r][c] = plainChars.shift();
        filled++;
      }
    }
  }
  drawEncryptionGrid();
  if (filled > 0 && plainChars.length > 0) {
    document.getElementById("nextRotation").disabled = false;
  } else {
    document.getElementById("nextRotation").disabled = true;
    showFinalCipher();  // 暗号文完成後に表示
  }
}

function nextRotationStep() {
  rotationCount++;
  document.getElementById("rotationLabel").textContent = `回転：${rotationCount * 90}度`;
  document.getElementById("encryptionGrid").classList.add("rotate-animation");
  setTimeout(() => {
    document.getElementById("encryptionGrid").classList.remove("rotate-animation");
    fillNextStep();
  }, 400);
}

function getCurrentRotatedGrilleMap() {
  const g = window.currentGrille;
  const rotatedMap = Array.from({ length: 6 }, () => Array(6).fill(false));
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if (g[r][c]) {
        let [rr, cc] = [r, c];
        for (let i = 0; i < rotationCount % 4; i++) {
          [rr, cc] = [cc, 5 - rr];
        }
        rotatedMap[rr][cc] = true;
      }
    }
  }
  return rotatedMap;
}


function drawEncryptionGrid() {
  const container = document.getElementById("encryptionGrid");
  container.innerHTML = "";
  container.style.display = "grid";
  container.style.gridTemplateColumns = "repeat(6, 40px)";
  container.style.gridTemplateRows = "repeat(6, 40px)";
  container.style.gap = "4px";

  const rotatedMap = getCurrentRotatedGrilleMap();
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.id = `enc-${r}-${c}`;
      if (rotatedMap[r][c]) cell.classList.add("cell-hole");
      if (encryptionGrid[r][c] !== "") cell.textContent = encryptionGrid[r][c];
      if (!rotatedMap[r][c] && encryptionGrid[r][c] !== "") cell.classList.add("cell-faded");
      container.appendChild(cell);
    }
  }
}

function showFinalCipher() {
  let result = "";
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      result += encryptionGrid[r][c] || "";
    }
  }
  document.getElementById("cipherText").value = result;
}

function copyCipherText() {
  const text = document.getElementById("cipherText").value;
  navigator.clipboard.writeText(text).then(() => {
    const toast = document.getElementById("toast");
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
  });
}

function startDecryption() {
  const input = document.getElementById("cipherInput").value.toUpperCase();
  cipherChars = input.replace(/[^A-Z]/g, "").split("");
  decryptionGrid = Array.from({ length: 6 }, () => Array(6).fill(""));
  decryptionStep = 0;
  recoveredText = "";

  let index = 0;
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      decryptionGrid[r][c] = cipherChars[index++] || "";
    }
  }

  drawDecryptionGrid();
  document.getElementById("recoveredText").value = "";
  document.getElementById("decryptionRotationLabel").textContent = "回転：0度";
  document.getElementById("nextDecryption").disabled = false;
}

function getCurrentRotatedGrille() {
  const holes = [];
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if (window.currentGrille[r][c]) {
        holes.push([r, c]);
      }
    }
  }
  return holes;
}

function nextDecryptionStep() {
  const holes = getCurrentRotatedGrille();
  for (const [r, c] of holes) {
    const ch = decryptionGrid[r][c];
    if (ch) recoveredText += ch;
    animateCell(r, c, "decryptionGrid");
  }

  drawDecryptionGrid(holes);
  document.getElementById("recoveredText").value = recoveredText;

  decryptionStep++;
  if (decryptionStep >= 4) {
    document.getElementById("nextDecryption").disabled = true;
  } else {
    // 回転アニメーションを追加
    document.getElementById("decryptionGrid").classList.add("rotate-animation");
    setTimeout(() => {
      document.getElementById("decryptionGrid").classList.remove("rotate-animation");
      rotateGrille();
      document.getElementById("decryptionRotationLabel").textContent = `回転：${decryptionStep * 90}度`;
      drawDecryptionGrid();
    }, 400);
    document.getElementById("nextDecryption").disabled = false;
  }
}


function drawDecryptionGrid(highlight = []) {
  const container = document.getElementById("decryptionGrid");
  container.style.display = "grid";
  container.style.gridTemplateColumns = "repeat(6, 40px)";
  container.style.gridTemplateRows = "repeat(6, 40px)";
  container.style.gap = "4px";
  container.innerHTML = "";
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.id = `dec-${r}-${c}`;
      if (window.currentGrille[r][c]) cell.classList.add("cell-hole");
      if (decryptionGrid[r][c]) cell.textContent = decryptionGrid[r][c];
      if (!window.currentGrille[r][c] && decryptionGrid[r][c]) {
        cell.classList.add("cell-faded");
      }
      if (highlight.some(([hr, hc]) => hr === r && hc === c)) {
        cell.classList.add("cell-rotated");
      }
      container.appendChild(cell);
    }
  }
}

function animateCell(r, c, gridId) {
  const id = gridId === "encryptionGrid" ? `enc-${r}-${c}` : `dec-${r}-${c}`;
  const cell = document.getElementById(id);
  if (!cell) return;
  cell.classList.add("highlight-once");
  setTimeout(() => cell.classList.remove("highlight-once"), 400);
}

// イベント登録
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("startEncryption").addEventListener("click", startEncryption);
  document.getElementById("nextRotation").addEventListener("click", nextRotationStep);
  document.getElementById("copyCipher").addEventListener("click", copyCipherText);
  document.getElementById("startDecryption").addEventListener("click", startDecryption);
  document.getElementById("nextDecryption").addEventListener("click", nextDecryptionStep);

  initBaseMatrix();
  document.getElementById("generateGrille").addEventListener("click", () => {
    const base = getBaseMatrixValues();
    const grille = buildRotatingGrille(base);
    renderGrillePreview(grille);
    window.currentGrille = grille;
  });

  // タブ切り替え時にリセット（必要に応じて）
  const tabs = document.querySelectorAll(".tab-button");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.target;
      document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(sec => sec.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(target).classList.add("active");
      
      // 暗号化タブに切り替えた時、進むボタンが確実に無効化されているか確認
      if (target === "encrypt") {
        document.getElementById("nextRotation").disabled = true;
        checkPlainTextAndUpdateButtons();
      }
    });
  });

  // 初回リセット（任意）
  resetAllModes();
});

function rotateGrille() {
  const newGrille = Array.from({ length: 6 }, () => Array(6).fill(false));
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if (window.currentGrille[r][c]) {
        let [rr, cc] = [c, 5 - r];  // 90度回転
        newGrille[rr][cc] = true;
      }
    }
  }
  window.currentGrille = newGrille;
}
