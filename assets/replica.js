/* Local adaptation: same UI, self-contained share cards and robust media recovery. */
(() => {
  const videoSection=document.getElementById('r-video'),xSection=document.getElementById('r-x');
  if(videoSection&&xSection)videoSection.before(xSection);
  const videoTab=document.querySelector('.rtabs a[href="#r-video"]'),xTab=document.querySelector('.rtabs a[href="#r-x"]');
  if(videoTab&&xTab)videoTab.before(xTab);
  const src=document.getElementById('share-data');
  if(src){
    const data=JSON.parse(src.textContent);
    data.meta.host=location.host;
    for(const item of data.items)item.url=location.origin+'/radar/'+data.meta.day+'/#'+item.id;
    src.textContent=JSON.stringify(data);
  }
  document.querySelectorAll('.s-media img').forEach(img=>{
    function fallback(){
      const box=img.closest('.s-media');if(!box)return;
      img.style.opacity='0';box.classList.add('cover-unavailable');
      if(!box.querySelector('.cover-note')){const note=document.createElement('span');note.className='cover-note';note.textContent='封面暂不可用';box.appendChild(note);}
    }
    img.addEventListener('error',fallback,{once:true});
    if(img.complete && !img.naturalWidth)fallback();
  });
})();
