// 画面に表示する文言の辞書

const GrilleMessages = (() => {
  const ja = Object.freeze({
    'key.length': '鍵は1〜4の数字を9個並べます（いまは{length}個）',
    'key.range': '鍵に使える数字は1〜4だけです',
    'pattern.size': '穴のパターンは6行×6文字で書きます（いまは{rows}行）',
    'pattern.char': '穴のパターンに使えない文字があります（{char}）。穴はX、穴でないマスは.で書きます',
    'pattern.orbit': 'このパターンは回転グリルになりません。穴が重なる組、または穴のない組が{count}組あります',
    'input.noLetters': '英字が1文字もありません',
    'input.tooLong': '長すぎます（英字{length}文字）。{max}文字までにしてください',
    'input.removed': '英字以外の{count}文字を取り除きました',
    'cipher.length': '暗号文は36文字の倍数にしてください（いまは{length}文字。あと{missing}文字）',
    'encrypt.padded': '36文字に足りない{count}文字ぶんを、埋め草で埋めました',
    'run.cleared': '入力が変わったので、進行を取り消しました',
    'copy.done': 'コピーしました',
    'copy.failed': 'コピーできませんでした。文字列を選択して手動でコピーしてください',
    'key.loaded': '鍵を読み込みました',
    'key.random': 'ランダムなグリルを作りました',
    'key.reset': '既定のグリルに戻しました',
    'pattern.loaded': '穴のパターンを読み込みました',
    'sample.loaded': '見本「{name}」を読み込みました。②暗号化と③復号の入力欄にも文を入れています',
    'matrix.label': '3×3の{row}行{col}列',
    'punch.label': '{row}行{col}列',
    'punch.hole': '{row}行{col}列（穴）',
    'encrypt.status': 'ブロック{block}/{blocks}・{turn}回目（{angle}°）・{placed}/{total}文字',
    'encrypt.status.start': 'ブロック1/{blocks}・開始前（0°）・0/{total}文字',
    'encrypt.status.done': 'ブロック{block}/{blocks}・完了（{angle}°）・{placed}/{total}文字',
    'encrypt.board': 'ブロック{block}/{blocks}、{turn}回目、型紙は{angle}度。いま書いた文字は{letters}',
    'encrypt.board.start': 'ブロック1/{blocks}、開始前。白紙に型紙を重ねています',
    'sample.book': '書籍の例（36文字）',
    'sample.sandorf': 'ヴェルヌ『Mathias Sandorf』（108文字・3ブロック）',
    'sample.short': '短い文（埋め草の例）',
    'sample.sandorf.note': '小説では、文を逆順にしてから暗号化しています。復号したら「逆順にする」を押すと読めます'
  });

  function format(lang, key, params = {}) {
    const dictionary = lang === 'ja' ? ja : null;
    if (!dictionary || !Object.prototype.hasOwnProperty.call(dictionary, key)) {
      throw new Error(`Unknown message key: ${lang}.${key}`);
    }
    return dictionary[key].replace(/\{([^}]+)\}/g, (_, name) => {
      if (!Object.prototype.hasOwnProperty.call(params, name)) {
        throw new Error(`Missing message parameter: ${key}.${name}`);
      }
      return String(params[name]);
    });
  }

  function t(key, params) {
    return format('ja', key, params);
  }

  return Object.freeze({ ja, format, t });
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GrilleMessages;
}
