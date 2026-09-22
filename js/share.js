// Pure helpers for sharing a key and direction in the URL hash.

const GrilleShare = ((logic) => {
  function format(key, direction) {
    const parsed = logic.parseKey(key);
    if (!parsed.ok) throw new TypeError(parsed.errorKey);
    if (!logic.DIRECTIONS.includes(direction)) throw new TypeError('share.direction');
    return `#k=${parsed.key}&d=${direction}`;
  }

  function parse(hash) {
    const params = new URLSearchParams(String(hash).replace(/^#/, ''));
    const parsed = logic.parseKey(params.get('k') || '');
    if (!parsed.ok) return { ok: false, errorKey: parsed.errorKey };
    const direction = params.get('d') || 'cw';
    if (!logic.DIRECTIONS.includes(direction)) return { ok: false, errorKey: 'share.direction' };
    return { ok: true, key: parsed.key, direction };
  }

  return Object.freeze({ format, parse });
})(typeof GrilleLogic !== 'undefined' ? GrilleLogic : require('./grille-cipher-logic.js'));

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GrilleShare;
}
