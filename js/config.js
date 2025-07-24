// Grille CipherLab 統一設定ファイル

const CONFIG = {
  // グリル関連設定
  GRILLE_SIZE: 6,           // 6×6グリル
  BASE_SIZE: 3,             // 3×3ベースマトリクス
  ROTATION_COUNT: 4,        // 4回転（0°, 90°, 180°, 270°）
  
  // UI設定
  CELL_SIZE: 40,            // セルサイズ（px）
  GRID_GAP: 4,              // グリッド間隔（px）
  
  // アニメーション設定
  ANIMATION_DURATION: 400,  // 回転アニメーション時間（ms）
  HIGHLIGHT_DURATION: 400,  // セルハイライト時間（ms）
  
  // 通知設定
  NOTIFICATION_DURATION: {
    ERROR: 5000,    // エラー通知表示時間（ms）
    WARNING: 4000,  // 警告通知表示時間（ms）
    SUCCESS: 3000,  // 成功通知表示時間（ms）
    INFO: 4000      // 情報通知表示時間（ms）
  },
  
  // テキスト制限
  MAX_TEXT_LENGTH: 36,      // 最大テキスト長（6×6グリッドの容量）
  
  // 入力制限
  MATRIX_VALUE_MIN: 1,      // マトリクス値の最小値
  MATRIX_VALUE_MAX: 4,      // マトリクス値の最大値
  
  // デフォルト値
  DEFAULT_PLAINTEXT: "HAPPY HOLIDAYS FROM THE HUNTINGTON FAMILY",
  DEFAULT_BASE_MATRIX: [
    [2, 4, 1],
    [1, 4, 3],
    [3, 2, 2]
  ],
  
  // CSS クラス名
  CSS_CLASSES: {
    CELL: 'cell',
    CELL_HOLE: 'cell-hole',
    CELL_FADED: 'cell-faded',
    CELL_ROTATED: 'cell-rotated',
    ROTATE_ANIMATION: 'rotate-animation',
    HIGHLIGHT_ONCE: 'highlight-once',
    NOTIFICATION: 'notification',
    NOTIFICATION_ERROR: 'notification-error',
    NOTIFICATION_WARNING: 'notification-warning',
    NOTIFICATION_SUCCESS: 'notification-success',
    NOTIFICATION_INFO: 'notification-info'
  },
  
  // DOM要素ID
  DOM_IDS: {
    // グリル作成
    BASE_MATRIX: 'baseMatrix',
    GENERATE_GRILLE: 'generateGrille',
    GRILLE_PREVIEW: 'grillePreview',
    GRILLE_NOTIFICATIONS: 'grille-notifications',
    
    // 暗号化
    PLAIN_TEXT: 'plainText',
    START_ENCRYPTION: 'startEncryption',
    NEXT_ROTATION: 'nextRotation',
    ROTATION_LABEL: 'rotationLabel',
    ENCRYPTION_GRID: 'encryptionGrid',
    CIPHER_TEXT: 'cipherText',
    COPY_CIPHER: 'copyCipher',
    ENCRYPT_NOTIFICATIONS: 'encrypt-notifications',
    
    // 暗号化進捗表示
    ENCRYPTION_PROGRESS: 'encryptionProgress',
    ENCRYPTION_STEP_INFO: 'encryptionStepInfo',
    ENCRYPTION_CHAR_INFO: 'encryptionCharInfo',
    ENCRYPTION_PROGRESS_BAR: 'encryptionProgressBar',
    ENCRYPTION_NEXT_INFO: 'encryptionNextInfo',
    
    // 復号化
    CIPHER_INPUT: 'cipherInput',
    START_DECRYPTION: 'startDecryption',
    NEXT_DECRYPTION: 'nextDecryption',
    DECRYPTION_ROTATION_LABEL: 'decryptionRotationLabel',
    DECRYPTION_GRID: 'decryptionGrid',
    RECOVERED_TEXT: 'recoveredText',
    DECRYPT_NOTIFICATIONS: 'decrypt-notifications',
    
    // 復号化進捗表示
    DECRYPTION_PROGRESS: 'decryptionProgress',
    DECRYPTION_STEP_INFO: 'decryptionStepInfo',
    DECRYPTION_CHAR_INFO: 'decryptionCharInfo',
    DECRYPTION_PROGRESS_BAR: 'decryptionProgressBar',
    DECRYPTION_NEXT_INFO: 'decryptionNextInfo',
    
    // 共通
    TOAST: 'toast'
  },
  
  // 回転角度
  ROTATION_ANGLES: [0, 90, 180, 270],
  
  // グリル生成用オフセット
  GRILLE_OFFSETS: [
    [0, 0],  // 0° → 左上
    [0, 3],  // 90° → 右上
    [3, 3],  // 180° → 右下
    [3, 0]   // 270° → 左下
  ],
  
  // 入力スタイル（数値入力フィールド用）
  INPUT_STYLES: {
    width: '50px',
    height: '50px',
    textAlign: 'center',
    fontSize: '18px',
    border: '2px solid #ccc',
    borderRadius: '6px'
  }
};

// 設定の読み取り専用化（変更を防ぐ）
Object.freeze(CONFIG);
Object.freeze(CONFIG.NOTIFICATION_DURATION);
Object.freeze(CONFIG.DEFAULT_BASE_MATRIX);
Object.freeze(CONFIG.CSS_CLASSES);
Object.freeze(CONFIG.DOM_IDS);
Object.freeze(CONFIG.ROTATION_ANGLES);
Object.freeze(CONFIG.GRILLE_OFFSETS);
Object.freeze(CONFIG.INPUT_STYLES);

// グローバルスコープに設定を公開
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}

// モジュールとしてもエクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}