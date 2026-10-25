// Share cards on the radar pages (radar_share.py builds the specs). Works only with JS; the page is complete without it.
(function(){
/* Share cards: a 1080x1440 PNG drawn on a canvas from the specs in #share-data (radar_share.py).
   Ported from the intel-radar reference page; the QR codes point at this site's day pages. */
var src=document.getElementById('share-data'),dlg=document.getElementById('share-dlg');
if(!src||!dlg)return;
var D=JSON.parse(src.textContent),M=D.meta,ITEMS={};D.items.forEach(function(x){ITEMS[x.id]=x;});
var W=1080,H=1440,FF='-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
var LB={'新起':['#462064','#fff'],'爆发':['#462064','#fff'],'升温':['#fff1e3','#9a560c'],'热议':['#fff1e3','#9a560c'],'持续':['#e9f2fb','#1f62a6'],
  '关注':['#f7f9fa','#757980'],'观察':['#f7f9fa','#757980'],'回落':['#f6eef0','#a2394a'],'今日上榜':['#fff8f0','#9a560c']};
var GR={'必看':['#462064','#fff'],'推荐':['#dfd0f0','#462064'],'参考':['#e6f0fa','#2877c7'],'观察':['#f7f9fa','#757980']};
var PC={bili:'#fb7299',yt:'#ff3b3b',dy:'#fe2c55',tt:'#25f4ee',xhs:'#ff2442',x:'#e7e9ea'};
var UA=navigator.userAgent,INAPP=/MicroMessenger|Lark|Feishu|DingTalk|QQ\/|Weibo|AlipayClient|aweme|BytedanceWebview/i.test(UA),
  MOBILE=/iPhone|iPad|iPod|Android|Mobile/i.test(UA)||(navigator.maxTouchPoints>1&&/Macintosh/.test(UA));
function font(c,w,s){c.font=w+' '+s+'px '+FF;}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
var NOSTART='，。、；：？！）】」』》”’,.;:?!)%…';
function wrap(c,s,w,max){   /* greedy lines: CJK by character, latin by word; the last line gets an ellipsis */
  var tk=[];((s||'').replace(/\s+/g,' ').trim().match(/[A-Za-z0-9][\w.+\-'%\/:#@&]*|[\s\S]/gu)||[]).forEach(function(t){
    if(t.length>1&&c.measureText(t).width>w)tk.push.apply(tk,Array.from(t));else tk.push(t);});
  var L=[],cur='';
  for(var i=0;i<tk.length;i++){var t=tk[i];
    if(!cur&&t===' ')continue;
    if(!cur||c.measureText(cur+t).width<=w||NOSTART.indexOf(t)>=0){cur+=t;continue;}
    L.push(cur.replace(/ +$/,''));cur=t===' '?'':t;
    if(L.length===max)break;}
  if(L.length<max){if(cur)L.push(cur);return L;}
  var last=L[max-1];while(last&&c.measureText(last+'…').width>w)last=last.slice(0,-1);
  L[max-1]=last.replace(/[\s，。、；：,.;:]+$/,'')+'…';return L;}
function clip(c,s,w){return wrap(c,s,w,1)[0]||'';}
function pill(c,x,y,h,text,bg,fg,size,weight,border){font(c,weight,size);var w=Math.round(c.measureText(text).width+h*.8);
  rr(c,x,y,w,h,h/2);c.fillStyle=bg;c.fill();if(border){c.strokeStyle=border;c.lineWidth=2;c.stroke();}
  c.fillStyle=fg;c.textBaseline='middle';c.fillText(text,x+h*.4,y+h/2+1);c.textBaseline='top';return w;}
function backdrop(c){var g=c.createLinearGradient(0,0,W,H);g.addColorStop(0,'#f6f1fd');g.addColorStop(.58,'#f6f2fb');g.addColorStop(1,'#f9f3ff');
  c.fillStyle=g;c.fillRect(0,0,W,H);
  [[90,0,660,'rgba(54, 165, 144, .2)'],[1000,150,520,'rgba(40, 119, 199, .09)']].forEach(function(r){
    var q=c.createRadialGradient(r[0],r[1],0,r[0],r[1],r[2]);q.addColorStop(0,r[3]);q.addColorStop(1,'rgba(255, 255, 255, 0)');c.fillStyle=q;c.fillRect(0,0,W,H);});}
function logo(c,x,y,s){var g=c.createLinearGradient(x,y,x+s,y+s);g.addColorStop(0,'#693998');g.addColorStop(1,'#462064');
  rr(c,x,y,s,s,s*.29);c.fillStyle=g;c.fill();var k=s*16/28/24;
  c.save();c.translate(x+s*6/28,y+s*6/28);c.scale(k,k);c.strokeStyle='#fff';c.lineWidth=2.2;c.lineCap='round';
  ['M12 3a9 9 0 0 1 9 9','M12 7a5 5 0 0 1 5 5','M3 12a9 9 0 0 0 9 9'].forEach(function(d){c.stroke(new Path2D(d));});
  c.beginPath();c.arc(12,12,3,0,Math.PI*2);c.stroke();c.restore();}
function fit(c,img,sx,sy,sw,sh,x,y,w,h){var r=Math.max(w/sw,h/sh),dw=w/r,dh=h/r;c.drawImage(img,sx+(sw-dw)/2,sy+(sh-dh)/2,dw,dh,x,y,w,h);}
function cover(c,it,img,x,y,w,h){
  var flat=it.pkey==='gh';   /* GitHub's preview image is a white 2:1 card: no shade, no corner badge */
  c.save();rr(c,x,y,w,h,24);c.clip();
  var g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'#352143');g.addColorStop(1,'#0d1517');c.fillStyle=flat?'#fff':g;c.fillRect(x,y,w,h);
  if(img){var iw=img.naturalWidth,ih=img.naturalHeight,sx=0,sw=iw;
    if(it.vertical||ih>iw*1.1){if(iw>ih){sw=Math.min(iw,ih*9/16);sx=(iw-sw)/2;}   /* a Shorts thumbnail is a 9:16 frame inside a 4:3 one */
      var t=document.createElement('canvas');t.width=24;t.height=Math.max(8,Math.round(24*h/w));fit(t.getContext('2d'),img,sx,0,sw,ih,0,0,t.width,t.height);
      c.imageSmoothingEnabled=true;c.drawImage(t,x-30,y-30,w+60,h+60);c.fillStyle='rgba(8, 14, 16, .4)';c.fillRect(x,y,w,h);
      var dw=Math.min(w,h*sw/ih);c.drawImage(img,sx,0,sw,ih,x+(w-dw)/2,y,dw,h);}
    else fit(c,img,0,0,iw,ih,x,y,w,h);}
  else if(it.quote&&it.quote.t){c.fillStyle='rgba(54, 165, 144, .55)';font(c,800,200);c.textAlign='right';c.fillText('\u201d',x+w-36,y+6);c.textAlign='left';
    c.fillStyle='#fff';font(c,500,34);var n=Math.max(1,Math.floor((h-260)/54)),ql=wrap(c,it.quote.t,w-120,n);
    ql.forEach(function(l,i){c.fillText(l,x+60,y+112+i*54);});
    c.fillStyle='rgba(255, 255, 255, .66)';font(c,500,24);c.fillText(clip(c,'\u2014 '+it.quote.who,w-120),x+60,y+112+ql.length*54+18);}
  else{c.strokeStyle='rgba(54, 165, 144, .32)';c.lineWidth=3;for(var k=1;k<=6;k++){c.beginPath();c.arc(x+w-60,y+h+40,k*95,Math.PI,Math.PI*1.5);c.stroke();}}
  if(!flat&&(img||it.plat)){var s2=c.createLinearGradient(0,y+h-160,0,y+h);s2.addColorStop(0,'rgba(0, 0, 0, 0)');s2.addColorStop(1,'rgba(0, 0, 0, .5)');c.fillStyle=s2;c.fillRect(x,y+h-160,w,160);}
  c.restore();
  if(flat){rr(c,x+1,y+1,w-2,h-2,23);c.strokeStyle='#e2e8ea';c.lineWidth=2;c.stroke();}
  if(it.label){var lb=LB[it.label]||LB['观察'];c.save();c.shadowColor='rgba(0, 0, 0, .22)';c.shadowBlur=14;c.shadowOffsetY=3;pill(c,x+24,y+24,54,it.label,lb[0],lb[1],28,760);c.restore();}
  if(it.plat&&!flat){var tx=it.plat+(it.cap?' \u00b7 '+it.cap:'');font(c,600,23);var pw=c.measureText(tx).width+58;
    rr(c,x+24,y+h-70,pw,46,12);c.fillStyle='rgba(10, 18, 20, .7)';c.fill();
    c.fillStyle=PC[it.pkey]||'#fff';c.beginPath();c.arc(x+46,y+h-47,6,0,Math.PI*2);c.fill();
    c.fillStyle='#fff';c.textBaseline='middle';c.fillText(tx,x+62,y+h-46);c.textBaseline='top';}}
function draw(it,img,ownerQr){
  var cv=document.createElement('canvas');cv.width=W;cv.height=H;var c=cv.getContext('2d');c.textBaseline='top';
  backdrop(c);
  logo(c,48,40,64);
  c.fillStyle='#242528';font(c,780,36);c.fillText(M.site,128,44);
  c.fillStyle='#757980';font(c,500,22);c.fillText('每日 AI 视频情报',128,90);
  c.textAlign='right';c.fillStyle='#242528';font(c,740,32);c.fillText(M.date,W-48,46);
  c.fillStyle='#757980';font(c,500,22);c.fillText(M.week,W-48,90);c.textAlign='left';
  var px=32,py=140,pw=W-64,ph=H-py-32,stub=232,sy=py+ph-stub;
  c.save();c.shadowColor='rgba(17, 72, 65, .14)';c.shadowBlur=48;c.shadowOffsetY=16;rr(c,px,py,pw,ph,32);c.fillStyle='#fff';c.fill();c.restore();
  /* the text decides its height; the cover takes what is left, up to 16:9 */
  var bx=px+48,bw=pw-96,st=(it.stats||[]).length?112:0;
  font(c,760,54);var tl=wrap(c,it.title,bw,2);font(c,400,30);var wl=wrap(c,it.line,bw,3);
  function body(){return 36+46+24+tl.length*72+16+wl.length*48+(st?30+st:0)+36;}
  var cx=px+24,cy=py+24,cw=pw-48,full=Math.round(cw/(it.pkey==='gh'?2:16/9)),ch=sy-cy-body();
  if(ch<450&&wl.length>2){wl=wrap(c,it.line,bw,2);ch=sy-cy-body();}
  var spare=Math.max(0,ch-full);ch-=spare;
  cover(c,it,img,cx,cy,cw,ch);
  var y=cy+ch+36+Math.round(spare/2);
  if(it.grade){var g=GR[it.grade]||GR['观察'],gw=pill(c,bx,y,46,it.grade,g[0],g[1],25,740);
    c.fillStyle='#462064';font(c,700,28);c.textBaseline='middle';c.fillText(clip(c,it.verdict,bw-gw-20),bx+gw+18,y+24);c.textBaseline='top';}
  else{var sw=pill(c,bx,y,46,it.sec||'',"#e9fffc","#462064",24,700,'#dfd0f0');
    c.fillStyle='#757980';font(c,500,25);c.textBaseline='middle';c.fillText(clip(c,it.sub||'',bw-sw-20),bx+sw+18,y+24);c.textBaseline='top';}
  y+=46+24;
  c.fillStyle='#242528';font(c,760,54);tl.forEach(function(l,i){c.fillText(l,bx,y+9+i*72);});y+=tl.length*72+16;
  c.fillStyle='#3b3d40';font(c,400,30);wl.forEach(function(l,i){c.fillText(l,bx,y+9+i*48);});
  if(st){var ty=sy-36-st,n=it.stats.length,colw=bw/n;rr(c,bx,ty,bw,st,20);c.fillStyle='#f7f9fa';c.fill();c.strokeStyle='#e2e8ea';c.lineWidth=2;c.stroke();
    it.stats.forEach(function(s,i){var x=bx+colw*i+28,size=46;font(c,760,size);while(size>30&&c.measureText(s[0]).width>colw-44){size-=2;font(c,760,size);}
      c.fillStyle=i===0?'#462064':'#242528';c.fillText(s[0],x,ty+18+(46-size)/2);
      c.fillStyle='#757980';font(c,500,22);c.fillText(clip(c,s[1],colw-44),x,ty+74);
      if(i){c.fillStyle='#e2e8ea';c.fillRect(bx+colw*i,ty+24,2,st-48);}});}
  /* ticket stub: perforation with notches, then the QR code */
  c.save();c.beginPath();c.arc(px,sy,18,0,Math.PI*2);c.arc(px+pw,sy,18,0,Math.PI*2);c.clip();backdrop(c);c.restore();
  c.strokeStyle='#e2e8ea';c.lineWidth=2;c.beginPath();c.arc(px,sy,18,-Math.PI/2,Math.PI/2);c.stroke();c.beginPath();c.arc(px+pw,sy,18,Math.PI/2,Math.PI*1.5);c.stroke();
  c.save();c.setLineDash([12,10]);c.strokeStyle='#cbd7d9';c.lineWidth=2;c.beginPath();c.moveTo(px+34,sy);c.lineTo(px+pw-34,sy);c.stroke();c.restore();
  var qs=190,qx=px+pw-48-qs,qy=Math.round(sy+(stub-qs)/2);
  c.fillStyle='#fff';c.fillRect(qx-8,qy-8,qs+16,qs+16);
  if(ownerQr)c.drawImage(ownerQr,qx,qy,qs,qs);
  var tw=qx-36-bx;
  c.fillStyle='#242528';font(c,760,36);c.fillText('扫码添加微信',bx,sy+52);
  c.fillStyle='#757980';font(c,500,24);c.fillText(clip(c,'获取后续情报与更新',tw),bx,sy+110);
  c.fillStyle='#7844a1';font(c,650,24);c.fillText(clip(c,M.host,tw),bx,sy+152);
  return cv;}
function load(u,cb){if(!u){cb(null);return;}var img=new Image(),done=false;
  function fin(x){if(!done){done=true;cb(x);}}
  if(/^https?:/.test(u))img.crossOrigin='anonymous';   /* covers not copied next to the page: export only works with CORS */
  img.referrerPolicy='no-referrer';img.onload=function(){fin(img.naturalWidth?img:null);};img.onerror=function(){fin(null);};
  img.src=u;setTimeout(function(){fin(null);},8000);}
var $=function(s){return dlg.querySelector(s);},imgEl=$('.sd-img'),wait=$('.sd-wait'),tip=$('.sd-tip'),saveB=$('.sd-save'),copyB=$('.sd-copy');
var cur=null,opener=null;
dlg.classList.toggle('inapp',INAPP);
if(MOBILE&&!INAPP&&navigator.canShare)saveB.textContent='保存到相册';
function say(t){tip.textContent=t;}
function hint(){say(INAPP?'长按上面的图片，选「保存图片」或直接发给朋友':MOBILE?'也可以长按上面的图片保存':'1080 × 1440，适合朋友圈和小红书');}
function open(id,btn){var it=ITEMS[id];if(!it)return;cur=it;opener=btn;
  $('#sd-t').textContent='分享卡片 · '+it.title;imgEl.hidden=true;imgEl.removeAttribute('src');wait.hidden=false;saveB.disabled=copyB.disabled=true;say('');
  if(dlg.showModal){if(!dlg.open)dlg.showModal();}else dlg.setAttribute('open','');
  document.documentElement.classList.add('sd-lock');
  if(it.png){shown(it);return;}
  load(it.cover,function(img){
    load('/assets/owner-qr.png',function(ownerQr){var url;
      try{url=draw(it,img,ownerQr).toDataURL('image/png');}catch(e){url=draw(it,null,ownerQr).toDataURL('image/png');}   /* a tainted canvas: draw without the cover */
      it.png=url;if(cur===it)shown(it);
    });
  });}
function shown(it){imgEl.src=it.png;imgEl.alt=it.title+' 的分享卡片';imgEl.hidden=false;wait.hidden=true;saveB.disabled=copyB.disabled=false;hint();}
function fname(it){return (M.site+'-'+M.day+'-'+it.title).replace(/[\\\/:*?"<>|\s]+/g,'')+'.png';}
function bytes(u){var b=atob(u.split(',')[1]),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a;}
function save(){var it=cur;if(!it||!it.png)return;var name=fname(it),data=bytes(it.png);
  if(MOBILE&&navigator.canShare){var f=new File([data],name,{type:'image/png'});
    if(navigator.canShare({files:[f]})){navigator.share({files:[f]}).then(function(){say('选「存储图像」就能存进相册');},
      function(e){if(!e||e.name!=='AbortError')say('没能打开系统分享，长按上面的图片保存');});return;}}
  var url=URL.createObjectURL(new Blob([data],{type:'image/png'})),a=document.createElement('a');
  a.href=url;a.download=name;dlg.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},30000);
  say(MOBILE?'如果没有开始下载，长按上面的图片保存':'已保存：'+name);}
function copy(){var u=cur&&cur.url;if(!u)return;
  function old(){var t=document.createElement('textarea');t.value=u;t.setAttribute('readonly','');t.style.cssText='position:fixed;top:0;opacity:0';
    dlg.appendChild(t);t.select();var ok=false;try{ok=document.execCommand('copy');}catch(e){}t.remove();say(ok?'链接已复制':u);}
  if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(u).then(function(){say('链接已复制');},old);else old();}
function closed(){document.documentElement.classList.remove('sd-lock');cur=null;if(opener&&opener.focus)opener.focus({preventScroll:true});}
function close(){if(dlg.close&&dlg.open)dlg.close();else{dlg.removeAttribute('open');closed();}}
dlg.addEventListener('close',closed);
dlg.addEventListener('click',function(ev){if(ev.target===dlg)close();});
$('.sd-x').addEventListener('click',close);saveB.addEventListener('click',save);copyB.addEventListener('click',copy);
document.addEventListener('click',function(ev){var b=ev.target.closest('[data-share]');if(b){ev.preventDefault();open(b.dataset.share,b);}});
/* landing from a card's QR code: <origin>/radar/<day>/#<card id>; the browser scrolls, CSS :target rings it */
var toast=document.getElementById('toast'),tt=0;
function note(t){if(!toast)return;toast.textContent=t;toast.classList.add('on');clearTimeout(tt);tt=setTimeout(function(){toast.classList.remove('on');},3200);}
function land(){var id=decodeURIComponent(location.hash.slice(1));if(!id||!ITEMS[id])return;
  var t=document.getElementById(id);if(!t){note('这一期里没找到分享的那一条');return;}
  t.classList.remove('flash');void t.offsetWidth;t.classList.add('flash');note('已定位到分享的那一条');}
land();window.addEventListener('hashchange',land);
})();
