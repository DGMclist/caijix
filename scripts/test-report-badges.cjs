const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const script = fs.readFileSync(path.join(__dirname, '../assets/report-theme.js'), 'utf8');
const expected = [
  ['2026-10-26', 'monday', '#4568FF'], ['2026-10-27', 'tuesday', '#FF7138'],
  ['2026-10-28', 'wednesday', '#F45BAA'], ['2026-10-29', 'thursday', '#C8F169'],
  ['2026-10-30', 'friday', '#C47C60'], ['2026-10-31', 'saturday', undefined],
  ['2026-11-01', 'sunday', '#72F5D0']
];
function run(day) {
  const tokens = {}, root = { dataset: {}, style: { setProperty: (key, value) => tokens[key] = value } };
  vm.runInNewContext(script, { document: { documentElement: root, querySelector: () => ({ content: day }) } });
  return { tokens, root };
}
function luminance(hex) {
  return hex.slice(1).match(/../g).map(x => parseInt(x, 16) / 255)
    .map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4)
    .reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
}
let minimum = Infinity;
for (const [day, theme, accent] of expected) {
  const { tokens, root } = run(day);
  assert.equal(root.dataset.reportTheme, theme);
  assert.equal(tokens['--glow'], accent);
  for (const key of ['--badge-top', '--badge-bottom', '--badge-a-top', '--badge-a-bottom']) {
    assert.match(tokens[key], /^#[0-9a-f]{6}$/);
    const contrast = (luminance(tokens[key]) + .05) / (luminance('#24212f') + .05);
    assert(contrast >= 4.5, `${theme} ${key} has insufficient text contrast`);
    minimum = Math.min(minimum, contrast);
  }
}
for (const invalid of [undefined, '', '2026-02-30', '2026-13-01', '10/26/2026']) {
  const { tokens, root } = run(invalid);
  assert.deepEqual(tokens, {});
  assert.equal(root.dataset.reportTheme, undefined);
}
console.log(`PASS seven date-based palettes, Saturday page accents, invalid-date fallback; minimum badge contrast ${minimum.toFixed(2)}:1.`);
