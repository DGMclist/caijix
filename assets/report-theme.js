/* Publication date, never the visitor's clock. Run in <head> before styles. */
(() => {
  const root = document.documentElement;
  const value = document.querySelector('meta[name="report-date"]')?.content;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return;
  const date = new Date(value + 'T00:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return;
  const themes = [
    ['sunday', '#72F5D0'], ['monday', '#4568FF'],
    ['tuesday', '#FF7138'], ['wednesday', '#F45BAA'],
    ['thursday', '#C8F169'], ['friday', '#C47C60'], ['saturday', null]
  ];
  const [name, accent] = themes[date.getUTCDay()];
  root.dataset.reportTheme = name;
  root.dataset.reportDate = value;
  const rgb = (accent || '#b48ae5').match(/\w{2}/g).map(part => parseInt(part, 16));
  const mix = (target, amount) => '#' + rgb.map(channel =>
    Math.round(channel * (1 - amount) + target * amount).toString(16).padStart(2, '0')).join('');
  // Light, tonal badges on all seven days, including the original purple Saturday.
  const badges = {
    '--badge-top': mix(255, .64), '--badge-bottom': mix(255, .40),
    '--badge-a-top': mix(255, .56), '--badge-a-bottom': mix(255, .32),
    '--badge-rgb': rgb.join(', ')
  };
  for (const [key, color] of Object.entries(badges)) root.style.setProperty(key, color);
  // Saturday keeps the original page accents; only its badges receive the softer finish.
  if (!accent) return;
  const tokens = {
    '--glow': accent, '--glow-2': mix(0, .18), '--brand': mix(0, .34),
    '--deep': mix(0, .60), '--warm': mix(255, .22), '--hot': mix(255, .12),
    '--violet': mix(0, .12), '--theme-rgb': rgb.join(', '),
    '--line': `rgba(${rgb.join(', ')}, .10)`, '--line-2': `rgba(${rgb.join(', ')}, .20)`
  };
  for (const [key, color] of Object.entries(tokens)) root.style.setProperty(key, color);
})();
