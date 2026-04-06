// ==UserScript==
// @name         XDL
// @namespace    https://github.com/Celesth
// @version      1.0.0
// @description  Download images and videos from Twitter/X with one click
// @author       Celesth
// @match        https://twitter.com/*
// @match        https://x.com/*
// @grant        GM_addStyle
// @grant        GM_download
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
  "use strict";

  // ── Config ──────────────────────────────────────────────────────────────────
  const CFG = {
    imageTemplate: "{author}—{date}—{tweetId}—{name}.{ext}",
    videoTemplate: "{author}—{date}—{tweetId}—{name}.{ext}",
    imageSize:     "orig",   // orig | large | medium | small
    notifDuration: 5000,
  };

  // ── History (dedup) ──────────────────────────────────────────────────────────
  const History = {
    _key: "xdl-downloaded",
    _set: null,
    load() {
      if (this._set) return;
      try { this._set = new Set(JSON.parse(GM_getValue(this._key, "[]"))); }
      catch { this._set = new Set(); }
    },
    has(id)  { this.load(); return this._set.has(id); },
    add(id)  { this.load(); this._set.add(id); GM_setValue(this._key, JSON.stringify([...this._set])); },
  };

  // ── Styles ───────────────────────────────────────────────────────────────────
  GM_addStyle(`
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap');

    :root {
      --xdl-bg:      rgba(18, 13, 13, 0.88);
      --xdl-border:  rgba(235, 224, 223, 0.08);
      --xdl-border2: rgba(235, 224, 223, 0.18);
      --xdl-fg:      #ebe0df;
      --xdl-muted:   rgba(235, 224, 223, 0.45);
      --xdl-dim:     rgba(235, 224, 223, 0.2);
      --xdl-accent:  #b3a2d5;
      --xdl-success: #ffbca9;
      --xdl-error:   #ff535f;
      --xdl-sep:     rgba(235, 224, 223, 0.06);
      --xdl-font:    'JetBrains Mono', monospace;
    }

    /* ── Download button ── */
    .xdl-btn {
      position: absolute;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      background: var(--xdl-bg);
      border: 1px solid var(--xdl-border2);
      border-radius: 6px;
      cursor: pointer;
      font-family: var(--xdl-font);
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--xdl-fg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.5);
      transition: border-color 0.15s, box-shadow 0.15s, opacity 0.15s;
      opacity: 0;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }

    .xdl-btn:hover {
      border-color: rgba(179,162,213,0.5);
      box-shadow: 0 4px 16px rgba(0,0,0,0.6), 0 0 12px rgba(179,162,213,0.15);
    }

    .xdl-btn:active { transform: scale(0.94); }

    .xdl-btn.downloaded {
      border-color: rgba(255,188,169,0.35);
      color: var(--xdl-success);
    }

    .xdl-btn svg { width: 11px; height: 11px; flex-shrink: 0; }

    /* Show button on media hover */
    [data-xdl]:hover .xdl-btn,
    [data-xdl-vid]:hover .xdl-btn { opacity: 1; }

    /* Always show on touch */
    @media (hover: none) { .xdl-btn { opacity: 1; } }

    /* ── Hyprland notification ── */
    .xdl-notif-wrap {
      position: fixed;
      top: 18px; right: 18px;
      z-index: 2147483647;
      display: flex; flex-direction: column; gap: 8px;
      pointer-events: none;
      font-family: var(--xdl-font);
      max-width: calc(100vw - 24px);
    }

    @media (max-width: 480px) {
      .xdl-notif-wrap {
        top: auto; bottom: 80px;
        right: 0; left: 0;
        align-items: center;
        padding: 0 12px;
        max-width: 100vw;
      }
    }

    .xdl-notif {
      pointer-events: all;
      width: 320px; max-width: 100%;
      background: var(--xdl-bg);
      backdrop-filter: blur(24px) saturate(160%);
      -webkit-backdrop-filter: blur(24px) saturate(160%);
      border-radius: 11px;
      border: 1px solid var(--xdl-border);
      box-shadow: 0 2px 0 rgba(235,224,223,0.04) inset, 0 16px 48px rgba(0,0,0,0.65);
      overflow: hidden;
      color: var(--xdl-fg);
      opacity: 0;
      transform: translateX(calc(100% + 24px)) scale(0.96);
      transition: opacity 0.35s cubic-bezier(0.16,1,0.3,1), transform 0.35s cubic-bezier(0.16,1,0.3,1);
    }

    .xdl-notif.in  { opacity: 1; transform: translateX(0) scale(1); }
    .xdl-notif.out { opacity: 0; transform: translateX(calc(100% + 24px)) scale(0.96); transition: opacity 0.2s ease-in, transform 0.2s ease-in; }

    @media (max-width: 480px) {
      .xdl-notif { width: 100%; transform: translateY(20px) scale(0.97); }
      .xdl-notif.in  { opacity: 1; transform: translateY(0) scale(1); }
      .xdl-notif.out { opacity: 0; transform: translateY(20px) scale(0.97); transition: opacity 0.2s ease-in, transform 0.2s ease-in; }
    }

    .xdl-notif-accent { height: 2px; width: 100%; }
    .xdl-notif-accent.success { background: linear-gradient(90deg, var(--xdl-success), #ffdfd9); }
    .xdl-notif-accent.error   { background: linear-gradient(90deg, var(--xdl-error),   #ff8486); }
    .xdl-notif-accent.info    { background: linear-gradient(90deg, var(--xdl-accent),  #ef8f9a); }

    .xdl-notif-header {
      display: flex; align-items: center; gap: 7px;
      padding: 9px 11px 7px;
    }

    .xdl-notif-dot {
      width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
    }
    .xdl-notif-dot.success { background: var(--xdl-success); box-shadow: 0 0 6px var(--xdl-success); }
    .xdl-notif-dot.error   { background: var(--xdl-error);   box-shadow: 0 0 6px var(--xdl-error); }
    .xdl-notif-dot.info    { background: var(--xdl-accent);  box-shadow: 0 0 6px var(--xdl-accent); }

    .xdl-notif-app {
      font-size: 9px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
      color: var(--xdl-muted); flex: 1;
    }

    .xdl-notif-tag {
      font-size: 9px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
      padding: 1px 6px; border-radius: 3px;
    }
    .xdl-notif-tag.success { background: rgba(255,188,169,0.12); color: var(--xdl-success); }
    .xdl-notif-tag.error   { background: rgba(255,83,95,0.12);   color: var(--xdl-error); }
    .xdl-notif-tag.info    { background: rgba(179,162,213,0.12); color: var(--xdl-accent); }

    .xdl-notif-close {
      background: none; border: none; color: var(--xdl-dim); cursor: pointer;
      font-size: 14px; line-height: 1; padding: 4px 7px; margin: -4px -5px -4px 0;
      font-family: var(--xdl-font); transition: color 0.12s;
      -webkit-tap-highlight-color: transparent;
    }
    .xdl-notif-close:hover { color: var(--xdl-fg); }

    .xdl-notif-divider { height: 1px; background: var(--xdl-sep); margin: 0 11px; }

    .xdl-notif-body {
      padding: 9px 11px 4px;
      display: flex; gap: 9px; align-items: flex-start;
    }

    .xdl-notif-thumb {
      width: 42px; height: 42px; border-radius: 5px;
      object-fit: cover; flex-shrink: 0;
      border: 1px solid var(--xdl-border);
      background: rgba(255,255,255,0.04);
    }
    .xdl-notif-thumb-ph {
      width: 42px; height: 42px; border-radius: 5px; flex-shrink: 0;
      background: rgba(179,162,213,0.08); border: 1px solid var(--xdl-border);
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; opacity: 0.45;
    }

    .xdl-notif-text { flex: 1; min-width: 0; }
    .xdl-notif-title {
      font-size: 11px; font-weight: 600; color: var(--xdl-fg);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      line-height: 1.3; margin-bottom: 2px;
    }
    .xdl-notif-msg { font-size: 10px; color: var(--xdl-muted); line-height: 1.5; }

    .xdl-notif-meta {
      display: flex; flex-wrap: wrap; gap: 5px 0;
      padding: 7px 11px 9px;
    }
    .xdl-notif-meta-item {
      display: flex; align-items: center; gap: 4px;
      width: 50%; min-width: 0;
    }
    .xdl-notif-meta-item.full { width: 100%; }
    .xdl-notif-meta-label {
      font-size: 8px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
      color: var(--xdl-dim); white-space: nowrap;
    }
    .xdl-notif-meta-val {
      font-size: 9px; color: var(--xdl-muted);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0;
    }
    .xdl-notif-meta-val.accent { color: var(--xdl-accent); }

    .xdl-notif-bar { height: 1.5px; background: var(--xdl-sep); position: relative; overflow: hidden; }
    .xdl-notif-bar-fill { position: absolute; inset: 0; width: 100%; transform-origin: left; }
    .xdl-notif-bar-fill.success { background: var(--xdl-success); }
    .xdl-notif-bar-fill.error   { background: var(--xdl-error); }
    .xdl-notif-bar-fill.info    { background: var(--xdl-accent); }
  `);

  // ── Notification system ──────────────────────────────────────────────────────
  const Notify = (() => {
    let wrap = document.querySelector(".xdl-notif-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "xdl-notif-wrap";
      document.body.appendChild(wrap);
    }

    function show({ type = "info", title, message, thumbnail, meta = [], duration = CFG.notifDuration }) {
      const tags = { success: "Saved", error: "Failed", info: "DL" };
      const notif = document.createElement("div");
      notif.className = "xdl-notif";

      const thumbHTML = thumbnail
        ? `<img class="xdl-notif-thumb" src="${thumbnail}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'xdl-notif-thumb-ph',textContent:'⬡'}))">`
        : `<div class="xdl-notif-thumb-ph">⬡</div>`;

      const metaHTML = meta.map(m =>
        `<div class="xdl-notif-meta-item${m.full ? " full" : ""}">
          <span class="xdl-notif-meta-label">${m.k}</span>
          <span class="xdl-notif-meta-val${m.accent ? " accent" : ""}">${m.v}</span>
        </div>`
      ).join("");

      notif.innerHTML = `
        <div class="xdl-notif-accent ${type}"></div>
        <div class="xdl-notif-header">
          <span class="xdl-notif-dot ${type}"></span>
          <span class="xdl-notif-app">XDL</span>
          <span class="xdl-notif-tag ${type}">${tags[type]}</span>
          <button class="xdl-notif-close">×</button>
        </div>
        <div class="xdl-notif-divider"></div>
        <div class="xdl-notif-body">
          ${thumbHTML}
          <div class="xdl-notif-text">
            ${title ? `<div class="xdl-notif-title">${title}</div>` : ""}
            <div class="xdl-notif-msg">${message}</div>
          </div>
        </div>
        ${meta.length ? `<div class="xdl-notif-meta">${metaHTML}</div>` : ""}
        <div class="xdl-notif-bar"><div class="xdl-notif-bar-fill ${type}"></div></div>
      `;

      wrap.appendChild(notif);
      requestAnimationFrame(() => requestAnimationFrame(() => notif.classList.add("in")));

      const fill = notif.querySelector(".xdl-notif-bar-fill");
      requestAnimationFrame(() => {
        fill.style.transition = `transform ${duration}ms linear`;
        requestAnimationFrame(() => { fill.style.transform = "scaleX(0)"; });
      });

      const dismiss = () => {
        notif.classList.remove("in");
        notif.classList.add("out");
        setTimeout(() => notif.remove(), 220);
      };

      const timer = setTimeout(dismiss, duration);
      notif.querySelector(".xdl-notif-close").addEventListener("click", () => { clearTimeout(timer); dismiss(); });

      // swipe to dismiss
      let tx = 0, ty = 0;
      notif.addEventListener("touchstart", e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
      notif.addEventListener("touchmove", e => {
        const dx = e.touches[0].clientX - tx;
        if (Math.abs(dx) > Math.abs(e.touches[0].clientY - ty) && Math.abs(dx) > 8) {
          notif.style.transition = "transform 0.05s, opacity 0.05s";
          notif.style.transform = `translateX(${dx}px)`;
          notif.style.opacity = String(Math.max(0, 1 - Math.abs(dx) / 140));
        }
      }, { passive: true });
      notif.addEventListener("touchend", e => {
        const dx = e.changedTouches[0].clientX - tx;
        if (Math.abs(dx) > 80) { clearTimeout(timer); dismiss(); }
        else { notif.style.transition = ""; notif.style.transform = ""; notif.style.opacity = ""; }
      }, { passive: true });
    }

    return { show };
  })();

  // ── Utilities ────────────────────────────────────────────────────────────────
  function formatDate(ts) {
    const d = new Date(ts);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}.${m}.${day}`;
  }

  function renderTemplate(tpl, vars) {
    return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? k);
  }

  function getTweetId() {
    const m = location.pathname.match(/status\/(\d+)/);
    return m ? m[1] : null;
  }

  function getAuthor() {
    const m = location.pathname.match(/^\/([^/]+)\//);
    return m ? m[1] : "unknown";
  }

  function dlIcon() {
    return `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 2v8M5 7l3 3 3-3M2 13h12"/>
    </svg>`;
  }

  function checkIcon() {
    return `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="2 8 6 12 14 4"/>
    </svg>`;
  }

  // ── Image downloading ────────────────────────────────────────────────────────
  function bestImageUrl(src) {
    const base = src.split("?")[0].replace(/:(orig|large|medium|small|thumb)$/, "");
    return `${base}?format=jpg&name=${CFG.imageSize}`;
  }

  function imageFilename(src, tweetId, author) {
    const url  = new URL(src.split("?")[0]);
    const name = url.pathname.split("/").pop().replace(/\.\w+$/, "");
    const ext  = url.pathname.split(".").pop() || "jpg";
    const date = formatDate(Date.now());
    return renderTemplate(CFG.imageTemplate, { author, date, tweetId, name, ext });
  }

  function downloadImage(src, tweetId, author, btn, thumbUrl) {
    const url      = bestImageUrl(src);
    const filename = imageFilename(src, tweetId, author);
    const shortName = filename.length > 36 ? filename.slice(0, 34) + "…" : filename;

    btn.innerHTML = dlIcon() + "<span>DL…</span>";
    btn.style.pointerEvents = "none";

    try {
      GM_download({
        url,
        name: filename,
        headers: { "Referer": "https://x.com/" },
        onload: () => {
          History.add(tweetId + "_" + src.split("/").pop().split("?")[0]);
          btn.innerHTML = checkIcon() + "<span>Saved</span>";
          btn.classList.add("downloaded");
          btn.style.pointerEvents = "";
          Notify.show({
            type: "success",
            title: shortName,
            message: "Image saved.",
            thumbnail: thumbUrl || url,
            meta: [
              { k: "author", v: "@" + author, accent: true },
              { k: "tweet",  v: tweetId },
            ],
          });
        },
        onerror: () => {
          btn.innerHTML = dlIcon() + "<span>Retry</span>";
          btn.style.pointerEvents = "";
          Notify.show({ type: "error", title: shortName, message: "Download failed." });
        },
      });
    } catch {
      window.open(url, "_blank");
    }
  }

  // ── Video downloading ────────────────────────────────────────────────────────
  function getVideoFromPage() {
    const video = document.querySelector("video[src]");
    if (video?.src && video.src.startsWith("http")) return video.src;
    const source = document.querySelector("video source[src]");
    if (source?.src) return source.src;
    return null;
  }

  function videoFilename(src, tweetId, author) {
    const url  = new URL(src.split("?")[0]);
    const name = url.pathname.split("/").pop().replace(/\.\w+$/, "") || "video";
    const ext  = url.pathname.split(".").pop() || "mp4";
    const date = formatDate(Date.now());
    return renderTemplate(CFG.videoTemplate, { author, date, tweetId, name, ext });
  }

  function downloadVideo(src, tweetId, author, btn) {
    const filename  = videoFilename(src, tweetId, author);
    const shortName = filename.length > 36 ? filename.slice(0, 34) + "…" : filename;

    btn.innerHTML = dlIcon() + "<span>DL…</span>";
    btn.style.pointerEvents = "none";

    try {
      GM_download({
        url: src,
        name: filename,
        headers: { "Referer": "https://x.com/" },
        onload: () => {
          History.add(tweetId + "_video");
          btn.innerHTML = checkIcon() + "<span>Saved</span>";
          btn.classList.add("downloaded");
          btn.style.pointerEvents = "";
          Notify.show({
            type: "success",
            title: shortName,
            message: "Video saved.",
            meta: [
              { k: "author", v: "@" + author, accent: true },
              { k: "tweet",  v: tweetId },
              { k: "type",   v: src.includes("m3u8") ? "HLS" : "MP4" },
            ],
          });
        },
        onerror: () => {
          btn.innerHTML = dlIcon() + "<span>Retry</span>";
          btn.style.pointerEvents = "";
          Notify.show({ type: "error", title: shortName, message: "Video download failed." });
        },
        onprogress: p => {
          if (p.total) btn.querySelector("span").textContent = Math.round((p.loaded / p.total) * 100) + "%";
        },
      });
    } catch {
      window.open(src, "_blank");
    }
  }

  // ── Button injection ─────────────────────────────────────────────────────────
  function makeBtn(label) {
    const btn = document.createElement("button");
    btn.className = "xdl-btn";
    btn.innerHTML = dlIcon() + `<span>${label}</span>`;
    return btn;
  }

  function injectImageBtn(imgEl) {
    if (imgEl.dataset.xdlInject) return;
    imgEl.dataset.xdlInject = "1";

    const wrap = imgEl.closest("a, [role=link]") || imgEl.parentElement;
    if (!wrap) return;
    if (wrap.style.position === "" || wrap.style.position === "static") {
      wrap.style.position = "relative";
    }
    wrap.dataset.xdl = "1";

    const btn = makeBtn("Save");
    btn.style.bottom = "8px";
    btn.style.left   = "8px";

    const src     = imgEl.src || imgEl.dataset.src;
    const tweetId = getTweetId() || "unknown";
    const author  = getAuthor();
    const dedupKey = tweetId + "_" + (src || "").split("/").pop().split("?")[0];

    if (History.has(dedupKey)) {
      btn.innerHTML = checkIcon() + "<span>Saved</span>";
      btn.classList.add("downloaded");
    }

    btn.addEventListener("click", e => {
      e.stopPropagation();
      e.preventDefault();
      if (!src) return;
      downloadImage(src, tweetId, author, btn, bestImageUrl(src));
    });

    wrap.appendChild(btn);
  }

  function injectVideoBtn(videoEl) {
    if (videoEl.dataset.xdlInject) return;
    videoEl.dataset.xdlInject = "1";

    const wrap = videoEl.closest("[data-testid=videoPlayer]") || videoEl.parentElement;
    if (!wrap) return;
    if (!wrap.style.position || wrap.style.position === "static") wrap.style.position = "relative";
    wrap.dataset.xdlVid = "1";

    const btn = makeBtn("Save");
    btn.style.top   = "8px";
    btn.style.right = "8px";

    btn.addEventListener("click", e => {
      e.stopPropagation();
      e.preventDefault();
      const src = videoEl.src || videoEl.querySelector("source")?.src || getVideoFromPage();
      if (!src) {
        Notify.show({ type: "error", message: "Could not find video source." });
        return;
      }
      const tweetId = getTweetId() || "unknown";
      const author  = getAuthor();
      downloadVideo(src, tweetId, author, btn);
    });

    wrap.appendChild(btn);
  }

  // ── DOM observer ─────────────────────────────────────────────────────────────
  function scan() {
    // Images in tweets (not avatars/icons)
    document.querySelectorAll(
      'img[src*="pbs.twimg.com/media"], img[src*="pbs.twimg.com/tweet_video_thumb"]'
    ).forEach(img => {
      if (img.width < 80 || img.height < 80) return;
      injectImageBtn(img);
    });

    // Videos
    document.querySelectorAll("video").forEach(v => {
      if (v.dataset.xdlInject) return;
      injectVideoBtn(v);
    });
  }

  const ob = new MutationObserver(() => scan());
  ob.observe(document.body, { childList: true, subtree: true });
  scan();

})();
