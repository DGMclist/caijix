const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const js=fs.readFileSync(path.join(root,'assets/site.js'),'utf8');
const start='/* BEGIN REPORT THEME BOOTSTRAP */',end='/* END REPORT THEME BOOTSTRAP */';
assert(js.startsWith(start));
const bootstrap=js.slice(start.length,js.indexOf(end));
assert.equal(bootstrap.trim(),fs.readFileSync(path.join(root,'assets/report-theme.js'),'utf8').trim());
assert(fs.readFileSync(path.join(root,'assets/style.css'),'utf8').includes(fs.readFileSync(path.join(root,'assets/report-theme.css'),'utf8').trim()));
function context(day,meta,canonical,raw){
 const tokens={},element={dataset:{},style:{setProperty:(k,v)=>tokens[k]=v,removeProperty:k=>delete tokens[k]}};
 const report={textContent:raw===undefined?JSON.stringify({meta:{day}}):raw};
 return {tokens,element,report,document:{documentElement:element,getElementById:()=>report,querySelector:s=>s.startsWith('meta')?{content:meta}:canonical?{getAttribute:()=>canonical}:null}};
}
const days=[['2026-10-26','monday'],['2026-10-27','tuesday'],['2026-10-28','wednesday'],['2026-10-29','thursday'],['2026-10-30','friday'],['2026-10-31','saturday'],['2026-11-01','sunday']];
for(const [day,name]of days){
 const c=context(day,undefined,'/caijix/radar/'+day+'/');vm.runInNewContext(bootstrap,{document:c.document});assert.equal(c.element.dataset.reportTheme,name,'Generated HTML without theme tags: '+day);
 assert(c.tokens['--badge-top']);
}
const stale=context('2026-10-26','2026-10-25','/caijix/radar/2026-10-26/');vm.runInNewContext(bootstrap,{document:stale.document});assert.equal(stale.element.dataset.reportTheme,'monday');
stale.report.textContent=JSON.stringify({meta:{day:'2026-10-31'}});stale.document.querySelector=s=>s.startsWith('meta')?{content:'2026-10-26'}:null;vm.runInNewContext(bootstrap,{document:stale.document});assert.equal(stale.element.dataset.reportTheme,'saturday');assert.equal(stale.tokens['--glow'],undefined);
for(const c of [context('2026-02-30'),context('2026-10-26',undefined,'/caijix/radar/2026-10-25/'),context(undefined,'2026-10-25',undefined,'broken JSON')]){vm.runInNewContext(bootstrap,{document:c.document});assert.equal(c.element.dataset.reportTheme,undefined)}
let pages=0;
for(const file of ['index.html','radar/index.html','radar/2026-10-23/index.html','radar/2026-10-24/index.html','radar/2026-10-25/index.html']){
 const html=fs.readFileSync(path.join(root,file),'utf8').replace(/<meta name="report-date"[^>]*>/g,'').replace(/<(script|link)\b[^>]*(?:src|href)="\/caijix\/assets\/report-theme\.(?:js|css)"[^>]*>(?:<\/script>)?/g,'');
 assert(!html.includes('/assets/report-theme.'));assert(html.includes('/assets/site.js'));assert(html.includes('/assets/style.css'));
 const report=html.match(/<script\b[^>]*id="share-data"[^>]*>([\s\S]*?)<\/script>/)[1];
 const day=JSON.parse(report).meta.day;const c=context(day,undefined,'/caijix/radar/'+day+'/',report);vm.runInNewContext(bootstrap,{document:c.document});assert.equal(c.element.dataset.reportDate,day);pages++;
}
const before=['assets/site.js','assets/style.css'].map(f=>fs.readFileSync(path.join(root,f),'utf8'));
cp.execFileSync(process.execPath,[path.join(__dirname,'install-report-theme-assets.cjs')]);
['assets/site.js','assets/style.css'].forEach((f,i)=>assert.equal(fs.readFileSync(path.join(root,f),'utf8'),before[i],'Installer must be idempotent'));
console.log(`PASS automatic themes without head hooks: seven weekdays, ${pages} regenerated pages, stale metadata, Saturday reset, invalid/corrupt/mismatched dates, bundled CSS and idempotent install.`);
