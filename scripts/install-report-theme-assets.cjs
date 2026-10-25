/* Bundle the theme into assets already loaded by the original report template. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const normalize = value => value.replace(/\r\n/g, '\n');
function install(target, source, label, prepend) {
  const start = `/* BEGIN ${label} */`, end = `/* END ${label} */`;
  const file = path.join(root, target);
  let text = normalize(fs.readFileSync(file, 'utf8'));
  const first = text.indexOf(start), last = text.indexOf(end);
  if (first >= 0 || last >= 0) {
    if (first < 0 || last < first) throw new Error(`Broken theme bundle in ${target}`);
    text = text.slice(0, first) + text.slice(last + end.length).replace(/^\n/, '');
  }
  const bundle = start + '\n' + normalize(fs.readFileSync(path.join(root, source), 'utf8')).trimEnd() + '\n' + end + '\n';
  const output = prepend ? bundle + text : text.trimEnd() + '\n' + bundle;
  fs.writeFileSync(file, output);
}
install('assets/site.js', 'assets/report-theme.js', 'REPORT THEME BOOTSTRAP', true);
install('assets/style.css', 'assets/report-theme.css', 'REPORT THEME STYLES', false);
console.log('Installed automatic report-date themes in the original site.js and style.css.');
