const test = require('node:test');
const assert = require('node:assert/strict');
const share = require('../js/share.js');

test('URL hashes parse according to the documented key rules', () => {
  const cases = [
    ['#k=241143322&d=cw', { ok: true, key: '241143322', direction: 'cw' }],
    ['#k=213324231&d=ccw', { ok: true, key: '213324231', direction: 'ccw' }],
    ['#k=241143322', { ok: true, key: '241143322', direction: 'cw' }],
    ['#k=24114332&d=cw', { ok: false, errorKey: 'key.length' }],
    ['#k=241143325&d=cw', { ok: false, errorKey: 'key.range' }],
    ['#k=241143322&d=up', { ok: false, errorKey: 'share.direction' }],
    ['#d=cw', { ok: false, errorKey: 'key.length' }],
    ['', { ok: false, errorKey: 'key.length' }],
    ['#k=2411%2043322&d=cw', { ok: true, key: '241143322', direction: 'cw' }]
  ];
  for (const [hash, expected] of cases) assert.deepEqual(share.parse(hash), expected);
});

test('URL hashes format keys and directions without plaintext', () => {
  assert.equal(share.format('241143322', 'cw'), '#k=241143322&d=cw');
  assert.equal(share.format('213324231', 'ccw'), '#k=213324231&d=ccw');
});
