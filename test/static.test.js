const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('pure files use classic scripts with CommonJS test exports', () => {
  for (const relative of ['js/grille-cipher-logic.js', 'js/messages.js', 'js/samples.js']) {
    const source = fs.readFileSync(path.join(root, relative), 'utf8');
    assert.match(source, /typeof module[^\n]+module\.exports/);
    assert.doesNotMatch(source, /\b(?:export|import)\s/);
  }
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
