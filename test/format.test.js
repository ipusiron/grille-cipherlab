const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function filesUnder(directory, extension) {
  return fs.readdirSync(path.join(root, directory), { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith(extension))
    .map(entry => path.join(directory, entry.name));
}

test('source files stay readable and within line-length limits', () => {
  const files = [
    ...filesUnder('js', '.js'), ...filesUnder('test', '.js'),
    'style.css', 'index.html'
  ];
  for (const relative of files) {
    const lines = fs.readFileSync(path.join(root, relative), 'utf8').split(/\r?\n/);
    const limit = relative === 'index.html' ? 250 : 160;
    lines.forEach((line, index) => assert.ok(line.length <= limit, `${relative}:${index + 1} is ${line.length} characters`));
    assert.ok(lines.filter(line => line.trim()).length > 10, `${relative} appears minified`);
  }
});

test('major files retain explanatory structure', () => {
  const minimums = {
    'index.html': 150,
    'style.css': 350,
    'js/ui-controller.js': 250,
    'js/grille-cipher-logic.js': 200,
    'js/messages.js': 60
  };
  for (const [relative, minimum] of Object.entries(minimums)) {
    const count = fs.readFileSync(path.join(root, relative), 'utf8').split(/\r?\n/).length;
    assert.ok(count >= minimum, `${relative} has ${count} lines; expected at least ${minimum}`);
  }
});
