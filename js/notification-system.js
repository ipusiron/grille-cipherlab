// 統一された通知システム

class NotificationSystem {
  static show(message, type = 'info', containerId = null, duration = null) {
    // デフォルト期間を設定から取得
    if (duration === null) {
      duration = CONFIG.NOTIFICATION_DURATION[type.toUpperCase()] || CONFIG.NOTIFICATION_DURATION.INFO;
    }
    // 既存の通知をクリア
    if (containerId) {
      this.clear(containerId);
    }
    
    const notification = document.createElement('div');
    notification.className = `${CONFIG.CSS_CLASSES.NOTIFICATION} ${CONFIG.CSS_CLASSES.NOTIFICATION}-${type}`;
    notification.textContent = message;
    
    // 通知コンテナを取得または作成
    let container;
    if (containerId) {
      container = document.getElementById(containerId);
      if (!container) {
        console.warn(`Container with id '${containerId}' not found`);
        container = document.body;
      }
    } else {
      container = document.body;
    }
    
    container.appendChild(notification);
    
    // 自動削除（durationが0の場合は手動削除のみ）
    if (duration > 0) {
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, duration);
    }
    
    return notification;
  }
  
  static error(message, containerId = null, duration = 5000) {
    return this.show(message, 'error', containerId, duration);
  }
  
  static warning(message, containerId = null, duration = 4000) {
    return this.show(message, 'warning', containerId, duration);
  }
  
  static success(message, containerId = null, duration = 3000) {
    return this.show(message, 'success', containerId, duration);
  }
  
  static info(message, containerId = null, duration = 4000) {
    return this.show(message, 'info', containerId, duration);
  }
  
  static clear(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      const notifications = container.querySelectorAll('.notification');
      notifications.forEach(notification => notification.remove());
    }
  }
  
  static clearAll() {
    const notifications = document.querySelectorAll('.notification');
    notifications.forEach(notification => notification.remove());
  }
}

// エラーの種類とメッセージの定義
class ErrorMessages {
  static GRILLE_NOT_GENERATED = "先にグリルを生成してください";
  static EMPTY_PLAINTEXT = "平文を入力してください";
  static EMPTY_CIPHERTEXT = "暗号文を入力してください";
  static INVALID_MATRIX = "3×3マトリクスの値が正しくありません";
  static DUPLICATE_VALUES = "マトリクスに重複する値があります";
  static MISSING_VALUES = "1〜4の値がすべて含まれている必要があります";
  static TEXT_TOO_LONG = "テキストが長すぎます（最大36文字）";
  static GRILLE_GENERATION_SUCCESS = "グリルが正常に生成されました";
  static ENCRYPTION_COMPLETE = "暗号化が完了しました";
  static DECRYPTION_COMPLETE = "復号化が完了しました";
}

// バリデーションヘルパー
class ValidationHelper {
  static validateBaseMatrix(matrix) {
    const errors = [];
    const flatValues = matrix.flat();
    
    // 空値チェック
    if (flatValues.some(val => !val || val < 1 || val > 4)) {
      errors.push(ErrorMessages.INVALID_MATRIX);
      return errors;
    }
    
    // 重複チェック
    const counts = {};
    flatValues.forEach(val => {
      counts[val] = (counts[val] || 0) + 1;
    });
    
    // 各値が適切な回数出現しているかチェック
    // 完全なローテーティンググリルには各値が2〜3回必要
    for (let i = 1; i <= 4; i++) {
      if (!counts[i]) {
        errors.push(ErrorMessages.MISSING_VALUES);
        break;
      }
    }
    
    return errors;
  }
  
  static validateTextLength(text, maxLength = 36) {
    const normalizedText = text.toUpperCase().replace(/[^A-Z]/g, '');
    if (normalizedText.length > maxLength) {
      return [`テキストが長すぎます（現在: ${normalizedText.length}文字、最大: ${maxLength}文字）`];
    }
    return [];
  }
  
  static validateNotEmpty(text, fieldName) {
    if (!text || text.trim() === '') {
      return [`${fieldName}を入力してください`];
    }
    return [];
  }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NotificationSystem, ErrorMessages, ValidationHelper };
}