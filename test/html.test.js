const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('security metadata and local classic resources are present', () => {
  const csp = html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i);
  assert.ok(csp);
  assert.doesNotMatch(csp[1], /frame-ancestors|unsafe-inline|https:/i);
  assert.match(html, /<meta\s+name="referrer"\s+content="no-referrer"/i);
  assert.match(html, /<meta\s+name="viewport"/i);
  assert.match(html, /<meta\s+name="color-scheme"\s+content="light dark"/i);
  assert.match(html, /<noscript>/i);
  assert.match(html, /<link\s+rel="icon"\s+type="image\/svg\+xml"\s+href="assets\/favicon\.svg"/i);
  assert.doesNotMatch(html, /\s(?:on[a-z]+|style)\s*=/i);
  assert.doesNotMatch(html, /<script[^>]+type="module"/i);
  assert.doesNotMatch(html, /<(?:script|link|img)\b[^>]+(?:src|href)="https?:\/\//i);
});

test('scripts load in the required dependency order', () => {
  const expected = [
    'config', 'grille-cipher-logic', 'ngram-models', 'grille-solver-logic', 'share', 'messages', 'samples', 'notification-system',
    'ui-controller', 'keyboard-shortcuts', 'theme-manager', 'main-refactored'
  ];
  const actual = [...html.matchAll(/<script\s+src="js\/([^"]+)\.js"/g)].map(match => match[1]);
  assert.deepEqual(actual, expected);
});

test('the required controls and accessible relationships exist', () => {
  const ids = [
    'baseMatrix', 'punchBoard', 'keyText', 'loadKey', 'randomKey', 'resetKey', 'directionCw',
    'directionCcw', 'patternText', 'loadPattern', 'copyPattern', 'sampleSelect', 'loadSample',
    'grille-notifications', 'plainText', 'fillerX', 'fillerRandom', 'startEncryption', 'encFirst',
    'encPrev', 'nextRotation', 'encLast', 'encryptionStatus', 'encryptionBoard', 'encHideCard',
    'cipherText', 'copyCipher', 'encrypt-notifications', 'cipherInput', 'startDecryption', 'decFirst',
    'decPrev', 'nextDecryption', 'decLast', 'decryptionStatus', 'decryptionBoard', 'decHideCard',
    'recoveredText', 'reverseOutput', 'copyRecovered', 'decrypt-notifications', 'helpButton',
    'themeToggle', 'showShortcutHelp', 'helpModal', 'helpModalClose', 'help-shortcuts', 'globalStatus',
    'solveCipher', 'solveLoad', 'solveBlock', 'solveBoard', 'solveReadout', 'solveSearch',
    'solveCancel', 'solveProgress', 'solveResults', 'solveLang', 'solveReverseScore',
    'printGrille', 'copyShareUrl', 'encryptFrequencyLink', 'solveFrequencyLink', 'printSheet',
    'printTitle', 'printStencil', 'printPaper'
  ];
  for (const id of ids) assert.match(html, new RegExp(`\\bid="${id}"`), id);
  assert.doesNotMatch(html, /\bid="(?:generateGrille|toast)"/);
  assert.match(html, /<dialog\b[^>]*\bid="helpModal"/i);
  assert.equal((html.match(/\brole="tablist"/g) || []).length, 1);
  const tabs = (html.match(/\brole="tab"/g) || []).length;
  assert.equal(tabs, 4);
  assert.equal((html.match(/\brole="tabpanel"/g) || []).length, tabs);
  for (const id of ['grille-notifications', 'encrypt-notifications', 'decrypt-notifications', 'solve-notifications']) {
    assert.match(html, new RegExp(`id="${id}"[^>]*role="status"`));
  }
});

test('textareas, external links, and Japanese terminology meet the contract', () => {
  const textareas = [...html.matchAll(/<textarea\b[^>]*>/gi)].map(match => match[0]);
  assert.ok(textareas.length >= 5);
  for (const textarea of textareas) {
    assert.match(textarea, /\bmaxlength="\d+"/i);
    assert.match(textarea, /\bspellcheck="false"/i);
  }
  for (const match of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/gi)) {
    assert.match(match[0], /rel="noopener noreferrer"/i);
  }
  assert.equal((html.match(/href="https:\/\/ipusiron\.github\.io\/frequency-analyzer\/"/g) || []).length, 2);
  assert.doesNotMatch(html, /fonts\.googleapis\.com|復号化|全ての/);
});
