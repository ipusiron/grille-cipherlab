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

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NotificationSystem };
}
