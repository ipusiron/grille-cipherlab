const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const CONFIG = require('../js/config.js');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js', 'theme-init.js'), 'utf8');

// Run theme-init.js in a fake window and report whether dark-mode was added to <html>.
function run({ saved = null, prefersDark = false, storageThrows = false } = {}) {
  const classes = new Set();
  const keys = [];
  const window = {
    localStorage: {
      getItem: key => {
        keys.push(key);
        if (storageThrows) throw new Error('blocked');
        return saved;
      }
    },
    matchMedia: () => ({ matches: prefersDark }),
    document: { documentElement: { classList: { add: name => classes.add(name) } } }
  };
  vm.runInNewContext(source, { window });
  return { dark: classes.has(CONFIG.THEME.CSS_CLASS), keys };
}

test('without a stored choice the theme follows the OS', () => {
  assert.equal(run({ prefersDark: true }).dark, true);
  assert.equal(run({ prefersDark: false }).dark, false);
});

test('a stored light or dark choice wins over the OS', () => {
  assert.equal(run({ saved: 'light', prefersDark: true }).dark, false);
  assert.equal(run({ saved: 'dark', prefersDark: false }).dark, true);
});

test('auto and unknown stored values follow the OS', () => {
  assert.equal(run({ saved: 'auto', prefersDark: true }).dark, true);
  assert.equal(run({ saved: 'auto', prefersDark: false }).dark, false);
  assert.equal(run({ saved: 'blue', prefersDark: true }).dark, true);
  assert.equal(run({ saved: 'blue', prefersDark: false }).dark, false);
});

test('blocked storage does not throw and the OS setting applies', () => {
  assert.equal(run({ storageThrows: true, prefersDark: true }).dark, true);
  assert.equal(run({ storageThrows: true, prefersDark: false }).dark, false);
});

test('the storage key and class match CONFIG.THEME', () => {
  assert.deepEqual(run().keys, [CONFIG.THEME.STORAGE_KEY]);
  assert.equal(CONFIG.THEME.CSS_CLASS, 'dark-mode');
  const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
  assert.match(css, /^\.dark-mode\s*\{/m);
});

test('index.html loads theme-init.js synchronously in <head> after the stylesheet', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const head = html.slice(0, html.indexOf('</head>'));
  assert.ok(head.includes('<script src="js/theme-init.js"></script>'), 'theme-init.js is not in <head>');
  assert.ok(head.indexOf('style.css') < head.indexOf('js/theme-init.js'));
});

test('theme-manager.js toggles the class on <html>, matching theme-init.js', () => {
  const manager = fs.readFileSync(path.join(root, 'js', 'theme-manager.js'), 'utf8');
  assert.match(manager, /document\.documentElement\.classList\.toggle\(CONFIG\.THEME\.CSS_CLASS/);
  assert.doesNotMatch(manager, /document\.body\.classList/);
});
