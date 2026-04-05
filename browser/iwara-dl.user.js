// ==UserScript==
// @name         Iwara Downloader
// @namespace    https://github.com/Celesth
// @version      2.0.0
// @description  Quality picker + download for iwara.tv — uses signed view?hash= URLs
// @author       Celesth
// @match        *://iwara.tv/video/*
// @match        *://www.iwara.tv/video/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_download
// @connect      api.iwara.tv
// @connect      files.iwara.tv
// @connect      iwara.tv
// ==/UserScript==

(function () {
  "use strict";

  GM_addStyle(`
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');

    :root {
      --iw-bg:      rgba(18, 13, 13, 0.94);
      --iw-bg2:     rgba(28, 20, 20, 0.96);
      --iw-border:  rgba(235, 224, 223, 0.08);
      --iw-border2: rgba(235, 224, 223, 0.16);
      --iw-fg:      #ebe0df;
      --iw-muted:   rgba(235, 224, 223, 0.45);
      --iw-dim:     rgba(235, 224, 223, 0.2);
      --iw-accent:  #b3a2d5;
      --iw-success: #ffbca9;
      --iw-error:   #ff535f;
      --iw-sep:     rgba(235, 224, 223, 0.06);
      --iw-font:    'JetBrains Mono', monospace;
    }

    #iw-btn {
      position: fixed;
      bottom: 28px; right: 28px;
      z-index: 2147483640;
      display: flex; align-items: center; gap: 8px;
      padding: 9px 16px;
      background: var(--iw-bg);
      border: 1px solid var(--iw-border2);
      border-radius: 10px;
      cursor: pointer;
      font-family: var(--iw-font); font-size: 11px; font-weight: 600;
      letter-spacing: 0.1em; text-transform: uppercase;
      color: var(--iw-fg);
      box-shadow: 0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(179,162,213,0.08);
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
      user-select: none; -webkit-user-select: none;
      -webkit-tap-highlight-color: transparent; touch-action: manipulation;
    }
    #iw-btn:hover {
      border-color: rgba(179,162,213,0.45);
      box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(179,162,213,0.12), 0 0 0 1px rgba(179,162,213,0.15);
      transform: translateY(-1px);
    }
    #iw-btn:active { transform: scale(0.95); }
    #iw-btn-icon { width: 14px; height: 14px; flex-shrink: 0; }
    #iw-btn-dot {
      width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
      background: var(--iw-accent); box-shadow: 0 0 5px var(--iw-accent);
    }

    @media (max-width: 480px) {
      #iw-btn { bottom: max(18px, env(safe-area-inset-bottom, 18px)); right: 14px; padding: 10px 14px; font-size: 10px; }
    }

    #iw-panel {
      position: fixed;
      bottom: 80px; right: 28px;
      z-index: 2147483641;
      width: 310px;
      background: var(--iw-bg);
      border: 1px solid var(--iw-border2);
      border-radius: 12px;
      box-shadow: 0 2px 0 rgba(235,224,223,0.04) inset, 0 20px 60px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.4);
      backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
      overflow: hidden;
      font-family: var(--iw-font); color: var(--iw-fg);
      opacity: 0; transform: translateY(10px) scale(0.97); pointer-events: none;
      transition: opacity 0.25s cubic-bezier(0.16,1,0.3,1), transform 0.25s cubic-bezier(0.16,1,0.3,1);
    }
    #iw-panel.open { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }

    @media (max-width: 480px) {
      #iw-panel {
        bottom: auto; top: 50%; left: 50%; right: auto;
        transform: translate(-50%, -44%) scale(0.97);
        width: calc(100vw - 32px);
      }
      #iw-panel.open { transform: translate(-50%, -50%) scale(1); }
    }

    #iw-panel-accent { height: 2px; background: linear-gradient(90deg, var(--iw-accent), var(--iw-success)); }

    #iw-panel-header {
      display: flex; align-items: center; gap: 8px;
      padding: 11px 14px 9px; border-bottom: 1px solid var(--iw-sep);
    }
    #iw-panel-title {
      font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
      color: var(--iw-muted); flex: 1;
    }
    #iw-panel-close {
      background: none; border: none; color: var(--iw-dim); cursor: pointer;
      font-family: var(--iw-font); font-size: 14px; line-height: 1;
      padding: 3px 6px; margin: -3px -4px; border-radius: 4px; transition: color 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    #iw-panel-close:hover { color: var(--iw-fg); }

    #iw-panel-info { padding: 10px 14px 8px; border-bottom: 1px solid var(--iw-sep); }
    #iw-panel-video-title {
      font-size: 11px; font-weight: 600; color: var(--iw-fg);
      line-height: 1.4; margin-bottom: 4px;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    #iw-panel-meta { display: flex; gap: 10px; font-size: 9px; color: var(--iw-dim); letter-spacing: 0.06em; }
    #iw-panel-meta span { display: flex; align-items: center; gap: 3px; }

    #iw-qualities { padding: 8px; display: flex; flex-direction: column; gap: 4px; }

    .iw-quality-row {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 10px; border-radius: 7px;
      border: 1px solid var(--iw-border); background: var(--iw-bg2);
      cursor: pointer; transition: border-color 0.15s, background 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .iw-quality-row:hover { border-color: var(--iw-border2); background: rgba(179,162,213,0.06); }
    .iw-quality-row.best { border-color: rgba(179,162,213,0.3); }
    .iw-quality-row.best:hover { border-color: rgba(179,162,213,0.55); }

    .iw-q-badge { font-size: 10px; font-weight: 600; letter-spacing: 0.06em; min-width: 50px; color: var(--iw-fg); }
    .iw-quality-row.best .iw-q-badge { color: var(--iw-accent); }
    .iw-q-label { font-size: 9px; color: var(--iw-dim); flex: 1; letter-spacing: 0.04em; }
    .iw-q-size { font-size: 9px; color: var(--iw-muted); text-align: right; }
    .iw-q-best-tag {
      font-size: 8px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
      padding: 1px 6px; border-radius: 3px;
      background: rgba(179,162,213,0.12); color: var(--iw-accent);
    }
    .iw-q-dl-icon { width: 13px; height: 13px; opacity: 0.4; flex-shrink: 0; transition: opacity 0.15s; }
    .iw-quality-row:hover .iw-q-dl-icon { opacity: 0.85; }

    #iw-progress { height: 1.5px; background: var(--iw-sep); position: relative; overflow: hidden; }
    #iw-progress-fill {
      position: absolute; inset: 0; width: 0%;
      background: linear-gradient(90deg, var(--iw-accent), var(--iw-success));
      transition: width 0.3s ease;
    }
    #iw-progress-fill.indeterminate { width: 40%; animation: iw-slide 1.2s ease-in-out infinite; }
    @keyframes iw-slide { 0% { left: -40%; } 100% { left: 100%; } }

    #iw-panel-status {
      padding: 10px 14px; border-top: 1px solid var(--iw-sep);
      font-size: 10px; color: var(--iw-muted);
      display: flex; align-items: center; gap: 7px; min-height: 36px;
    }
    #iw-status-dot {
      width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
      background: var(--iw-dim); transition: background 0.2s, box-shadow 0.2s;
    }
    #iw-status-dot.ok      { background: var(--iw-success); box-shadow: 0 0 6px var(--iw-success); }
    #iw-status-dot.err     { background: var(--iw-error);   box-shadow: 0 0 6px var(--iw-error);   }
    #iw-status-dot.loading { background: var(--iw-accent);  animation: iw-pulse 1s ease-in-out infinite; }
    @keyframes iw-pulse { 0%,100% { box-shadow: 0 0 4px var(--iw-accent); } 50% { box-shadow: 0 0 10px var(--iw-accent); } }
    #iw-status-text { flex: 1; }

    #iw-overlay { display: none; position: fixed; inset: 0; z-index: 2147483639; }
    #iw-overlay.open { display: block; }
  `);

  let panelOpen = false;
  let videoData = null;

  function setStatus(msg, type = "idle") {
    const dot  = document.getElementById("iw-status-dot");
    const text = document.getElementById("iw-status-text");
    if (!dot || !text) return;
    dot.className = type !== "idle" ? type : "";
    text.textContent = msg;
  }

  function setProgress(pct) {
    const fill = document.getElementById("iw-progress-fill");
    if (!fill) return;
    if (pct === null) {
      fill.style.width = "0%";
      fill.classList.add("indeterminate");
    } else {
      fill.classList.remove("indeterminate");
      fill.style.width = pct + "%";
    }
  }

  function getVideoId() {
    const m = location.pathname.match(/\/video\/([^/?#]+)/);
    return m ? m[1] : null;
  }

  function getFilename(title, quality) {
    const safe = (title || "iwara_video").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_").slice(0, 80);
    return `${safe}_${quality}.mp4`;
  }

  function sizeStr(bytes) {
    if (!bytes) return "";
    if (bytes < 1048576) return (bytes / 1024).toFixed(0) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  }

  function gmGet(url, headers = {}) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET", url,
        headers: { "Accept": "application/json", ...headers },
        onload:  res => {
          if (res.status >= 200 && res.status < 300) {
            try { resolve(JSON.parse(res.responseText)); }
            catch { reject(new Error(`Bad JSON from ${url}`)); }
          } else {
            reject(new Error(`HTTP ${res.status} from ${url}`));
          }
        },
        onerror: () => reject(new Error(`Network error: ${url}`)),
      });
    });
  }

  async function sha1Hex(str) {
    const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  function getAuthToken() {
    try {
      const raw = localStorage.getItem("user") || localStorage.getItem("auth") || localStorage.getItem("token") || "";
      if (raw) {
        const parsed = JSON.parse(raw);
        const tok = parsed?.token || parsed?.accessToken || parsed?.access_token || parsed?.jwt;
        if (tok) return tok;
      }
      for (let i = 0; i < localStorage.length; i++) {
        const v = localStorage.getItem(localStorage.key(i));
        if (typeof v === "string" && /^eyJ/.test(v)) return v;
      }
    } catch { }
    return null;
  }

  async function resolveQualities(videoId) {
    const info = await gmGet(`https://api.iwara.tv/video/${videoId}`);
    videoData = info;

    const titleEl = document.getElementById("iw-panel-video-title");
    const metaEl  = document.getElementById("iw-panel-meta");
    if (titleEl) titleEl.textContent = info.title || "Untitled";
    if (metaEl) {
      const parts = [
        info.numViews ? `👁 ${info.numViews.toLocaleString()}` : "",
        info.numLikes ? `♥ ${info.numLikes.toLocaleString()}` : "",
        info.user?.name || info.user?.username || "",
      ].filter(Boolean);
      metaEl.innerHTML = parts.map(s => `<span>${s}</span>`).join("");
    }

    setStatus("Resolving signed URLs…", "loading");

    const fileId = info.fileUrl?.replace(/^.*\/file\//, "").split("?")[0]
                || info.id;

    const expires = Math.floor(Date.now() / 1000) + 3600;
    const secret  = "5nFp9kmbNnHdAFhaqMvt";
    const hashInput = `${fileId}_${expires}_${secret}`;
    const xVersion = await sha1Hex(hashInput);

    const token  = getAuthToken();
    const headers = { "X-Version": xVersion };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const filesUrl = `https://api.iwara.tv/video/${videoId}/files`;
    const files    = await gmGet(filesUrl, headers);

    return { files: Array.isArray(files) ? files : [], title: info.title || "iwara_video" };
  }

  const QUALITY_ORDER = ["Source", "1080p", "720p", "480p", "360p", "240p"];

  function sortQualities(arr) {
    return [...arr].sort((a, b) => {
      const ai = QUALITY_ORDER.indexOf(a.name);
      const bi = QUALITY_ORDER.indexOf(b.name);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }

  function renderQualities(files, title) {
    const container = document.getElementById("iw-qualities");
    if (!container) return;
    container.innerHTML = "";

    if (!files.length) {
      container.innerHTML = `<div style="padding:14px;font-size:10px;color:var(--iw-dim);text-align:center">No sources found.</div>`;
      return;
    }

    sortQualities(files).forEach((f, i) => {
      const isBest = i === 0;
      const viewUrl = f.src?.view || f.src?.download || f.uri || f.url || "";

      const row = document.createElement("div");
      row.className = "iw-quality-row" + (isBest ? " best" : "");
      row.innerHTML = `
        <span class="iw-q-badge">${f.name || "?"}</span>
        <span class="iw-q-label">${f.type || "mp4"}</span>
        ${f.size ? `<span class="iw-q-size">${sizeStr(f.size)}</span>` : ""}
        ${isBest ? `<span class="iw-q-best-tag">Best</span>` : ""}
        <svg class="iw-q-dl-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 2v8M5 7l3 3 3-3M2 13h12"/>
        </svg>
      `;

      row.addEventListener("click", () => triggerDownload(viewUrl, title, f.name || "Source"));
      container.appendChild(row);
    });
  }

  function triggerDownload(viewUrl, title, qualityName) {
    if (!viewUrl) {
      setStatus("No URL for this quality.", "err");
      return;
    }

    const fullUrl = viewUrl.startsWith("http") ? viewUrl : `https://files.iwara.tv${viewUrl}`;
    const filename = getFilename(title, qualityName);

    setStatus(`Downloading — ${qualityName}`, "loading");
    setProgress(null);

    try {
      GM_download({
        url:     fullUrl,
        name:    filename,
        headers: { "Referer": "https://iwara.tv/", "Origin": "https://iwara.tv" },
        onload:  () => { setStatus(`Saved: ${filename}`, "ok"); setProgress(100); },
        onerror: () => {
          setStatus("GM_download blocked — opening directly…", "err");
          setProgress(0);
          window.open(fullUrl, "_blank");
        },
        onprogress: p => { if (p.total) setProgress(Math.round((p.loaded / p.total) * 100)); },
      });
    } catch {
      window.open(fullUrl, "_blank");
    }
  }

  async function loadAndOpen() {
    const videoId = getVideoId();
    if (!videoId) { setStatus("Could not find video ID in URL.", "err"); return; }

    openPanel();
    setStatus("Fetching video info…", "loading");
    setProgress(null);

    try {
      const { files, title } = await resolveQualities(videoId);
      renderQualities(files, title);
      setStatus(`${files.length} source${files.length !== 1 ? "s" : ""} — pick a quality`, "ok");
      setProgress(100);
      setTimeout(() => setProgress(0), 700);
    } catch (err) {
      setStatus(err.message || "Failed.", "err");
      setProgress(0);
      console.error("[Iwara DL]", err);
    }
  }

  function openPanel() {
    panelOpen = true;
    document.getElementById("iw-panel")?.classList.add("open");
    document.getElementById("iw-overlay")?.classList.add("open");
  }

  function closePanel() {
    panelOpen = false;
    document.getElementById("iw-panel")?.classList.remove("open");
    document.getElementById("iw-overlay")?.classList.remove("open");
  }

  function buildUI() {
    if (document.getElementById("iw-btn")) return;

    const btn = document.createElement("button");
    btn.id = "iw-btn";
    btn.innerHTML = `
      <div id="iw-btn-dot"></div>
      <svg id="iw-btn-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 2v8M5 7l3 3 3-3M2 13h12"/>
      </svg>
      <span>Download</span>
    `;
    btn.addEventListener("click", () => { if (panelOpen) closePanel(); else loadAndOpen(); });
    btn.addEventListener("touchend", e => { e.preventDefault(); btn.click(); });

    const panel = document.createElement("div");
    panel.id = "iw-panel";
    panel.innerHTML = `
      <div id="iw-panel-accent"></div>
      <div id="iw-panel-header">
        <span id="iw-panel-title">Iwara Downloader</span>
        <button id="iw-panel-close">×</button>
      </div>
      <div id="iw-panel-info">
        <div id="iw-panel-video-title">Loading…</div>
        <div id="iw-panel-meta"></div>
      </div>
      <div id="iw-qualities">
        <div style="padding:16px;font-size:10px;color:var(--iw-dim);text-align:center">Waiting…</div>
      </div>
      <div id="iw-progress"><div id="iw-progress-fill"></div></div>
      <div id="iw-panel-status">
        <div id="iw-status-dot"></div>
        <span id="iw-status-text">Press Download to start</span>
      </div>
    `;

    const overlay = document.createElement("div");
    overlay.id = "iw-overlay";
    overlay.addEventListener("click", closePanel);

    document.body.appendChild(overlay);
    document.body.appendChild(panel);
    document.body.appendChild(btn);

    document.getElementById("iw-panel-close").addEventListener("click", closePanel);
  }

  function init() {
    if (document.body) buildUI();
    else new MutationObserver((_, ob) => { if (document.body) { ob.disconnect(); buildUI(); } })
      .observe(document.documentElement, { childList: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  let lastPath = location.pathname;
  new MutationObserver(() => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      if (/\/video\//.test(location.pathname)) {
        videoData = null; panelOpen = false;
        document.getElementById("iw-btn")?.remove();
        document.getElementById("iw-panel")?.remove();
        document.getElementById("iw-overlay")?.remove();
        setTimeout(buildUI, 900);
      }
    }
  }).observe(document.body, { childList: true, subtree: true });

})();
