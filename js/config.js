// Shared UI constants.

const CONFIG = Object.freeze({
  CSS_CLASSES: Object.freeze({
    NOTIFICATION: 'notification'
  }),
  DOM_IDS: Object.freeze({
    PLAIN_TEXT: 'plainText',
    START_ENCRYPTION: 'startEncryption',
    NEXT_ROTATION: 'nextRotation',
    CIPHER_TEXT: 'cipherText',
    COPY_CIPHER: 'copyCipher',
    ENCRYPT_NOTIFICATIONS: 'encrypt-notifications',
    CIPHER_INPUT: 'cipherInput',
    START_DECRYPTION: 'startDecryption',
    NEXT_DECRYPTION: 'nextDecryption',
    RECOVERED_TEXT: 'recoveredText',
    DECRYPT_NOTIFICATIONS: 'decrypt-notifications',
    THEME_TOGGLE: 'themeToggle',
    HELP_BUTTON: 'helpButton',
    HELP_MODAL: 'helpModal',
    HELP_CLOSE: 'helpModalClose'
  }),
  KEYBOARD_SHORTCUTS: Object.freeze({
    SPACE: 'Space',
    ENTER: 'Enter',
    ESCAPE: 'Escape',
    RIGHT: 'ArrowRight',
    LEFT: 'ArrowLeft',
    CTRL_C: 'KeyC'
  }),
  THEME: Object.freeze({
    LIGHT: 'light',
    DARK: 'dark',
    AUTO: 'auto',
    STORAGE_KEY: 'grille-cipher-theme',
    CSS_CLASS: 'dark-mode'
  }),
  LANG: Object.freeze({
    STORAGE_KEY: 'grille-cipher-lang',
    DEFAULT: 'ja',
    SUPPORTED: Object.freeze(['ja', 'en'])
  })
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
