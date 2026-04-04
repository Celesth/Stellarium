// ==UserScript==
// @name         AssetRip
// @namespace    https://github.com/Celesth
// @version      1.1.0
// @description  In-page asset ripper GUI — images, video, gif, yt-dlp/ffmpeg commands, source inspector, Discord debug
// @author       Celesth
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @connect      *
// ==/UserScript==

(function () {
  "use strict";

  const S = {
    webhookUrl:  GM_getValue("webhookUrl",  ""),
    debugMode:   GM_getValue("debugMode",   false),
    filterState: GM_getValue("filterState", "all"),
  };

  const STYLE_ID = "__ar_style__";
  if (!document.getElementById(STYLE_ID)) {
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');

      :root {
        --ar-bg:         #0c0c0c;
        --ar-bg2:        #141414;
        --ar-bg3:        #1e1e1e;
        --ar-border:     #2a2a2a;
        --ar-border2:    #383838;
        --ar-fg:         #f0f0f0;
        --ar-fg2:        #aaaaaa;
        --ar-fg3:        #555555;
        --ar-accent:     #f0f0f0;
        --ar-accent-inv: #0c0c0c;
        --ar-red:        #e05555;
        --ar-green:      #55aa77;
        --ar-shadow:     0 4px 32px rgba(0,0,0,0.6), 0 1px 6px rgba(0,0,0,0.4);
        --ar-radius:     6px;
        --ar-font:       'IBM Plex Mono', monospace;
        --ar-sz:         13px;
      }

      #ar-root * { box-sizing: border-box; font-family: var(--ar-font); }

      #ar-root {
        position: fixed;
        top: 48px;
        right: 16px;
        width: 420px;
        max-width: calc(100vw - 24px);
        max-height: calc(100vh - 64px);
        background: var(--ar-bg);
        border: 1px solid var(--ar-border2);
        border-radius: var(--ar-radius);
        box-shadow: var(--ar-shadow);
        display: flex;
        flex-direction: column;
        z-index: 2147483647;
        overflow: hidden;
        font-size: var(--ar-sz);
        color: var(--ar-fg);
        transition: transform 0.22s cubic-bezier(0.16,1,0.3,1), opacity 0.22s ease;
      }
      #ar-root.ar-hidden { transform: translateY(-8px) scale(0.98); opacity: 0; pointer-events: none; }

      @media (max-width: 480px) {
        #ar-root { top: auto; bottom: 72px; right: 8px; left: 8px; width: auto; max-height: 65vh; }
      }

      #ar-titlebar {
        display: flex; align-items: center; gap: 8px;
        padding: 8px 10px;
        background: var(--ar-fg);
        color: var(--ar-accent-inv);
        cursor: grab;
        user-select: none; -webkit-user-select: none;
        flex-shrink: 0;
      }
      #ar-titlebar:active { cursor: grabbing; }
      #ar-titlebar-title { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; flex: 1; }
      .ar-tbtn {
        background: rgba(0,0,0,0.15); border: 1px solid rgba(0,0,0,0.25);
        color: rgba(0,0,0,0.75); border-radius: 3px; cursor: pointer;
        font-size: 10px; font-family: var(--ar-font); padding: 2px 7px;
        transition: background 0.12s; -webkit-tap-highlight-color: transparent;
      }
      .ar-tbtn:hover { background: rgba(0,0,0,0.28); }
      .ar-tbtn.active { background: var(--ar-bg); color: var(--ar-fg); border-color: var(--ar-bg); }

      #ar-toolbar {
        display: flex; align-items: center; gap: 4px; flex-wrap: wrap;
        padding: 7px 10px; border-bottom: 1px solid var(--ar-border);
        background: var(--ar-bg2); flex-shrink: 0;
      }
      .ar-filter-btn {
        font-family: var(--ar-font); font-size: 10px; font-weight: 600;
        letter-spacing: 0.06em; text-transform: uppercase;
        padding: 3px 9px; border-radius: 3px; cursor: pointer;
        border: 1px solid var(--ar-border2); background: var(--ar-bg);
        color: var(--ar-fg2); transition: all 0.1s; -webkit-tap-highlight-color: transparent;
      }
      .ar-filter-btn:hover { border-color: var(--ar-fg); color: var(--ar-fg); }
      .ar-filter-btn.active { background: var(--ar-fg); color: var(--ar-accent-inv); border-color: var(--ar-fg); }

      #ar-toolbar-right { margin-left: auto; display: flex; gap: 4px; }
      .ar-icon-btn {
        font-family: var(--ar-font); font-size: 11px;
        padding: 3px 8px; border-radius: 3px; cursor: pointer;
        border: 1px solid var(--ar-border2); background: var(--ar-bg);
        color: var(--ar-fg2); transition: all 0.1s; -webkit-tap-highlight-color: transparent;
      }
      .ar-icon-btn:hover { border-color: var(--ar-fg); color: var(--ar-fg); }
      .ar-icon-btn.danger:hover { border-color: var(--ar-red); color: var(--ar-red); }

      #ar-stats {
        padding: 4px 10px; font-size: 10px; color: var(--ar-fg3);
        border-bottom: 1px solid var(--ar-border);
        background: var(--ar-bg2); flex-shrink: 0;
        display: flex; align-items: center; gap: 10px;
      }
      #ar-stats span { display: flex; align-items: center; gap: 3px; }
      #ar-scan-bar { margin-left: auto; height: 3px; width: 80px; background: var(--ar-bg3); border-radius: 2px; overflow: hidden; display: none; }
      #ar-scan-fill { height: 100%; background: var(--ar-fg); width: 0%; transition: width 0.3s; }

      #ar-grid {
        flex: 1; overflow-y: auto; overflow-x: hidden;
        padding: 8px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 6px;
        background: var(--ar-bg);
      }
      #ar-grid::-webkit-scrollbar { width: 5px; }
      #ar-grid::-webkit-scrollbar-track { background: var(--ar-bg2); }
      #ar-grid::-webkit-scrollbar-thumb { background: var(--ar-border2); border-radius: 3px; }

      @media (max-width: 480px) {
        #ar-grid { grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); }
      }

      .ar-empty {
        grid-column: 1/-1; text-align: center; padding: 32px 16px;
        color: var(--ar-fg3); font-size: 11px; line-height: 1.8;
      }

      .ar-card {
        border: 1px solid var(--ar-border); border-radius: 4px;
        overflow: hidden; cursor: pointer; position: relative;
        background: var(--ar-bg2);
        transition: border-color 0.12s, box-shadow 0.12s; -webkit-tap-highlight-color: transparent;
      }
      .ar-card:hover { border-color: var(--ar-border2); }
      .ar-card:hover .ar-card-actions { opacity: 1; }
      .ar-card.selected { border-color: var(--ar-fg); box-shadow: 0 0 0 2px var(--ar-fg); }

      .ar-card-media {
        width: 100%; aspect-ratio: 1; object-fit: cover; display: block;
        background: var(--ar-bg3);
      }
      .ar-card-media.loading { opacity: 0; transition: opacity 0.2s; }
      .ar-card-media.loaded  { opacity: 1; }

      .ar-card-placeholder {
        width: 100%; aspect-ratio: 1; background: var(--ar-bg3);
        display: flex; align-items: center; justify-content: center;
        font-size: 20px; color: var(--ar-fg3);
      }

      .ar-card-type {
        position: absolute; top: 4px; left: 4px;
        font-size: 8px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
        padding: 1px 5px; border-radius: 2px;
        background: rgba(12,12,12,0.85); color: var(--ar-fg);
      }

      .ar-card-check {
        position: absolute; top: 4px; right: 4px;
        width: 16px; height: 16px; border-radius: 2px;
        background: rgba(12,12,12,0.7); border: 1px solid var(--ar-border2);
        display: flex; align-items: center; justify-content: center;
        font-size: 10px; color: var(--ar-fg2); transition: background 0.1s;
      }
      .ar-card.selected .ar-card-check { background: var(--ar-fg); color: var(--ar-accent-inv); }

      .ar-card-actions {
        position: absolute; bottom: 0; left: 0; right: 0;
        display: flex; gap: 2px; padding: 4px;
        background: linear-gradient(to top, rgba(12,12,12,0.92) 0%, transparent 100%);
        opacity: 0; transition: opacity 0.15s;
      }
      .ar-card-action-btn {
        flex: 1; font-family: var(--ar-font); font-size: 8px; font-weight: 600;
        letter-spacing: 0.06em; text-transform: uppercase;
        padding: 3px 2px; border-radius: 2px; cursor: pointer;
        border: 1px solid rgba(255,255,255,0.18); background: rgba(12,12,12,0.7);
        color: rgba(255,255,255,0.8); transition: background 0.1s;
        -webkit-tap-highlight-color: transparent; white-space: nowrap;
      }
      .ar-card-action-btn:hover { background: rgba(255,255,255,0.15); }

      .ar-vid-overlay {
        position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
        background: rgba(0,0,0,0.3); pointer-events: none;
      }
      .ar-vid-play { font-size: 22px; color: rgba(255,255,255,0.85); }

      #ar-detail {
        border-top: 1px solid var(--ar-border); flex-shrink: 0;
        background: var(--ar-bg2); display: none; flex-direction: column;
        max-height: 220px;
      }
      #ar-detail.open { display: flex; }

      #ar-detail-tabs { display: flex; border-bottom: 1px solid var(--ar-border); }
      .ar-dtab {
        font-family: var(--ar-font); font-size: 10px; font-weight: 600;
        letter-spacing: 0.08em; text-transform: uppercase;
        padding: 6px 12px; cursor: pointer; border: none; background: none;
        color: var(--ar-fg3); border-bottom: 2px solid transparent;
        transition: color 0.1s, border-color 0.1s; -webkit-tap-highlight-color: transparent;
      }
      .ar-dtab.active { color: var(--ar-fg); border-bottom-color: var(--ar-fg); }

      .ar-dpanel { display: none; padding: 8px 10px; overflow-y: auto; flex: 1; }
      .ar-dpanel.active { display: block; }
      .ar-dpanel::-webkit-scrollbar { width: 4px; }
      .ar-dpanel::-webkit-scrollbar-thumb { background: var(--ar-border2); border-radius: 2px; }

      .ar-url-line {
        font-size: 10px; color: var(--ar-fg2); word-break: break-all;
        padding: 3px 0; border-bottom: 1px solid var(--ar-border); line-height: 1.5;
      }
      .ar-url-line:last-child { border-bottom: none; }

      .ar-cmd {
        font-size: 10px; background: var(--ar-bg3); border: 1px solid var(--ar-border);
        border-radius: 3px; padding: 6px 8px; margin-bottom: 6px;
        color: var(--ar-fg); line-height: 1.6; word-break: break-all;
        white-space: pre-wrap; position: relative; cursor: text;
      }
      .ar-cmd-label {
        font-size: 9px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
        color: var(--ar-fg3); margin-bottom: 3px;
      }
      .ar-copy-btn {
        position: absolute; top: 5px; right: 5px;
        font-family: var(--ar-font); font-size: 9px;
        padding: 2px 6px; border-radius: 2px; cursor: pointer;
        border: 1px solid var(--ar-border2); background: var(--ar-bg); color: var(--ar-fg2);
        transition: all 0.1s; -webkit-tap-highlight-color: transparent;
      }
      .ar-copy-btn:hover { border-color: var(--ar-fg); color: var(--ar-fg); }

      #ar-debug-panel {
        padding: 8px 10px; display: none; flex-direction: column; gap: 6px;
        border-bottom: 1px solid var(--ar-border); background: var(--ar-bg2);
      }
      #ar-debug-panel.open { display: flex; }

      .ar-input-row { display: flex; gap: 5px; align-items: center; }
      .ar-input-row label { font-size: 10px; color: var(--ar-fg3); white-space: nowrap; }
      .ar-input {
        flex: 1; font-family: var(--ar-font); font-size: 10px;
        padding: 4px 7px; border: 1px solid var(--ar-border2); border-radius: 3px;
        background: var(--ar-bg); color: var(--ar-fg); outline: none;
        transition: border-color 0.1s;
      }
      .ar-input:focus { border-color: var(--ar-fg); }

      .ar-toggle-row { display: flex; align-items: center; gap: 6px; font-size: 10px; color: var(--ar-fg2); cursor: pointer; }
      .ar-toggle {
        width: 28px; height: 16px; border-radius: 8px;
        background: var(--ar-bg3); border: 1px solid var(--ar-border2);
        position: relative; transition: background 0.15s; flex-shrink: 0;
      }
      .ar-toggle::after {
        content: ''; position: absolute; top: 2px; left: 2px;
        width: 10px; height: 10px; border-radius: 50%;
        background: var(--ar-fg3); transition: transform 0.15s, background 0.15s;
      }
      .ar-toggle.on { background: var(--ar-fg); border-color: var(--ar-fg); }
      .ar-toggle.on::after { transform: translateX(12px); background: var(--ar-accent-inv); }

      .ar-log {
        font-size: 9px; background: var(--ar-bg); color: #88cc88;
        border: 1px solid var(--ar-border); border-radius: 3px;
        padding: 6px 8px; max-height: 80px;
        overflow-y: auto; line-height: 1.7; white-space: pre-wrap; word-break: break-all;
      }
      .ar-log-err  { color: #e08888; }
      .ar-log-info { color: #8899cc; }

      #ar-fab {
        position: fixed; bottom: 24px; right: 20px; z-index: 2147483646;
        width: 44px; height: 44px; border-radius: 10px;
        background: #f0f0f0; border: 1px solid #ccc;
        box-shadow: 0 4px 16px rgba(0,0,0,0.25);
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: transform 0.15s, box-shadow 0.15s;
        -webkit-tap-highlight-color: transparent; touch-action: manipulation;
        user-select: none; -webkit-user-select: none;
      }
      #ar-fab:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
      #ar-fab:active { transform: scale(0.93); }
      #ar-fab svg { width: 18px; height: 18px; }

      @media (max-width: 480px) {
        #ar-fab { width: 50px; height: 50px; border-radius: 12px; bottom: max(16px, env(safe-area-inset-bottom, 16px)); right: 14px; }
        #ar-fab svg { width: 22px; height: 22px; }
      }

      #ar-selbar {
        display: none; align-items: center; gap: 6px; flex-wrap: wrap;
        padding: 6px 10px; border-top: 1px solid var(--ar-border);
        background: var(--ar-bg2); flex-shrink: 0; font-size: 10px; color: var(--ar-fg2);
      }
      #ar-selbar.visible { display: flex; }
      .ar-selact {
        font-family: var(--ar-font); font-size: 10px; font-weight: 600;
        padding: 3px 9px; border-radius: 3px; cursor: pointer;
        border: 1px solid var(--ar-border2); background: var(--ar-bg); color: var(--ar-fg);
        -webkit-tap-highlight-color: transparent; transition: all 0.1s;
      }
      .ar-selact:hover { background: var(--ar-fg); color: var(--ar-accent-inv); border-color: var(--ar-fg); }

      /* ── Source Inspector Modal ── */
      #ar-inspect-overlay {
        display: none; position: fixed; inset: 0;
        background: rgba(0,0,0,0.72); z-index: 2147483648;
        align-items: center; justify-content: center; padding: 16px;
      }
      #ar-inspect-overlay.open { display: flex; }

      #ar-inspect-modal {
        width: 520px; max-width: 100%; max-height: 85vh;
        background: var(--ar-bg); border: 1px solid var(--ar-border2);
        border-radius: var(--ar-radius);
        box-shadow: 0 16px 64px rgba(0,0,0,0.8);
        display: flex; flex-direction: column; overflow: hidden;
        animation: ar-modal-in 0.2s cubic-bezier(0.16,1,0.3,1);
      }
      @keyframes ar-modal-in {
        from { opacity: 0; transform: scale(0.96) translateY(8px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }

      #ar-inspect-header {
        display: flex; align-items: center; gap: 8px;
        padding: 8px 12px; background: var(--ar-fg); flex-shrink: 0;
      }
      #ar-inspect-header-title {
        font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
        color: var(--ar-accent-inv); flex: 1;
      }
      .ar-inspect-close {
        font-family: var(--ar-font); font-size: 13px;
        background: none; border: none; color: rgba(0,0,0,0.6); cursor: pointer;
        padding: 2px 6px; border-radius: 3px; transition: color 0.1s;
        -webkit-tap-highlight-color: transparent;
      }
      .ar-inspect-close:hover { color: rgba(0,0,0,0.9); }

      #ar-inspect-preview {
        background: var(--ar-bg3); flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        min-height: 120px; max-height: 200px; overflow: hidden; position: relative;
      }
      #ar-inspect-preview img,
      #ar-inspect-preview video {
        max-width: 100%; max-height: 200px; object-fit: contain; display: block;
      }
      #ar-inspect-preview .ar-inspect-preview-placeholder {
        font-size: 40px; opacity: 0.25;
      }
      #ar-inspect-preview-badge {
        position: absolute; top: 8px; left: 8px;
        font-size: 8px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
        padding: 2px 6px; border-radius: 2px;
        background: rgba(12,12,12,0.85); color: var(--ar-fg);
      }

      #ar-inspect-body { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
      #ar-inspect-body::-webkit-scrollbar { width: 4px; }
      #ar-inspect-body::-webkit-scrollbar-thumb { background: var(--ar-border2); border-radius: 2px; }

      .ar-inspect-section { display: flex; flex-direction: column; gap: 4px; }
      .ar-inspect-section-title {
        font-size: 9px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
        color: var(--ar-fg3); padding-bottom: 4px; border-bottom: 1px solid var(--ar-border);
      }
      .ar-inspect-row {
        display: grid; grid-template-columns: 90px 1fr; gap: 6px; align-items: start;
        font-size: 10px; line-height: 1.5;
      }
      .ar-inspect-key { color: var(--ar-fg3); }
      .ar-inspect-val { color: var(--ar-fg2); word-break: break-all; }
      .ar-inspect-val.mono { font-family: var(--ar-font); color: var(--ar-fg); }
      .ar-inspect-val.dim  { color: var(--ar-fg3); font-style: italic; }

      #ar-inspect-actions {
        display: flex; flex-wrap: wrap; gap: 5px;
        padding: 10px 12px; border-top: 1px solid var(--ar-border);
        background: var(--ar-bg2); flex-shrink: 0;
      }
      .ar-inspect-action {
        font-family: var(--ar-font); font-size: 10px; font-weight: 600;
        letter-spacing: 0.06em; text-transform: uppercase;
        padding: 4px 10px; border-radius: 3px; cursor: pointer;
        border: 1px solid var(--ar-border2); background: var(--ar-bg); color: var(--ar-fg2);
        transition: all 0.1s; -webkit-tap-highlight-color: transparent;
      }
      .ar-inspect-action:hover { border-color: var(--ar-fg); color: var(--ar-fg); }
      .ar-inspect-action.primary { background: var(--ar-fg); color: var(--ar-accent-inv); border-color: var(--ar-fg); }
      .ar-inspect-action.primary:hover { opacity: 0.88; }
    `;
    document.head.appendChild(el);
  }

  const MEDIA_EXT = /\.(jpe?g|png|gif|webp|avif|svg|mp4|webm|mov|m4v|ogv|avi|mkv)(\?[^"']*)?$/i;
  const IMG_EXT   = /\.(jpe?g|png|gif|webp|avif|svg)(\?[^"']*)?$/i;
  const VID_EXT   = /\.(mp4|webm|mov|m4v|ogv|avi|mkv)(\?[^"']*)?$/i;
  const GIF_EXT   = /\.gif(\?[^"']*)?$/i;

  function typeOf(url) {
    if (GIF_EXT.test(url)) return "gif";
    if (VID_EXT.test(url)) return "vid";
    if (IMG_EXT.test(url)) return "img";
    return "img";
  }

  function dedup(arr) {
    const seen = new Set();
    return arr.filter(item => {
      const k = item.url.split("?")[0];
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  function absUrl(raw) {
    try { return new URL(raw, location.href).href; } catch { return null; }
  }

  function scanPage() {
    const found = [];
    const addUrl = (raw, sourceEl) => {
      if (!raw) return;
      const url = absUrl(raw);
      if (!url) return;
      if (!MEDIA_EXT.test(url.split("?")[0])) return;
      found.push({ url, type: typeOf(url), sourceEl: sourceEl || null });
    };

    document.querySelectorAll("img[src]").forEach(el => addUrl(el.src, el));
    document.querySelectorAll("img[data-src]").forEach(el => addUrl(el.dataset.src, el));
    document.querySelectorAll("img[srcset]").forEach(el => {
      el.srcset.split(",").forEach(s => addUrl(s.trim().split(" ")[0], el));
    });
    document.querySelectorAll("source[src]").forEach(el => addUrl(el.src, el));
    document.querySelectorAll("source[srcset]").forEach(el => {
      el.srcset.split(",").forEach(s => addUrl(s.trim().split(" ")[0], el));
    });
    document.querySelectorAll("video[src]").forEach(el => addUrl(el.src, el));
    document.querySelectorAll("video[poster]").forEach(el => addUrl(el.poster, el));
    document.querySelectorAll("a[href]").forEach(el => { if (MEDIA_EXT.test(el.href)) addUrl(el.href, el); });
    document.querySelectorAll("[style]").forEach(el => {
      const m = el.style.backgroundImage?.match(/url\(["']?([^"')]+)["']?\)/);
      if (m) addUrl(m[1], el);
    });

    const rawHtml = document.documentElement.innerHTML;
    const urlRe = /https?:\/\/[^\s"'<>]+?\.(?:jpe?g|png|gif|webp|mp4|webm|mov)(\?[^"'\s<>]*)?/gi;
    let m;
    while ((m = urlRe.exec(rawHtml)) !== null) addUrl(m[0], null);

    return dedup(found);
  }

  let allAssets   = [];
  let selected    = new Set();
  let activeFilter = S.filterState;
  let activeTab    = "urls";
  let focusedAsset = null;
  let debugOpen    = false;
  let logLines     = [];
  let guiVisible   = true;

  const log = (msg, type = "info") => {
    const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logLines.push({ line, type });
    if (logLines.length > 80) logLines.shift();
    renderLog();
    if (S.debugMode && S.webhookUrl) {
      GM_xmlhttpRequest({
        method: "POST", url: S.webhookUrl,
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify({ embeds: [{ description: `\`\`\`\n${line}\n\`\`\``, color: type === "err" ? 0xe05555 : 0x8899cc, footer: { text: "AssetRip Debug" } }] }),
      });
    }
  };

  function renderLog() {
    const el = document.getElementById("ar-log");
    if (!el) return;
    el.innerHTML = logLines.slice(-20).map(l => `<span class="ar-log-${l.type}">${escHtml(l.line)}</span>`).join("\n");
    el.scrollTop = el.scrollHeight;
  }

  function filteredAssets() {
    if (activeFilter === "all") return allAssets;
    return allAssets.filter(a => a.type === activeFilter);
  }

  function buildYtdlp(url) {
    const cookies = document.cookie ? `--add-header "Cookie:${document.cookie}" ` : "";
    const origin  = `--add-header "Origin:${location.origin}" --add-header "Referer:${location.href}" `;
    return `yt-dlp ${origin}${cookies}-o "%(title)s.%(ext)s" "${url}"`;
  }

  function buildFfmpeg(url) {
    const headers = [
      `User-Agent: ${navigator.userAgent}`,
      `Referer: ${location.href}`,
      `Origin: ${location.origin}`,
      ...(document.cookie ? [`Cookie: ${document.cookie}`] : []),
    ].map(h => `-headers $'${h}\\r\\n'`).join(" ");
    return `ffmpeg ${headers} -i "${url}" -c copy output.mp4`;
  }

  function copyText(text, btn) {
    navigator.clipboard?.writeText(text).then(() => {
      const orig = btn.textContent;
      btn.textContent = "✓";
      setTimeout(() => { btn.textContent = orig; }, 1200);
    }).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); ta.remove();
      const orig = btn.textContent;
      btn.textContent = "✓";
      setTimeout(() => { btn.textContent = orig; }, 1200);
    });
  }

  function escHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function fileSizeStr(bytes) {
    if (!bytes) return "unknown";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(2) + " MB";
  }

  /* ── Source Inspector ── */
  function openInspector(asset) {
    const overlay = document.getElementById("ar-inspect-overlay");
    if (!overlay) return;

    const url      = asset.url;
    const type     = asset.type;
    const srcEl    = asset.sourceEl;
    const parsed   = (() => { try { return new URL(url); } catch { return null; } })();
    const filename = parsed ? parsed.pathname.split("/").pop() : url.split("/").pop();
    const ext      = filename.split(".").pop().toUpperCase();
    const isVid    = type === "vid";

    document.getElementById("ar-inspect-header-title").textContent = "Source Inspector";

    const preview = document.getElementById("ar-inspect-preview");
    preview.innerHTML = `<div class="ar-inspect-preview-placeholder">${isVid ? "🎬" : "🖼"}</div><div id="ar-inspect-preview-badge">${type}</div>`;

    if (isVid) {
      const v = document.createElement("video");
      v.src = url; v.controls = true; v.preload = "metadata";
      v.style.maxWidth = "100%"; v.style.maxHeight = "200px";
      preview.replaceChild(v, preview.firstChild);
    } else {
      const img = document.createElement("img");
      img.src = url;
      img.onload = () => {
        preview.replaceChild(img, preview.firstChild);
        document.getElementById("ar-inspect-dim").textContent = `${img.naturalWidth} × ${img.naturalHeight}px`;
      };
      img.onerror = () => {};
    }

    let sourceTag = "—";
    let sourceId  = "—";
    let sourceCls = "—";
    let sourceParent = "—";
    let sourceAttr = "—";

    if (srcEl) {
      sourceTag    = srcEl.tagName.toLowerCase();
      sourceId     = srcEl.id || "—";
      sourceCls    = srcEl.className ? srcEl.className.trim().split(/\s+/).slice(0, 4).join(" ") : "—";
      sourceParent = srcEl.parentElement ? srcEl.parentElement.tagName.toLowerCase() + (srcEl.parentElement.id ? `#${srcEl.parentElement.id}` : srcEl.parentElement.className ? `.${srcEl.parentElement.className.trim().split(/\s+/)[0]}` : "") : "—";
      const attrMap = { img: "src", video: "src", source: "src", a: "href" };
      sourceAttr   = attrMap[sourceTag] || "style/data";
    }

    const body = document.getElementById("ar-inspect-body");
    body.innerHTML = `
      <div class="ar-inspect-section">
        <div class="ar-inspect-section-title">File</div>
        <div class="ar-inspect-row"><span class="ar-inspect-key">filename</span><span class="ar-inspect-val mono">${escHtml(filename)}</span></div>
        <div class="ar-inspect-row"><span class="ar-inspect-key">extension</span><span class="ar-inspect-val mono">${escHtml(ext)}</span></div>
        <div class="ar-inspect-row"><span class="ar-inspect-key">type</span><span class="ar-inspect-val">${type}</span></div>
        <div class="ar-inspect-row"><span class="ar-inspect-key">dimensions</span><span class="ar-inspect-val" id="ar-inspect-dim">${isVid ? "—" : "loading…"}</span></div>
      </div>
      <div class="ar-inspect-section">
        <div class="ar-inspect-section-title">URL</div>
        <div class="ar-inspect-row"><span class="ar-inspect-key">host</span><span class="ar-inspect-val mono">${escHtml(parsed?.hostname || "—")}</span></div>
        <div class="ar-inspect-row"><span class="ar-inspect-key">path</span><span class="ar-inspect-val mono">${escHtml(parsed?.pathname || "—")}</span></div>
        <div class="ar-inspect-row"><span class="ar-inspect-key">query</span><span class="ar-inspect-val mono ${parsed?.search ? "" : "dim"}">${escHtml(parsed?.search || "none")}</span></div>
        <div class="ar-inspect-row"><span class="ar-inspect-key">protocol</span><span class="ar-inspect-val">${escHtml(parsed?.protocol || "—")}</span></div>
        <div class="ar-inspect-row"><span class="ar-inspect-key">full url</span><span class="ar-inspect-val mono" style="font-size:9px">${escHtml(url)}</span></div>
      </div>
      <div class="ar-inspect-section">
        <div class="ar-inspect-section-title">DOM Source</div>
        <div class="ar-inspect-row"><span class="ar-inspect-key">element</span><span class="ar-inspect-val mono">${escHtml(sourceTag)}</span></div>
        <div class="ar-inspect-row"><span class="ar-inspect-key">id</span><span class="ar-inspect-val mono ${sourceId === "—" ? "dim" : ""}">${escHtml(sourceId)}</span></div>
        <div class="ar-inspect-row"><span class="ar-inspect-key">classes</span><span class="ar-inspect-val mono ${sourceCls === "—" ? "dim" : ""}" style="font-size:9px">${escHtml(sourceCls)}</span></div>
        <div class="ar-inspect-row"><span class="ar-inspect-key">parent</span><span class="ar-inspect-val mono">${escHtml(sourceParent)}</span></div>
        <div class="ar-inspect-row"><span class="ar-inspect-key">via attr</span><span class="ar-inspect-val mono">${escHtml(sourceAttr)}</span></div>
      </div>
      <div class="ar-inspect-section">
        <div class="ar-inspect-section-title">Page Context</div>
        <div class="ar-inspect-row"><span class="ar-inspect-key">page</span><span class="ar-inspect-val mono" style="font-size:9px">${escHtml(location.hostname)}</span></div>
        <div class="ar-inspect-row"><span class="ar-inspect-key">referer</span><span class="ar-inspect-val mono" style="font-size:9px">${escHtml(location.href.slice(0, 80))}${location.href.length > 80 ? "…" : ""}</span></div>
        <div class="ar-inspect-row"><span class="ar-inspect-key">cookies</span><span class="ar-inspect-val ${document.cookie ? "" : "dim"}">${document.cookie ? "present" : "none"}</span></div>
      </div>
    `;

    const actions = document.getElementById("ar-inspect-actions");
    actions.innerHTML = "";

    const makeBtn = (label, cls, fn) => {
      const b = document.createElement("button");
      b.className = `ar-inspect-action${cls ? " " + cls : ""}`;
      b.textContent = label;
      b.addEventListener("click", fn);
      actions.appendChild(b);
    };

    makeBtn("Copy URL", "primary", () => copyText(url, actions.querySelector(".primary")));
    makeBtn("yt-dlp cmd", "", () => copyText(buildYtdlp(url), actions.lastChild));
    makeBtn("ffmpeg cmd", "", () => copyText(buildFfmpeg(url), actions.lastChild));
    makeBtn("Open", "", () => window.open(url, "_blank"));
    if (srcEl) {
      makeBtn("Scroll to element", "", () => {
        closeInspector();
        srcEl.scrollIntoView({ behavior: "smooth", block: "center" });
        const orig = srcEl.style.outline;
        srcEl.style.outline = "2px solid #f0f0f0";
        setTimeout(() => { srcEl.style.outline = orig; }, 2000);
      });
    }
    makeBtn("Select in grid", "", () => {
      selected.add(url);
      closeInspector();
      renderGrid();
      updateSelBar();
    });

    overlay.classList.add("open");
    log(`Inspecting: ${filename} (${type}) from ${parsed?.hostname || "unknown"}`);
  }

  function closeInspector() {
    document.getElementById("ar-inspect-overlay")?.classList.remove("open");
  }

  function renderGrid() {
    const grid = document.getElementById("ar-grid");
    if (!grid) return;
    const assets = filteredAssets();
    grid.innerHTML = "";

    if (!assets.length) {
      grid.innerHTML = `<div class="ar-empty">No ${activeFilter === "all" ? "" : activeFilter + " "}assets found.<br>Press Scan to search the page.</div>`;
      return;
    }

    assets.forEach((asset) => {
      const card = document.createElement("div");
      card.className = "ar-card" + (selected.has(asset.url) ? " selected" : "");
      card.dataset.url = asset.url;

      const isVid = asset.type === "vid";
      const mediaHTML = isVid
        ? `<img class="ar-card-media loading" data-src="${escHtml(asset.url)}" alt=""><div class="ar-vid-overlay"><span class="ar-vid-play">▶</span></div>`
        : `<img class="ar-card-media loading" data-src="${escHtml(asset.url)}" alt="">`;

      card.innerHTML = `
        ${mediaHTML}
        <div class="ar-card-type">${asset.type}</div>
        <div class="ar-card-check">${selected.has(asset.url) ? "✓" : ""}</div>
        <div class="ar-card-actions">
          <button class="ar-card-action-btn ar-card-inspect">info</button>
          <button class="ar-card-action-btn ar-card-open">open</button>
        </div>
      `;

      const img = card.querySelector(".ar-card-media");
      if (img) {
        const io = new IntersectionObserver((entries, obs) => {
          entries.forEach(e => {
            if (e.isIntersecting) {
              img.src = img.dataset.src;
              img.onload  = () => img.classList.replace("loading", "loaded");
              img.onerror = () => {
                img.style.display = "none";
                const ph = document.createElement("div");
                ph.className = "ar-card-placeholder";
                ph.textContent = isVid ? "🎬" : "🖼";
                card.prepend(ph);
              };
              obs.disconnect();
            }
          });
        }, { root: grid, threshold: 0.01 });
        io.observe(card);
      }

      card.addEventListener("click", (e) => {
        if (e.target.classList.contains("ar-card-inspect")) {
          e.stopPropagation();
          openInspector(asset);
          return;
        }
        if (e.target.classList.contains("ar-card-open")) {
          e.stopPropagation();
          window.open(asset.url, "_blank");
          return;
        }
        const url = asset.url;
        if (selected.has(url)) selected.delete(url);
        else selected.add(url);
        card.classList.toggle("selected");
        card.querySelector(".ar-card-check").textContent = selected.has(url) ? "✓" : "";
        updateSelBar();
      });

      card.addEventListener("dblclick", (e) => { e.preventDefault(); openInspector(asset); });

      let longPressTimer;
      card.addEventListener("touchstart", () => { longPressTimer = setTimeout(() => openInspector(asset), 500); }, { passive: true });
      card.addEventListener("touchend",   () => clearTimeout(longPressTimer), { passive: true });
      card.addEventListener("touchmove",  () => clearTimeout(longPressTimer), { passive: true });

      grid.appendChild(card);
    });

    const statsEl = document.getElementById("ar-count");
    if (statsEl) statsEl.textContent = `${assets.length} assets`;
  }

  function updateSelBar() {
    const bar = document.getElementById("ar-selbar");
    if (!bar) return;
    const count = selected.size;
    if (count === 0) { bar.classList.remove("visible"); return; }
    bar.classList.add("visible");
    document.getElementById("ar-sel-count").textContent = `${count} selected`;
  }

  function openDetail(asset) {
    focusedAsset = asset;
    const panel = document.getElementById("ar-detail");
    if (!panel) return;
    panel.classList.add("open");
    renderDetailTab(activeTab);
  }

  function renderDetailTab(tab) {
    activeTab = tab;
    document.querySelectorAll(".ar-dtab").forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
    document.querySelectorAll(".ar-dpanel").forEach(p => p.classList.toggle("active", p.dataset.panel === tab));

    if (!focusedAsset) return;
    const { url } = focusedAsset;

    if (tab === "urls") {
      const p = document.getElementById("ar-panel-urls");
      const sel = selected.size > 0 ? [...selected] : [url];
      p.innerHTML = sel.map(u => `<div class="ar-url-line">${escHtml(u)}</div>`).join("");
    }

    if (tab === "ytdlp") {
      const p = document.getElementById("ar-panel-ytdlp");
      const sel = selected.size > 0 ? [...selected] : [url];
      p.innerHTML = sel.map((u, i) => {
        const cmd = buildYtdlp(u);
        return `<div class="ar-cmd-label">yt-dlp</div><div class="ar-cmd">${escHtml(cmd)}<button class="ar-copy-btn">copy</button></div>`;
      }).join("");
      p.querySelectorAll(".ar-copy-btn").forEach((btn, i) => {
        btn.addEventListener("click", () => copyText(buildYtdlp((selected.size > 0 ? [...selected] : [url])[i] ?? url), btn));
      });
    }

    if (tab === "ffmpeg") {
      const p = document.getElementById("ar-panel-ffmpeg");
      const sel = selected.size > 0 ? [...selected] : [url];
      p.innerHTML = sel.map((u) => {
        const cmd = buildFfmpeg(u);
        return `<div class="ar-cmd-label">ffmpeg</div><div class="ar-cmd">${escHtml(cmd)}<button class="ar-copy-btn">copy</button></div>`;
      }).join("");
      p.querySelectorAll(".ar-copy-btn").forEach((btn, i) => {
        btn.addEventListener("click", () => copyText(buildFfmpeg((selected.size > 0 ? [...selected] : [url])[i] ?? url), btn));
      });
    }
  }

  function buildGUI() {
    if (document.getElementById("ar-root")) return;

    const root = document.createElement("div");
    root.id = "ar-root";
    if (!guiVisible) root.classList.add("ar-hidden");

    root.innerHTML = `
      <div id="ar-titlebar">
        <span id="ar-titlebar-title">AssetRip</span>
        <button class="ar-tbtn" id="ar-scan-btn">Scan</button>
        <button class="ar-tbtn" id="ar-debug-btn">Debug</button>
        <button class="ar-tbtn" id="ar-close-btn">×</button>
      </div>

      <div id="ar-toolbar">
        <button class="ar-filter-btn ${activeFilter === "all" ? "active" : ""}" data-filter="all">All</button>
        <button class="ar-filter-btn ${activeFilter === "img" ? "active" : ""}" data-filter="img">IMG</button>
        <button class="ar-filter-btn ${activeFilter === "gif" ? "active" : ""}" data-filter="gif">GIF</button>
        <button class="ar-filter-btn ${activeFilter === "vid" ? "active" : ""}" data-filter="vid">VID</button>
        <div id="ar-toolbar-right">
          <button class="ar-icon-btn" id="ar-sel-all">all</button>
          <button class="ar-icon-btn" id="ar-sel-none">none</button>
          <button class="ar-icon-btn danger" id="ar-clear-btn">clear</button>
        </div>
      </div>

      <div id="ar-stats">
        <span id="ar-count">0 assets</span>
        <span id="ar-dedup-info"></span>
        <div id="ar-scan-bar"><div id="ar-scan-fill"></div></div>
      </div>

      <div id="ar-debug-panel">
        <div class="ar-input-row">
          <label>Webhook</label>
          <input class="ar-input" id="ar-webhook-input" type="text" placeholder="https://discord.com/api/webhooks/..." value="${escHtml(S.webhookUrl)}">
        </div>
        <label class="ar-toggle-row">
          <div class="ar-toggle ${S.debugMode ? "on" : ""}" id="ar-debug-toggle"></div>
          Send debug logs to webhook
        </label>
        <div class="ar-log" id="ar-log"></div>
      </div>

      <div id="ar-grid"><div class="ar-empty">Press Scan to find assets on this page.</div></div>

      <div id="ar-detail">
        <div id="ar-detail-tabs">
          <button class="ar-dtab active" data-tab="urls">URLs</button>
          <button class="ar-dtab" data-tab="ytdlp">yt-dlp</button>
          <button class="ar-dtab" data-tab="ffmpeg">ffmpeg</button>
          <button class="ar-dtab" style="margin-left:auto" id="ar-detail-close">✕</button>
        </div>
        <div class="ar-dpanel active" id="ar-panel-urls" data-panel="urls"></div>
        <div class="ar-dpanel" id="ar-panel-ytdlp" data-panel="ytdlp"></div>
        <div class="ar-dpanel" id="ar-panel-ffmpeg" data-panel="ffmpeg"></div>
      </div>

      <div id="ar-selbar">
        <span id="ar-sel-count">0 selected</span>
        <button class="ar-selact" id="ar-copy-urls-btn">Copy URLs</button>
        <button class="ar-selact" id="ar-open-detail-btn">Commands ↑</button>
      </div>
    `;

    document.body.appendChild(root);

    const inspectOverlay = document.createElement("div");
    inspectOverlay.id = "ar-inspect-overlay";
    inspectOverlay.innerHTML = `
      <div id="ar-inspect-modal">
        <div id="ar-inspect-header">
          <span id="ar-inspect-header-title">Source Inspector</span>
          <button class="ar-inspect-close" id="ar-inspect-close-btn">✕</button>
        </div>
        <div id="ar-inspect-preview">
          <div class="ar-inspect-preview-placeholder">⬡</div>
          <div id="ar-inspect-preview-badge">—</div>
        </div>
        <div id="ar-inspect-body"></div>
        <div id="ar-inspect-actions"></div>
      </div>
    `;
    document.body.appendChild(inspectOverlay);

    inspectOverlay.addEventListener("click", (e) => { if (e.target === inspectOverlay) closeInspector(); });
    document.getElementById("ar-inspect-close-btn").addEventListener("click", closeInspector);

    document.getElementById("ar-close-btn").addEventListener("click", () => {
      guiVisible = false; root.classList.add("ar-hidden");
    });

    document.getElementById("ar-scan-btn").addEventListener("click", () => {
      const bar = document.getElementById("ar-scan-bar");
      const fill = document.getElementById("ar-scan-fill");
      bar.style.display = "block"; fill.style.width = "30%";
      setTimeout(() => { fill.style.width = "70%"; }, 120);
      setTimeout(() => {
        allAssets = scanPage();
        fill.style.width = "100%";
        setTimeout(() => { bar.style.display = "none"; fill.style.width = "0%"; }, 300);
        document.getElementById("ar-dedup-info").textContent = "(deduped)";
        log(`Scan: ${allAssets.length} assets on ${location.hostname}`);
        renderGrid();
      }, 200);
    });

    document.getElementById("ar-debug-btn").addEventListener("click", () => {
      debugOpen = !debugOpen;
      document.getElementById("ar-debug-panel").classList.toggle("open", debugOpen);
      document.getElementById("ar-debug-btn").classList.toggle("active", debugOpen);
    });

    document.getElementById("ar-webhook-input").addEventListener("input", e => {
      S.webhookUrl = e.target.value.trim(); GM_setValue("webhookUrl", S.webhookUrl);
    });

    document.getElementById("ar-debug-toggle").addEventListener("click", () => {
      S.debugMode = !S.debugMode; GM_setValue("debugMode", S.debugMode);
      document.getElementById("ar-debug-toggle").classList.toggle("on", S.debugMode);
    });

    document.querySelectorAll(".ar-filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        activeFilter = btn.dataset.filter; GM_setValue("filterState", activeFilter);
        document.querySelectorAll(".ar-filter-btn").forEach(b => b.classList.toggle("active", b.dataset.filter === activeFilter));
        renderGrid();
      });
    });

    document.getElementById("ar-sel-all").addEventListener("click", () => {
      filteredAssets().forEach(a => selected.add(a.url)); renderGrid(); updateSelBar();
    });
    document.getElementById("ar-sel-none").addEventListener("click", () => {
      selected.clear(); renderGrid(); updateSelBar();
    });
    document.getElementById("ar-clear-btn").addEventListener("click", () => {
      allAssets = []; selected.clear(); renderGrid(); updateSelBar();
      document.getElementById("ar-detail").classList.remove("open");
      document.getElementById("ar-dedup-info").textContent = "";
    });

    document.querySelectorAll(".ar-dtab").forEach(tab => {
      tab.addEventListener("click", () => {
        if (tab.id === "ar-detail-close") document.getElementById("ar-detail").classList.remove("open");
        else renderDetailTab(tab.dataset.tab);
      });
    });

    document.getElementById("ar-copy-urls-btn").addEventListener("click", () => {
      const btn = document.getElementById("ar-copy-urls-btn");
      copyText([...selected].join("\n"), btn);
      log(`Copied ${selected.size} URLs`);
    });

    document.getElementById("ar-open-detail-btn").addEventListener("click", () => {
      if (selected.size > 0) {
        focusedAsset = allAssets.find(a => selected.has(a.url)) || null;
        openDetail(focusedAsset || allAssets[0]);
      }
    });

    makeDraggable(root, document.getElementById("ar-titlebar"));
    renderLog();
  }

  function makeDraggable(el, handle) {
    let ox = 0, oy = 0, dragging = false;
    const onDown = (cx, cy) => {
      dragging = true;
      const r = el.getBoundingClientRect(); ox = cx - r.left; oy = cy - r.top;
      el.style.transition = "none";
    };
    const onMove = (cx, cy) => {
      if (!dragging) return;
      let nx = Math.max(0, Math.min(cx - ox, window.innerWidth  - el.offsetWidth));
      let ny = Math.max(0, Math.min(cy - oy, window.innerHeight - el.offsetHeight));
      el.style.left = nx + "px"; el.style.top = ny + "px"; el.style.right = "auto"; el.style.bottom = "auto";
    };
    const onUp = () => { dragging = false; el.style.transition = ""; };

    handle.addEventListener("mousedown", e => onDown(e.clientX, e.clientY));
    document.addEventListener("mousemove", e => onMove(e.clientX, e.clientY));
    document.addEventListener("mouseup", onUp);
    handle.addEventListener("touchstart", e => { const t = e.touches[0]; onDown(t.clientX, t.clientY); }, { passive: true });
    document.addEventListener("touchmove", e => { const t = e.touches[0]; onMove(t.clientX, t.clientY); }, { passive: true });
    document.addEventListener("touchend", onUp, { passive: true });
  }

  function buildFAB() {
    if (document.getElementById("ar-fab")) return;
    const fab = document.createElement("button");
    fab.id = "ar-fab"; fab.title = "AssetRip"; fab.setAttribute("aria-label", "Toggle AssetRip");
    fab.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="#0c0c0c" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>`;
    fab.addEventListener("click", () => {
      guiVisible = !guiVisible;
      const root = document.getElementById("ar-root");
      if (root) root.classList.toggle("ar-hidden", !guiVisible);
      else if (guiVisible) buildGUI();
    });
    fab.addEventListener("touchend", e => { e.preventDefault(); fab.click(); });
    document.body.appendChild(fab);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { buildFAB(); buildGUI(); });
  } else {
    buildFAB(); buildGUI();
  }

})();
