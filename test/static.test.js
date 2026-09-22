const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function stripStringsAndComments(source) {
  return stripComments(source).replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, '');
}

test('pure files use classic scripts with CommonJS test exports', () => {
  const pureFiles = [
    'js/grille-cipher-logic.js', 'js/grille-solver-logic.js', 'js/ngram-models.js',
    'js/share.js', 'js/messages.js', 'js/samples.js'
  ];
  for (const relative of pureFiles) {
    const source = fs.readFileSync(path.join(root, relative), 'utf8');
    assert.match(source, /typeof module[^\n]+module\.exports/);
    assert.doesNotMatch(source, /\b(?:export|import)\s/);
    const code = stripStringsAndComments(source);
    assert.doesNotMatch(code, /\b(?:document|window|navigator|localStorage|console|crypto)\b|\bfetch\s*\(/);
  }
});

test('browser scripts avoid unsafe and network-capable APIs', () => {
  const names = fs.readdirSync(path.join(root, 'js')).filter(name => name.endsWith('.js'));
  for (const name of names) {
    const source = fs.readFileSync(path.join(root, 'js', name), 'utf8');
    assert.doesNotMatch(
      source,
      /Math\.random|innerHTML|alert\s*\(|setAttribute\s*\(\s*['"]style|\.cssText|fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/,
      name
    );
    if (name !== 'messages.js') assert.doesNotMatch(stripComments(source), /[ぁ-んァ-ヶ一-龠]/, name);
  }
});

test('dynamic style writes are limited to board rotation and progress width', () => {
  const names = fs.readdirSync(path.join(root, 'js')).filter(name => name.endsWith('.js'));
  const source = names.map(name => fs.readFileSync(path.join(root, 'js', name), 'utf8')).join('\n');
  const properties = [...source.matchAll(/\.style\.([A-Za-z]+)/g)].map(match => match[1]);
  assert.ok(properties.length > 0);
  assert.deepEqual([...new Set(properties)].sort(), ['transform', 'width']);
  assert.doesNotMatch(source, /Object\.assign\s*\(\s*[^,]*\.style/);
});

test('retired classes are absent and resilient interactions remain', () => {
  const logic = fs.readFileSync(path.join(root, 'js', 'grille-cipher-logic.js'), 'utf8');
  const notifications = fs.readFileSync(path.join(root, 'js', 'notification-system.js'), 'utf8');
  const keyboard = fs.readFileSync(path.join(root, 'js', 'keyboard-shortcuts.js'), 'utf8');
  const theme = fs.readFileSync(path.join(root, 'js', 'theme-manager.js'), 'utf8');
  assert.doesNotMatch(logic, /class\s+GrilleCipher\b/);
  assert.doesNotMatch(notifications, /ValidationHelper|ErrorMessages/);
  assert.match(keyboard, /event\.repeat/);
  assert.match(keyboard, /isCollapsed/);
  assert.match(keyboard, /dialog\[open\]/);
  assert.match(theme, /\btry\s*\{/);
});

test('phase 2 stays single-threaded, derives views from pure state, and has print CSS', () => {
  const allJs = fs.readdirSync(path.join(root, 'js'))
    .filter(name => name.endsWith('.js'))
    .map(name => fs.readFileSync(path.join(root, 'js', name), 'utf8'))
    .join('\n');
  const controller = fs.readFileSync(path.join(root, 'js', 'ui-controller.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
  assert.doesNotMatch(allJs, /\bWorker\s*\(|importScripts\s*\(/);
  assert.doesNotMatch(allJs, /\bviewBase\b/);
  assert.doesNotMatch(controller, /['"]／['"]/);
  assert.match(css, /@media\s+print/);
  assert.match(css, /18mm/);
});

test('package and workflow stay dependency-free and run on Node 22', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.test, 'node --test');
  assert.equal('type' in pkg, false);
  assert.equal('dependencies' in pkg, false);
  assert.equal('devDependencies' in pkg, false);
  const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'test.yml'), 'utf8');
  assert.match(workflow, /push:/);
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /node-version:\s*22/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /contents:\s*read/);
});
