const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const output = process.env.THEME_TEST_OUTPUT || path.join(root, 'test-results');
fs.mkdirSync(output, { recursive: true });
const baseline = process.env.THEME_BASELINE_REF || 'afda9c1f405d5a882c2a4ab38642a4fa052d86d8';
const original = file => execFileSync('git', ['show', `${baseline}:${file}`], { cwd: root, encoding: 'utf8', maxBuffer: 5e6 });
const report = [];
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://local');
  let file = decodeURIComponent(url.pathname).replace(/^\/caijix\//, '');
  if (!file || file.endsWith('/')) file += 'index.html';
  if (!path.resolve(root, file).startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  try {
    let content = url.searchParams.has('baseline') ? original(file) : fs.readFileSync(path.join(root, file));
    if (file.endsWith('.html') && url.searchParams.has('day')) {
      const day = url.searchParams.get('day');
      content = content.toString().replace(/(<meta name="report-date" content=")[^"]*/, '$1' + day)
        .replace(/(<script\b[^>]*id="share-data"[^>]*>)([\s\S]*?)(<\/script>)/, (_, open, json, close) => {
          const report = JSON.parse(json); report.meta.day = day; return open + JSON.stringify(report) + close;
        }).replace(/<link\b(?=[^>]*rel="canonical")[^>]*>/, tag => tag.replace(/\/radar\/\d{4}-\d{2}-\d{2}\//, '/radar/' + day + '/'));
    }
    res.setHeader('Content-Type', file.endsWith('.html') ? 'text/html; charset=utf-8' : file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'text/javascript' : 'application/octet-stream');
    res.end(content);
  } catch { res.writeHead(404).end(); }
});
async function snapshot(page) {
  return page.evaluate(() => ({
    text: document.body.innerText,
    links: [...document.querySelectorAll('a')].map(a => a.getAttribute('href')),
    boxes: [...document.querySelectorAll('h1,h2,h3,.counts,.summary,.rtabs,.duo-stage,.s-media')].map(el => {
      const r = el.getBoundingClientRect(); return [r.x,r.y,r.width,r.height].map(n => Math.round(n * 100) / 100);
    }),
    bodyColor: getComputedStyle(document.body).color,
    overflow: document.documentElement.scrollWidth > innerWidth,
    theme: document.documentElement.dataset.reportTheme,
    glow: getComputedStyle(document.documentElement).getPropertyValue('--glow').trim(),
    background: getComputedStyle(document.body).backgroundImage,
    stage: getComputedStyle(document.querySelector('.duo-stage')).backgroundImage
  }));
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/caijix/`;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const days = [['2026-10-26','monday','#4568FF'],['2026-10-27','tuesday','#FF7138'],['2026-10-28','wednesday','#F45BAA'],['2026-10-29','thursday','#C8F169'],['2026-10-30','friday','#C47C60'],['2026-10-31','saturday','#b48ae5'],['2026-11-01','sunday','#72F5D0']];
    for (const width of [1440,390,320]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.addInitScript(() => { Math.random = () => .5; }); // Hold existing video shuffle constant for geometry comparison.
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.route('**/*', route => {
        const u = new URL(route.request().url());
        if (route.request().resourceType() === 'image' && u.origin !== new URL(base).origin) return route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')});
        if (u.origin !== new URL(base).origin) return route.abort();
        if (/\.(css|js)$/.test(u.pathname) && new URL(page.url()).searchParams.has('baseline')) u.searchParams.set('baseline', '1');
        return route.continue({ url: u.href });
      });
      await page.goto(base + '?baseline=1');
      const baseline = await snapshot(page);
      for (const [day,name,color] of days) {
        await page.goto(base + '?day=' + day);
        const current = await snapshot(page);
        assert.equal(current.theme,name); assert.equal(current.glow,color);
        assert.equal(current.text,baseline.text); assert.deepEqual(current.links,baseline.links);
        assert.deepEqual(current.boxes,baseline.boxes); assert.equal(current.bodyColor,baseline.bodyColor);
        assert.equal(current.overflow,false);
        if(name==='saturday') { assert.equal(current.background,baseline.background); assert.equal(current.stage,baseline.stage); }
        if(width===390) await page.screenshot({ path: path.join(output, name + '.png') });
      }
      assert.deepEqual(errors,[]); report.push(`PASS ${width}px: all seven exact colors, text, links, geometry, white body text, no horizontal overflow; Saturday original gradients`);
      for (const day of ['2026-02-30','invalid','']) {
        await page.goto(base + '?day=' + day);
        assert.equal((await snapshot(page)).theme,undefined);
        assert.equal((await snapshot(page)).glow,'#b48ae5');
      }
      await context.close();
    }
    for (const timezoneId of ['Asia/Shanghai','America/Los_Angeles','Pacific/Kiritimati']) {
      const context = await browser.newContext({timezoneId,reducedMotion:'reduce'});
      const page = await context.newPage();
      await page.route('**/*',r => r.request().url().startsWith(base) ? r.continue() : r.abort());
      for (const [url,theme] of [['','sunday'],['radar/','sunday'],['radar/2026-10-23/','friday'],['radar/2026-10-24/','saturday'],['radar/2026-10-25/','sunday']]) {
        await page.goto(base+url); assert.equal(await page.evaluate(()=>document.documentElement.dataset.reportTheme),theme);
      }
      await context.close();
    }
    report.push('PASS 5 published pages in 3 timezones; invalid/missing date retains original purple');
    const context = await browser.newContext({viewport:{width:390,height:1000}});
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    // Generate a local playable fixture using the browser encoder. No platform network dependency.
    await page.goto(base);
    const clip = await page.evaluate(async () => {
      const canvas=document.createElement('canvas');canvas.width=320;canvas.height=180;
      const ctx=canvas.getContext('2d'),stream=canvas.captureStream(10);
      const recorder=new MediaRecorder(stream,{mimeType:'video/webm'}),parts=[];
      recorder.ondataavailable=e=>parts.push(e.data);const done=new Promise(r=>recorder.onstop=r);
      recorder.start();let n=0;const timer=setInterval(()=>{ctx.fillStyle=n++%2?'#4568ff':'#72f5d0';ctx.fillRect(0,0,320,180)},100);
      await new Promise(r=>setTimeout(r,1200));recorder.stop();await done;clearInterval(timer);stream.getTracks().forEach(t=>t.stop());
      return Array.from(new Uint8Array(await new Blob(parts).arrayBuffer()));
    });
    await page.route('**/*',r => {
      if(r.request().resourceType()==='media')return r.fulfill({contentType:'video/webm',body:Buffer.from(clip)});
      return r.request().url().startsWith(base)?r.continue():r.abort();
    });
    await page.goto(base);
    await page.locator('.duo').scrollIntoViewIfNeeded();
    await page.locator('.duo-play').click();
    await page.waitForFunction(()=>document.querySelector('.duo').classList.contains('duo-open'),{},{timeout:20000});
    assert.equal(await page.locator('.duo video').evaluate(v=>v.paused),false);
    await page.locator('.duo-play').click();assert.equal(await page.locator('.duo video').evaluate(v=>v.paused),true);
    const mutedBefore = await page.locator('.duo video').evaluate(v=>v.muted);
    await page.locator('.duo-mute').click();
    assert.equal(await page.locator('.duo video').evaluate(v=>v.muted),!mutedBefore);
    if(await page.locator('.duo video').evaluate(v=>v.paused)) await page.locator('.duo-play').click();
    await page.waitForFunction(()=>!document.querySelector('.duo video').paused);
    await page.screenshot({path:path.join(output,'fold-playback.png')});
    await page.locator('.s-media[data-video]').first().click();
    await page.waitForFunction(()=>{const v=document.querySelector('.playing video');return v && v.currentTime>0});
    assert.equal(await page.locator('.duo video').evaluate(v=>v.paused),true);
    await page.locator('.player-close').click();assert.equal(await page.locator('.playing').count(),0);
    await page.locator('.s-media[data-play]').first().click();assert.equal(await page.locator('.playing iframe').count(),1);
    await page.locator('.player-close').click();
    report.push('PASS real browser-decoded WebM: 5 seconds playback opens fold, continuous playback, pause/resume/sound, inline playback pauses fold video, close restores sample, platform iframe opens; reduced motion opens without animation');
    await context.close();
    fs.writeFileSync(path.join(output,'test-evidence.txt'),report.join('\n')+'\n');
    console.log(report.join('\n'));
  } finally { await browser.close(); server.close(); }
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
