// アプリケーション初期化
let uiController;
let keyboardManager;
let themeManager;
let globalStatusTimer;
const t = (key, params) => GrilleMessages.t(key, params);

function showGlobalStatus(message) {
  const status = document.getElementById('globalStatus');
  clearTimeout(globalStatusTimer);
  status.textContent = message;
  globalStatusTimer = setTimeout(() => {
    status.textContent = '';
  }, 1500);
}

// 🔹 グリル作成モード：3x3初期化・回転・6x6生成
function initBaseMatrix() {
  uiController.initGrilleCreator();
}

function showParseError(result) {
  uiController.showGrilleMessage(t(result.errorKey, result.params), 'error');
}

function syncShareHash() {
  const hash = GrilleShare.format(uiController.state.key, uiController.state.direction);
  history.replaceState(null, '', hash);
}

function currentShareUrl() {
  const base = location.protocol === 'file:'
    ? location.href.split('#')[0]
    : `${location.origin}${location.pathname}`;
  return `${base}${GrilleShare.format(uiController.state.key, uiController.state.direction)}`;
}

function loadShareHash() {
  if (!location.hash) {
    syncShareHash();
    return;
  }
  const parsed = GrilleShare.parse(location.hash);
  if (!parsed.ok) {
    uiController.showGrilleMessage(t(parsed.errorKey === 'share.direction' ? parsed.errorKey : 'share.invalid'), 'error');
    syncShareHash();
    return;
  }
  uiController.setKey(parsed.key);
  uiController.setDirection(parsed.direction);
  uiController.showGrilleMessage(t('share.loaded', {
    key: parsed.key,
    direction: t(`solve.direction.${parsed.direction}`)
  }), 'success');
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
    uiController.clearRuns(true);
    uiController.initSolveMode();
    uiController.setKey(sample.key);
    uiController.setDirection(sample.direction);
    document.getElementById('plainText').value = sample.plain;
    document.getElementById('cipherInput').value = sample.cipher;
    document.getElementById('solveCipher').value = sample.cipher;
    const normalizedCipher = GrilleLogic.normalizeText(sample.cipher);
    uiController.updateFrequencyLink('solveFrequencyLink', GrilleLogic.formatGroups(normalizedCipher.letters));
    const name = t(sample.nameKey);
    const note = sample.noteKey ? ` ${t(sample.noteKey)}` : '';
    uiController.showGrilleMessage(t('sample.loaded', { name }) + note, 'success');
  });

  const randomButton = document.getElementById('randomKey');
  randomButton.disabled = !globalThis.crypto || typeof globalThis.crypto.getRandomValues !== 'function';
}

function randomFiller(count) {
  const output = [];
  while (output.length < count) {
    const bytes = new Uint8Array(count - output.length);
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      if (byte < 234) output.push(String.fromCharCode(65 + byte % 26));
    }
  }
  return output.join('');
}

function selectedFiller() {
  return document.getElementById('fillerRandom').checked
    ? randomFiller
    : GrilleLogic.fixedFiller('X');
}

// コピー機能
async function copyCipherText() {
  const text = document.getElementById(CONFIG.DOM_IDS.CIPHER_TEXT).value;
  if (!text) return;
  try {
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') throw new Error('clipboard');
    await navigator.clipboard.writeText(text);
    NotificationSystem.success(t('copy.done'), CONFIG.DOM_IDS.ENCRYPT_NOTIFICATIONS, 0);
  } catch (_error) {
    NotificationSystem.error(t('copy.failed'), CONFIG.DOM_IDS.ENCRYPT_NOTIFICATIONS, 0);
  }
}

async function copyRecoveredText() {
  const text = document.getElementById('recoveredText').value;
  if (!text) return;
  try {
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') throw new Error('clipboard');
    await navigator.clipboard.writeText(text);
    NotificationSystem.success(t('copy.done'), CONFIG.DOM_IDS.DECRYPT_NOTIFICATIONS, 0);
  } catch (_error) {
    NotificationSystem.error(t('copy.failed'), CONFIG.DOM_IDS.DECRYPT_NOTIFICATIONS, 0);
  }
}

// モードリセット
function resetAllModes() {
  uiController.initEncryptionMode();
  uiController.initDecryptionMode();
  uiController.initSolveMode();
  
  // すべての通知をクリア
  NotificationSystem.clearAll();
  
  activateTab(document.querySelector('[role="tab"]'), false);
}

function activateTab(tab, focus = true) {
  document.querySelectorAll('[role="tab"]').forEach(item => {
    const selected = item === tab;
    item.classList.toggle('active', selected);
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    const panel = document.getElementById(item.getAttribute('aria-controls'));
    panel.classList.toggle('active', selected);
    panel.hidden = !selected;
  });
  keyboardManager.setCurrentMode(tab.dataset.target);
  if (focus) tab.focus();
}

// イベント登録
document.addEventListener("DOMContentLoaded", () => {
  // インスタンス作成
  uiController = new UIController();
  keyboardManager = new KeyboardShortcutManager(uiController);
  themeManager = new ThemeManager();

  // 平文や埋め草を変えたら、前の暗号化を取り消す
  document.getElementById(CONFIG.DOM_IDS.PLAIN_TEXT).addEventListener("input", () => {
    uiController.clearEncryption(true);
  });
  document.querySelectorAll('input[name="filler"]').forEach(input => {
    input.addEventListener('change', () => uiController.clearEncryption(true));
  });

  // 暗号文入力時のチェック
  document.getElementById(CONFIG.DOM_IDS.CIPHER_INPUT).addEventListener("input", () => {
    uiController.clearDecryption(true);
  });

  // 暗号化モードのイベント
  document.getElementById(CONFIG.DOM_IDS.START_ENCRYPTION).addEventListener("click", () => {
    uiController.startEncryption(selectedFiller());
  });
  
  document.getElementById(CONFIG.DOM_IDS.NEXT_ROTATION).addEventListener("click", () => {
    uiController.nextRotationStep();
  });
  document.getElementById('encFirst').addEventListener('click', () => uiController.setEncryptionDone(0));
  document.getElementById('encPrev').addEventListener('click', () => {
    uiController.setEncryptionDone(uiController.state.encryption.done - 1);
  });
  document.getElementById('encLast').addEventListener('click', () => {
    const result = uiController.state.encryption.result;
    if (result) uiController.setEncryptionDone(result.stepCount);
  });
  document.getElementById('encHideCard').addEventListener('change', () => uiController.renderEncryption());

  // 復号化モードのイベント
  document.getElementById(CONFIG.DOM_IDS.START_DECRYPTION).addEventListener("click", () => {
    uiController.startDecryption();
  });
  
  document.getElementById(CONFIG.DOM_IDS.NEXT_DECRYPTION).addEventListener("click", () => {
    uiController.nextDecryptionStep();
  });
  document.getElementById('decFirst').addEventListener('click', () => uiController.setDecryptionDone(0));
  document.getElementById('decPrev').addEventListener('click', () => {
    uiController.setDecryptionDone(uiController.state.decryption.done - 1);
  });
  document.getElementById('decLast').addEventListener('click', () => {
    const result = uiController.state.decryption.result;
    if (result) uiController.setDecryptionDone(result.stepCount);
  });
  document.getElementById('decHideCard').addEventListener('change', () => uiController.renderDecryption());
  document.getElementById('reverseOutput').addEventListener('click', () => uiController.toggleDecryptionReverse());
  document.getElementById('copyRecovered').addEventListener('click', copyRecoveredText);

  document.getElementById('solveCipher').addEventListener('input', () => {
    uiController.clearSolveSearch();
    uiController.state.solve.blocks = [];
    uiController.renderSolve();
    const normalized = GrilleLogic.normalizeText(document.getElementById('solveCipher').value);
    uiController.updateFrequencyLink('solveFrequencyLink', GrilleLogic.formatGroups(normalized.letters));
  });
  document.getElementById('solveLoad').addEventListener('click', () => uiController.loadSolve());
  document.getElementById('solveBlock').addEventListener('change', event => {
    uiController.state.solve.blockIndex = Number(event.target.value);
    uiController.renderSolve();
  });
  document.getElementById('solveRotateKey').addEventListener('click', () => uiController.rotateSolveKey());
  document.getElementById('solveReverse').addEventListener('change', () => uiController.renderSolve());
  document.getElementById('solveLang').addEventListener('change', () => uiController.renderSolve());
  document.getElementById('solveSearch').addEventListener('click', () => uiController.startSolveSearch());
  document.getElementById('solveCancel').addEventListener('click', () => uiController.cancelSolveSearch());

  // その他のイベント
  document.getElementById(CONFIG.DOM_IDS.COPY_CIPHER).addEventListener("click", copyCipherText);
  document.getElementById('printGrille').addEventListener('click', () => {
    uiController.renderPrintSheet();
    document.getElementById('printTitle').textContent = t('print.title', {
      key: uiController.state.key,
      direction: t(`solve.direction.${uiController.state.direction}`)
    });
    window.print();
  });
  document.getElementById('copyShareUrl').addEventListener('click', async () => {
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') throw new Error('clipboard');
      await navigator.clipboard.writeText(currentShareUrl());
      uiController.showGrilleMessage(t('share.copied'), 'success');
    } catch (_error) {
      uiController.showGrilleMessage(t('copy.failed'), 'error');
    }
  });
  
  // テーマ切り替え
  document.getElementById(CONFIG.DOM_IDS.THEME_TOGGLE).addEventListener("click", () => {
    themeManager.toggleTheme();
  });

  // ヘルプモーダル
  const helpButton = document.getElementById(CONFIG.DOM_IDS.HELP_BUTTON);
  const shortcutHelpButton = document.getElementById("showShortcutHelp");
  const helpModal = document.getElementById(CONFIG.DOM_IDS.HELP_MODAL);
  const helpClose = document.getElementById(CONFIG.DOM_IDS.HELP_CLOSE);

  let helpReturnFocus = null;
  shortcutHelpButton.addEventListener("click", () => {
    helpReturnFocus = shortcutHelpButton;
    keyboardManager.showHelp();
  });
  helpButton.addEventListener("click", () => {
    helpReturnFocus = helpButton;
    helpModal.showModal();
    helpClose.focus();
  });

  helpClose.addEventListener("click", () => {
    helpModal.close();
  });

  helpModal.addEventListener("click", (e) => {
    if (e.target === helpModal) helpModal.close();
  });
  helpModal.addEventListener('close', () => {
    if (helpReturnFocus) helpReturnFocus.focus();
    helpReturnFocus = null;
  });

  // グリル生成
  initBaseMatrix();
  bindGrilleCreator();

  // タブ切り替え
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  tabs.forEach(tab => {
    tab.addEventListener('click', () => activateTab(tab, false));
    tab.addEventListener('keydown', event => {
      let index = tabs.indexOf(tab);
      if (event.key === 'ArrowRight') index = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') index = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') index = 0;
      else if (event.key === 'End') index = tabs.length - 1;
      else return;
      event.preventDefault();
      activateTab(tabs[index]);
    });
  });

  // 初期化
  resetAllModes();
  loadShareHash();

  const randomFillerOption = document.getElementById('fillerRandom');
  randomFillerOption.disabled = !globalThis.crypto || typeof globalThis.crypto.getRandomValues !== 'function';
  
  // キーボードショートカット初期モード設定
  keyboardManager.setCurrentMode('grille');
});
