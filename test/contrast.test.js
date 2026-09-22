const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');

function variables(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const block = css.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`));
  assert.ok(block, `missing ${selector}`);
  return Object.fromEntries([...block[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(match => [match[1], match[2].trim()]));
}

function hex(value) {
  const match = value.match(/^#([0-9a-f]{6})$/i);
  assert.ok(match, `not a hex color: ${value}`);
  return [0, 2, 4].map(index => Number.parseInt(match[1].slice(index, index + 2), 16));
}

function luminance(color) {
  const linear = color.map(channel => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function ratio(first, second) {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

function overlay(foreground, background, alpha) {
  return foreground.map((channel, index) => channel * alpha + background[index] * (1 - alpha));
}

function rgba(value) {
  const match = value.match(/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/);
  assert.ok(match, `not rgba: ${value}`);
  return { color: match.slice(1, 4).map(Number), alpha: Number(match[4]) };
}

test('light and dark theme variables meet contrast requirements', () => {
  const themes = [variables(':root'), variables('.dark-mode')];
  const textPairs = [
    ['--text-primary', '--bg-secondary'], ['--text-primary', '--bg-primary'],
    ['--text-secondary', '--bg-secondary'], ['--text-secondary', '--bg-tertiary'],
    ['--text-muted', '--bg-primary'], ['--text-muted', '--bg-tertiary'],
    ['--link', '--bg-primary'], ['--link', '--bg-secondary'],
    ['--btn-primary-text', '--btn-primary-bg'], ['--btn-primary-text', '--btn-primary-hover'],
    ['--btn-secondary-text', '--btn-secondary-bg'], ['--btn-disabled-text', '--btn-disabled-bg'],
    ['--text-primary', '--paper-bg'], ['--cell-fresh-text', '--cell-fresh'],
    ['--notification-error-text', '--notification-error-bg'],
    ['--notification-warning-text', '--notification-warning-bg'],
    ['--notification-success-text', '--notification-success-bg'],
    ['--notification-info-text', '--notification-info-bg']
  ];
  for (const theme of themes) {
    for (const [foreground, background] of textPairs) {
      assert.ok(ratio(hex(theme[foreground]), hex(theme[background])) >= 4.5, `${foreground} on ${background}`);
    }
    assert.ok(ratio(hex(theme['--hole-border']), hex(theme['--paper-bg'])) >= 3);
    const cover = rgba(theme['--card-cover']);
    const coveredText = overlay(cover.color, hex(theme['--text-primary']), cover.alpha);
    const coveredPaper = overlay(cover.color, hex(theme['--paper-bg']), cover.alpha);
    assert.ok(ratio(coveredText, coveredPaper) >= 4.5);
    assert.ok(ratio(hex(theme['--hole-border']), coveredPaper) >= 3);
  }
});

test('literal colors only appear in variable definitions, shadows, and the backdrop', () => {
  const withoutVariables = css.replace(/--[\w-]+\s*:\s*(?:#[0-9a-f]{3,8}|rgba?\([^;]+\))\s*;/gi, '');
  const withoutAllowed = withoutVariables
    .replace(/rgba\(0,\s*0,\s*0,[^)]+\)/gi, '')
    .replace(/dialog::backdrop\s*\{[\s\S]*?\}/gi, '');
  assert.doesNotMatch(withoutAllowed, /#[0-9a-f]{3,8}\b|rgb\(/i);
});
