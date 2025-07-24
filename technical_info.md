# 技術情報

---
## 🏗️ **アーキテクチャ設計**

---
### **1. モジュラー設計パターン**
```javascript
// 責務の明確な分離
class GrilleCipher {          // 純粋な暗号ロジック
  encrypt(), decrypt()        // ビジネスロジック層
}

class UIController {          // UI状態管理
  state: {...}               // 状態管理層  
  drawGrid(), animate()      // プレゼンテーション層
}

class NotificationSystem {    // ユーザーフィードバック
  error(), warning()         // インフラストラクチャ層
}
```

---
### **2. 状態管理パターン**
```javascript
// 集約された状態オブジェクト
state = {
  encryptionGrid: 6x6Array,    // 暗号化グリッド状態
  decryptionGrid: 6x6Array,    // 復号化グリッド状態  
  currentGrille: boolean[][],  // 現在のグリルパターン
  rotationCount: number,       // 回転カウンター
  // ... その他の状態
}
```

---
## 🎯 **技術的工夫**

---
### **1. 行列回転アルゴリズム**
```javascript
// 効率的な90度回転（転置→反転）
rotateMatrix(matrix, times) {
  let result = matrix.map(row => [...row]);
  for (let t = 0; t < times; t++) {
    result = result[0].map((_, i) => 
      result.map(row => row[i]).reverse()
    );
  }
  return result;
}
```

---
### **2. グリル生成アルゴリズム**
```javascript
// 3×3から6×6への効率的拡張
const offsets = [
  [0, 0],  // 0° → 左上
  [0, 3],  // 90° → 右上  
  [3, 3],  // 180° → 右下
  [3, 0]   // 270° → 左下
];
// 各回転で適切な位置にマッピング
```

---
### **3. アニメーション制御システム**
```javascript
// プロミスベースの非同期アニメーション
applyRotationAnimation(elementId, callback) {
  element.classList.add("rotate-animation");
  setTimeout(() => {
    element.classList.remove("rotate-animation");
    callback?.();
  }, 400);
}
```

---
### **4. バリデーション層**
```javascript
// 段階的検証システム
class ValidationHelper {
  static validateBaseMatrix(matrix) {
    // 1. 空値チェック → 2. 範囲チェック → 3. 完全性チェック
  }
  static validateTextLength(text, maxLength = 36) {
    // 文字数制限とグリッド容量の整合性確保
  }
}
```

---
## 🎨 **UI/UX実装技術**

---
### **1. CSS Grid + Animation**
```css
/* 6×6グリッドの動的レンダリング */
#encryptionGrid {
  display: grid;
  grid-template-columns: repeat(6, 40px);
  transform-origin: center center;  /* 中心基準回転 */
}

/* スムーズな回転アニメーション */
@keyframes rotateBoard {
  from { transform: rotate(0deg); }
  to { transform: rotate(90deg); }
}
```

---
### **2. 通知システム**
```javascript
// 型安全な通知システム
static show(message, type = 'info', containerId = null, duration = 4000) {
  // DOM注入攻撃防止 + 自動削除 + 型別スタイリング
}
```

---
## 🔧 **パフォーマンス最適化**

---
### **1. DOM操作最適化**
- **DocumentFragment使用**: バッチDOM更新
- **要素キャッシュ**: 頻繁アクセス要素の事前取得
- **イベント委譲**: 効率的なイベントハンドリング

---
### **2. メモリ管理**
- **状態のイミュータブル操作**: 副作用防止
- **適切なクリーンアップ**: イベントリスナー解除
- **配列コピー**: 参照による意図しない変更防止
