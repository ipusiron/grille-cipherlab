// Theme selection with a system-following default.

class ThemeManager {
  constructor() {
    this.media = window.matchMedia('(prefers-color-scheme: dark)');
    this.currentTheme = this.readTheme();
    this.applyTheme(this.currentTheme, false);
    this.media.addEventListener('change', () => {
      if (this.currentTheme === CONFIG.THEME.AUTO) this.applyTheme(CONFIG.THEME.AUTO, false);
    });
  }

  readTheme() {
    try {
      const value = localStorage.getItem(CONFIG.THEME.STORAGE_KEY);
      if ([CONFIG.THEME.LIGHT, CONFIG.THEME.DARK, CONFIG.THEME.AUTO].includes(value)) return value;
    } catch (_error) {
      return CONFIG.THEME.AUTO;
    }
    return CONFIG.THEME.AUTO;
  }

  saveTheme(theme) {
    try {
      localStorage.setItem(CONFIG.THEME.STORAGE_KEY, theme);
    } catch (_error) {
      return false;
    }
    return true;
  }

  applyTheme(theme, save) {
    this.currentTheme = theme;
    document.body.classList.toggle(CONFIG.THEME.CSS_CLASS, this.isDarkMode());
    if (save) this.saveTheme(theme);
    this.updateToggleButton();
  }

  toggleTheme() {
    const order = [CONFIG.THEME.LIGHT, CONFIG.THEME.DARK, CONFIG.THEME.AUTO];
    const next = order[(order.indexOf(this.currentTheme) + 1) % order.length];
    this.applyTheme(next, true);
    showGlobalStatus(GrilleMessages.t(`theme.${next}.changed`));
  }

  updateToggleButton() {
    const button = document.getElementById(CONFIG.DOM_IDS.THEME_TOGGLE);
    const icons = { light: '☀️', dark: '🌙', auto: '🔄' };
    button.textContent = icons[this.currentTheme];
    button.title = GrilleMessages.t(`theme.${this.currentTheme}.title`);
    button.setAttribute('aria-label', GrilleMessages.t(`theme.${this.currentTheme}.label`));
  }

  isDarkMode() {
    return this.currentTheme === CONFIG.THEME.DARK ||
      (this.currentTheme === CONFIG.THEME.AUTO && this.media.matches);
  }

  getCurrentTheme() {
    return this.currentTheme;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}
