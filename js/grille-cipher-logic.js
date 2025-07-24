// グリル暗号の純粋なロジック部分

class GrilleCipher {
  constructor() {
    this.GRILLE_SIZE = CONFIG.GRILLE_SIZE;
    this.BASE_SIZE = CONFIG.BASE_SIZE;
    this.ROTATION_COUNT = CONFIG.ROTATION_COUNT;
  }

  // テキストの正規化（大文字のアルファベットのみ）
  normalizeText(text) {
    return text.toUpperCase().replace(/[^A-Z]/g, '');
  }

  // 行列の回転（90度 × times回）
  rotateMatrix(matrix, times = 1) {
    let result = matrix.map(row => [...row]);
    for (let t = 0; t < times; t++) {
      result = result[0].map((_, i) => result.map(row => row[i]).reverse());
    }
    return result;
  }

  // 3×3ベース行列から6×6グリルを生成
  generateGrille(base3x3) {
    const grille6x6 = Array.from({ length: this.GRILLE_SIZE }, () => 
      Array(this.GRILLE_SIZE).fill(false)
    );
    
    const offsets = [
      [0, 0],  // 0° → 左上
      [0, 3],  // 90° → 右上
      [3, 3],  // 180° → 右下
      [3, 0]   // 270° → 左下
    ];

    for (let rotation = 0; rotation < this.ROTATION_COUNT; rotation++) {
      const rotated = this.rotateMatrix(base3x3, rotation);
      const [rowOffset, colOffset] = offsets[rotation];
      
      for (let r = 0; r < this.BASE_SIZE; r++) {
        for (let c = 0; c < this.BASE_SIZE; c++) {
          if (rotated[r][c] === rotation + 1) {
            grille6x6[rowOffset + r][colOffset + c] = true;
          }
        }
      }
    }
    
    return grille6x6;
  }

  // グリルを90度回転
  rotateGrille90(grille) {
    const size = grille.length;
    const newGrille = Array.from({ length: size }, () => Array(size).fill(false));
    
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grille[r][c]) {
          newGrille[c][size - 1 - r] = true;
        }
      }
    }
    
    return newGrille;
  }

  // 現在の回転角度でのグリルの穴の位置を取得
  getGrilleHoles(grille, rotationCount) {
    let currentGrille = grille;
    for (let i = 0; i < rotationCount % this.ROTATION_COUNT; i++) {
      currentGrille = this.rotateGrille90(currentGrille);
    }
    
    const holes = [];
    for (let r = 0; r < this.GRILLE_SIZE; r++) {
      for (let c = 0; c < this.GRILLE_SIZE; c++) {
        if (currentGrille[r][c]) {
          holes.push([r, c]);
        }
      }
    }
    return holes;
  }

  // 暗号化
  encrypt(plaintext, grille) {
    const normalizedText = this.normalizeText(plaintext);
    const chars = normalizedText.split('');
    const grid = Array.from({ length: this.GRILLE_SIZE }, () => 
      Array(this.GRILLE_SIZE).fill('')
    );
    
    let charIndex = 0;
    let currentGrille = grille;
    
    // 4回転で全ての位置を埋める
    for (let rotation = 0; rotation < this.ROTATION_COUNT; rotation++) {
      const holes = this.getGrilleHoles(grille, rotation);
      
      for (const [r, c] of holes) {
        if (charIndex < chars.length && grid[r][c] === '') {
          grid[r][c] = chars[charIndex++];
        }
      }
    }
    
    // グリッドから暗号文を読み出し（行順）
    let ciphertext = '';
    for (let r = 0; r < this.GRILLE_SIZE; r++) {
      for (let c = 0; c < this.GRILLE_SIZE; c++) {
        ciphertext += grid[r][c];
      }
    }
    
    return {
      ciphertext,
      grid,
      usedChars: charIndex
    };
  }

  // 復号化
  decrypt(ciphertext, grille) {
    const normalizedCipher = this.normalizeText(ciphertext);
    const grid = Array.from({ length: this.GRILLE_SIZE }, () => 
      Array(this.GRILLE_SIZE).fill('')
    );
    
    // 暗号文をグリッドに配置（行順）
    let index = 0;
    for (let r = 0; r < this.GRILLE_SIZE; r++) {
      for (let c = 0; c < this.GRILLE_SIZE; c++) {
        if (index < normalizedCipher.length) {
          grid[r][c] = normalizedCipher[index++];
        }
      }
    }
    
    // グリルを回転させながら文字を読み出し
    let plaintext = '';
    for (let rotation = 0; rotation < this.ROTATION_COUNT; rotation++) {
      const holes = this.getGrilleHoles(grille, rotation);
      
      for (const [r, c] of holes) {
        if (grid[r][c]) {
          plaintext += grid[r][c];
        }
      }
    }
    
    return {
      plaintext,
      grid
    };
  }

  // ステップバイステップの暗号化（UI表示用）
  encryptStep(chars, grid, grille, rotationCount) {
    const holes = this.getGrilleHoles(grille, rotationCount);
    let filled = 0;
    const filledPositions = [];
    
    for (const [r, c] of holes) {
      if (grid[r][c] === '' && chars.length > 0) {
        grid[r][c] = chars.shift();
        filledPositions.push([r, c]);
        filled++;
      }
    }
    
    return {
      filled,
      filledPositions,
      remainingChars: chars.length,
      grid: grid.map(row => [...row]) // コピーを返す
    };
  }

  // ステップバイステップの復号化（UI表示用）
  decryptStep(grid, grille, rotationCount) {
    const holes = this.getGrilleHoles(grille, rotationCount);
    let chars = '';
    
    for (const [r, c] of holes) {
      if (grid[r][c]) {
        chars += grid[r][c];
      }
    }
    
    return {
      chars,
      holes
    };
  }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GrilleCipher;
}