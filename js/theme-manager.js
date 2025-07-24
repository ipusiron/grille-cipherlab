// テーマ管理システム

class ThemeManager {
  constructor() {
    this.currentTheme = CONFIG.THEME.LIGHT;
    this.systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    this.initTheme();
    this.initEventListeners();
  }

  // テーマの初期化
  initTheme() {
    // ローカルストレージから設定を読み込み
    const savedTheme = localStorage.getItem(CONFIG.THEME.STORAGE_KEY);
    
    if (savedTheme) {
      this.currentTheme = savedTheme;
    } else if (this.systemPrefersDark) {
      // システム設定がダークモードの場合
      this.currentTheme = CONFIG.THEME.DARK;
    }
    
    this.applyTheme(this.currentTheme);
    this.updateToggleButton();
  }

  // イベントリスナーの初期化
  initEventListeners() {
    // システムテーマ変更の監視
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      this.systemPrefersDark = e.matches;
      if (this.currentTheme === CONFIG.THEME.AUTO) {
        this.applyTheme(CONFIG.THEME.AUTO);
      }
    });
  }

  // テーマの適用
  applyTheme(theme) {
    const body = document.body;
    const isDark = theme === CONFIG.THEME.DARK || 
                   (theme === CONFIG.THEME.AUTO && this.systemPrefersDark);

    if (isDark) {
      body.classList.add(CONFIG.THEME.CSS_CLASS);
    } else {
      body.classList.remove(CONFIG.THEME.CSS_CLASS);
    }

    this.currentTheme = theme;
    
    // ローカルストレージに保存
    localStorage.setItem(CONFIG.THEME.STORAGE_KEY, theme);
    
    // カスタムイベントを発火
    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { theme: theme, isDark: isDark } 
    }));
  }

  // テーマの切り替え
  toggleTheme() {
    let nextTheme;
    
    switch (this.currentTheme) {
      case CONFIG.THEME.LIGHT:
        nextTheme = CONFIG.THEME.DARK;
        break;
      case CONFIG.THEME.DARK:
        nextTheme = CONFIG.THEME.AUTO;
        break;
      case CONFIG.THEME.AUTO:
        nextTheme = CONFIG.THEME.LIGHT;
        break;
      default:
        nextTheme = CONFIG.THEME.LIGHT;
    }
    
    this.applyTheme(nextTheme);
    this.updateToggleButton();
    this.showThemeFeedback(nextTheme);
  }

  // トグルボタンの更新
  updateToggleButton() {
    const toggleButton = document.getElementById(CONFIG.DOM_IDS.THEME_TOGGLE);
    if (!toggleButton) return;

    const { icon, title } = this.getThemeDisplayInfo(this.currentTheme);
    toggleButton.innerHTML = icon;
    toggleButton.title = title;
  }

  // テーマ表示情報の取得
  getThemeDisplayInfo(theme) {
    switch (theme) {
      case CONFIG.THEME.LIGHT:
        return { 
          icon: '☀️', 
          title: 'ライトモード（クリックでダークモードに切り替え）' 
        };
      case CONFIG.THEME.DARK:
        return { 
          icon: '🌙', 
          title: 'ダークモード（クリックで自動モードに切り替え）' 
        };
      case CONFIG.THEME.AUTO:
        return { 
          icon: '🔄', 
          title: 'システム連動（クリックでライトモードに切り替え）' 
        };
      default:
        return { icon: '☀️', title: 'ライトモード' };
    }
  }

  // テーマ切り替えフィードバック
  showThemeFeedback(theme) {
    const messages = {
      [CONFIG.THEME.LIGHT]: '☀️ ライトモードに切り替えました',
      [CONFIG.THEME.DARK]: '🌙 ダークモードに切り替えました',
      [CONFIG.THEME.AUTO]: '🔄 システム連動モードに切り替えました'
    };

    this.showFeedback(messages[theme] || 'テーマを切り替えました');
  }

  // フィードバック表示
  showFeedback(message) {
    // 既存のフィードバックを削除
    const existingFeedback = document.querySelector('.theme-feedback');
    if (existingFeedback) {
      existingFeedback.remove();
    }

    // フィードバック要素を作成
    const feedback = document.createElement('div');
    feedback.className = 'theme-feedback';
    feedback.textContent = message;
    
    // スタイルを設定
    Object.assign(feedback.style, {
      position: 'fixed',
      top: '20px',
      left: '20px',
      background: 'var(--feedback-bg, rgba(0, 0, 0, 0.8))',
      color: 'var(--feedback-text, white)',
      padding: '0.5em 1em',
      borderRadius: '6px',
      fontSize: '0.9em',
      zIndex: '10000',
      animation: 'fadeInOut 2s ease-in-out forwards'
    });

    document.body.appendChild(feedback);

    // 自動削除
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.remove();
      }
    }, 2000);
  }

  // 現在のテーマを取得
  getCurrentTheme() {
    return this.currentTheme;
  }

  // ダークモードかどうかを判定
  isDarkMode() {
    return this.currentTheme === CONFIG.THEME.DARK || 
           (this.currentTheme === CONFIG.THEME.AUTO && this.systemPrefersDark);
  }

  // テーマ情報を取得
  getThemeInfo() {
    return {
      current: this.currentTheme,
      isDark: this.isDarkMode(),
      systemPrefersDark: this.systemPrefersDark
    };
  }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}