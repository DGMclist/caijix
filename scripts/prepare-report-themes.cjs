/* Run after the external publisher writes HTML, before deploying gh-pages. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
    entry.name.startsWith('.') ? [] : entry.isDirectory() ? walk(path.join(dir, entry.name)) :
      entry.name.endsWith('.html') ? [path.join(dir, entry.name)] : []);
}
// Validate every page before writing any of them.
const updates = walk(root).map(file => {
  let html = fs.readFileSync(file, 'utf8');
  const data = html.match(/<script\b[^>]*\bid="share-data"[^>]*>([\s\S]*?)<\/script>/);
  if (!data) throw new Error(`${file}: missing publisher share-data; supply report-date explicitly in the template`);
  const day = JSON.parse(data[1]).meta?.day;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day || '') ||
      !Number.isFinite(Date.parse(day + 'T00:00:00Z')) ||
      new Date(day + 'T00:00:00Z').toISOString().slice(0, 10) !== day)
    throw new Error(`${file}: invalid publication day`);
  const canonicalTag = html.match(/<link\b(?=[^>]*rel="canonical")[^>]*>/)?.[0] || '';
  const canonical = canonicalTag.match(/href="\/caijix\/radar\/(\d{4}-\d{2}-\d{2})\/"/);
  if (!canonical || canonical[1] !== day) throw new Error(`${file}: canonical and publication day disagree`);
  html = html.replace(/<meta\b[^>]*name="report-date"[^>]*>\r?\n?/g, '')
    .replace(/<script src="\/caijix\/assets\/report-theme.js"><\/script>\r?\n?/g, '')
    .replace(/<link href="\/caijix\/assets\/report-theme.css" rel="stylesheet"\/>\r?\n?/g, '');
  html = html.replace(/<head>\r?\n?/, `<head>\n<meta name="report-date" content="${day}"/>\n<script src="/caijix/assets/report-theme.js"></script>\n`)
    .replace('</head>', '<link href="/caijix/assets/report-theme.css" rel="stylesheet"/>\n</head>');
  return [file, html];
});
require('./install-report-theme-assets.cjs');
for (const [file, html] of updates) fs.writeFileSync(file, html);
console.log(`Prepared ${updates.length} report pages from publisher meta.day.`);
