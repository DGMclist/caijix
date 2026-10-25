/* One decoder throughout the fold. The right leaf draws the same video frame. */
(() => {
  const card = document.querySelector('[data-duo]');
  if (!card) return;
  const candidates = [...new Map([...document.querySelectorAll('.s-media[data-video]')]
    .map(button => [button.dataset.video, button])).values()];
  if (!candidates.length) return; // Keep the original card if no direct video exists.
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const host = document.createElement('section');
  host.className = 'duo';
  host.setAttribute('aria-label', '今日快讯 · 折叠屏视频');
  host.innerHTML = `<div class="duo-stage"><div class="duo-device">
    <div class="duo-panel"><div class="duo-glass"><video muted playsinline loop preload="none" aria-label="今日快讯视频"></video></div></div>
    <div class="duo-panel duo-wing" aria-hidden="true"><div class="duo-glass"><canvas></canvas></div></div>
    <span class="duo-camera" aria-hidden="true"></span><span class="duo-hinge" aria-hidden="true"></span>
    </div></div><p class="duo-caption"><a target="_blank" rel="noopener noreferrer">查看原视频</a></p>
    <div class="duo-controls"><span>今日快讯</span><button type="button" class="duo-play">播放视频</button>
    <button type="button" class="duo-mute" aria-pressed="false">开启声音</button></div>
    <p class="duo-status" role="status">播放 5 秒后展开</p>`;
  card.querySelector('.today-head').after(host);
  const video = host.querySelector('video'), canvas = host.querySelector('canvas');
  const context = canvas.getContext('2d');
  if (!context) { host.remove(); return; }
  const play = host.querySelector('.duo-play'), mute = host.querySelector('.duo-mute');
  const status = host.querySelector('.duo-status'), link = host.querySelector('a');
  let elapsed = 0, previous = null, visible = !('IntersectionObserver' in window), userPaused = false, failed = false, requested = false;
  let frame = null, frameIsVideo = false, autoReady = false, attempt = 0;
  // Shuffle existing direct sources once; retry each at most once on media errors.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  function select() {
    ++attempt;
    const source = candidates.pop();
    if (!source) {
      failed = true; play.disabled = true; mute.disabled = true;
      status.textContent = '视频暂不可用，请通过原视频链接观看';
      return false;
    }
    const sample = source.closest('.sample');
    const original = sample?.querySelector('.s-title');
    link.href = original?.href || source.dataset.video;
    link.textContent = original?.textContent || '查看原视频';
    video.setAttribute('aria-label', link.textContent);
    video.poster = source.querySelector('img')?.src || '';
    video.src = source.dataset.video;
    previous = null; elapsed = 0;
    return true;
  }
  function draw() {
    if (!context || video.readyState < 2 || !video.videoWidth) return;
    // Match object-fit:cover on the 2x-wide video, then paint its right half.
    const width = Math.max(1, Math.round(canvas.clientWidth * Math.min(devicePixelRatio || 1, 2)));
    const height = Math.max(1, Math.round(canvas.clientHeight * Math.min(devicePixelRatio || 1, 2)));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    const scale = Math.max(2 * width / video.videoWidth, height / video.videoHeight);
    const sw = 2 * width / scale, sh = height / scale;
    context.drawImage(video, (video.videoWidth - sw) / 2 + sw / 2, (video.videoHeight - sh) / 2,
      sw / 2, sh, 0, 0, width, height);
  }
  function stopFrames() {
    if (frame !== null) {
      if (frameIsVideo) video.cancelVideoFrameCallback(frame); else cancelAnimationFrame(frame);
      frame = null;
    }
  }
  function frames() {
    draw();
    if (video.paused || document.hidden || !visible) { frame = null; return; }
    frameIsVideo = typeof video.requestVideoFrameCallback === 'function';
    frame = frameIsVideo ? video.requestVideoFrameCallback(frames) : requestAnimationFrame(frames);
  }
  function syncSound() {
    mute.setAttribute('aria-pressed', String(!video.muted));
    mute.textContent = video.muted ? '开启声音' : '静音';
  }
  function start(automatic = false) {
    if (failed) return;
    requested = true;
    const token = ++attempt;
    video.play().catch(error => {
      if (token !== attempt) return;
      // A browser can require a click before allowing audible autoplay.
      if (automatic && !video.muted && error.name === 'NotAllowedError' && visible && !document.hidden && !userPaused && !reduced.matches) {
        video.muted = true; syncSound();
        status.textContent = '已静音自动播放，点击“开启声音”收听';
        video.play().catch(() => {
          if (token === attempt) { play.textContent = '播放视频'; status.textContent = '请点击播放视频'; }
        });
      } else { play.textContent = '播放视频'; status.textContent = '点击播放，5 秒后展开'; }
    });
  }
  function suspend() { ++attempt; video.pause(); previous = null; stopFrames(); }
  function autoStart() {
    if (autoReady && video.paused && visible && !document.hidden && !userPaused && !reduced.matches && !navigator.connection?.saveData) start(true);
  }
  select();
  video.muted = false; video.defaultMuted = false; syncSound();
  // Delay from DOM initialisation; network buffering can postpone the first frame.
  setTimeout(() => { autoReady = true; autoStart(); }, 1000);
  video.addEventListener('playing', () => { previous = video.currentTime; play.textContent = '暂停视频'; stopFrames(); frames(); });
  video.addEventListener('pause', () => { previous = null; play.textContent = '播放视频'; stopFrames(); });
  video.addEventListener('timeupdate', () => {
    if (video.paused) return;
    const time = video.currentTime;
    if (previous !== null) elapsed += Math.max(0, Math.min(1, time - previous));
    previous = time;
    if (elapsed >= 5 && !host.classList.contains('duo-open')) {
      host.classList.add('duo-open'); status.textContent = '已展开 · 连续播放';
    }
  });
  video.addEventListener('error', () => {
    stopFrames();
    if (select()) {
      if (requested && !userPaused && visible && !document.hidden) start(true); else autoStart();
    }
  });
  play.addEventListener('click', () => {
    if (video.paused) { userPaused = false; start(); } else { userPaused = true; suspend(); }
  });
  mute.addEventListener('click', () => {
    video.muted = !video.muted; syncSound();
    if (!video.muted) {
      status.textContent = host.classList.contains('duo-open') ? '已展开 · 连续播放' : '播放 5 秒后展开';
      if (video.paused) { userPaused = false; start(); }
    }
  });
  const motion = () => {
    if (reduced.matches) { host.classList.add('duo-open'); suspend(); status.textContent = '已关闭折叠动画，点击播放视频'; }
  };
  motion(); reduced.addEventListener('change', motion);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) autoStart(); else suspend(); }, { threshold: .35 }).observe(host);
  } // Without an observer, the same delayed autoplay attempt is used.
  document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); else autoStart(); });
  document.addEventListener('click', event => {
    if (event.target.closest('.s-media[data-play], .s-media[data-video]')) { userPaused = true; suspend(); }
  });
  window.addEventListener('resize', () => { if (video.paused) draw(); });
})();
