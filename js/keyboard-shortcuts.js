// Keyboard shortcuts shared by the three panels.

class KeyboardShortcutManager {
  constructor(uiController) {
    this.uiController = uiController;
    this.currentMode = 'grille';
    document.addEventListener('keydown', event => this.handleKeyDown(event));
  }

  handleKeyDown(event) {
    if (
      event.repeat || event.isComposing || event.altKey || event.metaKey ||
      document.querySelector('dialog[open]') ||
      event.target.closest?.('button, a, input, textarea, select, summary, [role="tab"], [contenteditable="true"]')
    ) {
      return;
    }

    if (event.ctrlKey && event.code === CONFIG.KEYBOARD_SHORTCUTS.CTRL_C) {
      this.copyCipher(event);
      return;
    }

    const actions = {
      [CONFIG.KEYBOARD_SHORTCUTS.ENTER]: () => this.start(),
      [CONFIG.KEYBOARD_SHORTCUTS.SPACE]: () => this.move('next'),
      [CONFIG.KEYBOARD_SHORTCUTS.RIGHT]: () => this.move('next'),
      [CONFIG.KEYBOARD_SHORTCUTS.LEFT]: () => this.move('previous'),
      [CONFIG.KEYBOARD_SHORTCUTS.ESCAPE]: () => this.move('first')
    };
    const action = actions[event.code];
    if (!action) return;
    event.preventDefault();
    action();
  }

  start() {
    const ids = { encrypt: 'startEncryption', decrypt: 'startDecryption' };
    const button = document.getElementById(ids[this.currentMode]);
    if (!button || button.disabled) return;
    button.click();
    const key = this.currentMode === 'encrypt' ? 'shortcut.encrypt.start' : 'shortcut.decrypt.start';
    showGlobalStatus(GrilleMessages.t(key));
  }

  move(direction) {
    const ids = {
      encrypt: { next: 'nextRotation', previous: 'encPrev', first: 'encFirst' },
      decrypt: { next: 'nextDecryption', previous: 'decPrev', first: 'decFirst' }
    };
    const button = document.getElementById(ids[this.currentMode]?.[direction]);
    if (!button || button.disabled) return;
    button.click();
    showGlobalStatus(GrilleMessages.t(`shortcut.${direction}`));
  }

  copyCipher(event) {
    const selection = window.getSelection();
    const button = document.getElementById('copyCipher');
    if (this.currentMode !== 'encrypt' || !selection || !selection.isCollapsed || button.disabled) return;
    event.preventDefault();
    button.click();
    showGlobalStatus(GrilleMessages.t('shortcut.copy'));
  }

  setCurrentMode(mode) {
    this.currentMode = mode;
  }

  showHelp() {
    const dialog = document.getElementById('helpModal');
    dialog.showModal();
    document.getElementById('help-shortcuts').focus();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = KeyboardShortcutManager;
}
