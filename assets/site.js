/* BEGIN REPORT THEME BOOTSTRAP */
/* Publication date, never the visitor's clock. Also bundled in the existing site.js. */
(() => {
  const root = document.documentElement;
  const owned = ['--glow', '--glow-2', '--brand', '--deep', '--warm', '--hot', '--violet',
    '--theme-rgb', '--line', '--line-2', '--badge-top', '--badge-bottom',
    '--badge-a-top', '--badge-a-bottom', '--badge-rgb'];
  for (const key of owned) root.style.removeProperty?.(key);
  delete root.dataset.reportTheme;
  delete root.dataset.reportDate;
  let value = document.querySelector('meta[name="report-date"]')?.content;
  const report = document.getElementById?.('share-data');
  // The existing generated report already contains meta.day. No new head tags required.
  if (report) {
    try { value = JSON.parse(report.textContent).meta?.day; } catch { return; }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return;
  const date = new Date(value + 'T00:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return;
  const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute?.('href');
  const canonicalDay = canonical?.match(/\/radar\/(\d{4}-\d{2}-\d{2})\//)?.[1];
  if (canonicalDay && canonicalDay !== value) return;
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
/* END REPORT THEME BOOTSTRAP */
// Small enhancements only; every page works without this file.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  // muted loops play only while on screen, never under reduced motion
  const loops = document.querySelectorAll("video[data-loop]");
  if (!reduce && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const v = e.target;
        if (e.isIntersecting) {
          if (v.preload === "none") v.preload = "auto";
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      }
    }, { threshold: 0.3 });
    loops.forEach((v) => io.observe(v));
  }
  if (reduce) document.querySelectorAll("video[autoplay]").forEach((v) => { v.removeAttribute("autoplay"); v.pause(); });

  // soft light that follows the cursor on cards
  if (fine) {
    document.querySelectorAll("[data-glow]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });
  }

  // numbers count up once when they scroll into view
  const counters = document.querySelectorAll("[data-count]");
  if (!reduce && counters.length && "IntersectionObserver" in window) {
    const fmt = (n) => n.toLocaleString("en-US");
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        const el = e.target, end = Number(el.dataset.count), t0 = performance.now(), dur = 1100;
        if (!end || end >= 10000) continue;
        const step = (t) => {
          const p = Math.min(1, (t - t0) / dur);
          el.textContent = fmt(Math.round(end * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.6 });
    counters.forEach((c) => io.observe(c));
  }

  // copy buttons
  document.querySelectorAll("[data-copy]").forEach((b) => {
    b.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(b.dataset.copy);
        b.textContent = "已复制";
      } catch {
        b.textContent = "复制失败";
      }
      setTimeout(() => { b.textContent = "复制"; }, 1600);
    });
  });

  // visit counting: a small same-origin beacon per action (serve.py /_e); no cookie or id is set here,
  // the server counts visitors with a daily-salted hash and keeps no IP
  const send = () => {}; // No analytics in this local static edition.
  const where = (el) => ({
    s: el.closest("section[id]")?.id || "",
    i: el.closest("[id^='h-'], [id^='t-'], .repo-wrap[id]")?.id || "",
  });
  const plat = (url) => {
    const u = url || "";
    return u.includes("bilibili") ? "bili" : u.includes("youtube") ? "yt" : u.includes("douyin") ? "dy"
      : u.includes("tiktok") ? "tt" : u.includes("twimg") || u.includes("x.com") ? "x" : "other";
  };
  let refHost = "";
  try { refHost = document.referrer ? new URL(document.referrer).hostname : ""; } catch {}
  const query = new URLSearchParams(location.search);
  if (!query.has("nt")) send("view", { f: query.get("from") || "", r: refHost === location.hostname ? "" : refHost });

  let shareIds = {};
  try { (JSON.parse(document.getElementById("share-data")?.textContent || "{}").items || []).forEach((x) => { shareIds[x.id] = 1; }); } catch {}
  const landed = decodeURIComponent(location.hash.slice(1));
  if (landed && shareIds[landed]) send("land", { i: landed });   // opened from a share card's QR code

  let sharing = "";
  const outbound = (e) => {
    const a = e.target.closest("a[href]");
    if (!a || (e.type === "auxclick" && e.button !== 1)) return;
    let url;
    try { url = new URL(a.href, location.href); } catch { return; }
    if (url.host && url.host !== location.host) {
      send("out", Object.assign({ k: url.hostname.replace(/^www\./, "") }, where(a)));
    } else if (e.type === "click") {
      const m = url.pathname.match(/^\/radar\/(?:(\d{4}-\d{2}-\d{2})\/)?$/);
      if (m && url.pathname !== location.pathname) send("day", Object.assign({ k: m[1] || "today" }, where(a)));
    }
  };
  document.addEventListener("click", (e) => {
    outbound(e);
    const opener = e.target.closest("[data-share]");
    if (opener) { sharing = opener.dataset.share; send("share", Object.assign(where(opener), { i: sharing })); }
    if (e.target.closest(".sd-save") && sharing) send("share_save", { i: sharing });
    if (e.target.closest(".sd-copy") && sharing) send("share_copy", { i: sharing });
  });
  document.addEventListener("auxclick", outbound);
  // the muted loop at the top counts as played once someone turns its sound on
  document.querySelectorAll(".stage video").forEach((v) => {
    const heard = () => { if (!v.muted) { send("play", { k: "site", s: "stage" }); v.removeEventListener("volumechange", heard); } };
    v.addEventListener("volumechange", heard);
  });

  // radar samples: the cover turns into the platform's own player in place, one at a time
  let playing = null;
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-play], button[data-video]");
    if (!btn) return;
    send("play", Object.assign({ k: plat(btn.dataset.play || btn.dataset.video) }, where(btn)));
    if (playing && playing.box !== btn) playing.box.replaceWith(playing.btn);
    let el;
    if (btn.dataset.video) {  // X's own mp4; the radar pages send no referrer, which video.twimg.com needs
      el = document.createElement("video");
      Object.assign(el, { src: btn.dataset.video, controls: true, autoplay: true, playsInline: true, preload: "metadata" });
    } else {
      el = document.createElement("iframe");
      el.src = btn.dataset.play;
      el.title = btn.getAttribute("aria-label") || "视频";
      el.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      el.allowFullscreen = true;
      el.referrerPolicy = "strict-origin-when-cross-origin";  // YouTube refuses embeds without an origin
    }
    const box = document.createElement("div");
    box.className = "s-media playing" + ((btn.dataset.play || "").includes("open.douyin.com") ? " tall" : "");
    box.appendChild(el);
    const close=document.createElement("button");
    close.type="button";close.className="player-close";close.setAttribute("aria-label","关闭播放器");close.textContent="×";
    close.addEventListener("click",()=>{box.replaceWith(btn);if(playing?.box===box)playing=null;btn.focus({preventScroll:true});});
    box.appendChild(close);
    const original=btn.closest(".sample")?.querySelector(".s-title");
    if(btn.dataset.video)el.addEventListener("error",()=>{
      const message=document.createElement("div");message.className="media-error";
      message.append(document.createTextNode("此视频暂时无法加载。"));
      if(original){const a=document.createElement("a");a.href=original.href;a.target="_blank";a.rel="noopener noreferrer";a.textContent="打开原帖观看 ↗";message.appendChild(a);}
      box.appendChild(message);
    },{once:true});
    btn.replaceWith(box);
    playing = { box, btn };
  });

  // menus close on outside click, on Esc, and when one of their links is used
  const pops = [...document.querySelectorAll("details.pop")];
  document.addEventListener("click", (e) => {
    for (const d of pops) if (d.open && !d.contains(e.target)) d.open = false;
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    for (const d of pops) if (d.open) { d.open = false; d.querySelector("summary")?.focus(); }
  });
  pops.forEach((d) => d.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => { d.open = false; })));
})();
