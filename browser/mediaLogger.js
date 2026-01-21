// ==UserScript==
// @name         mesapotamia finger extractor
// @namespace
// @version      6.0
// @description  Detects media, auto-fixes LIVE HLS yt-dlp, outlines video
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const seenUrls = new Set();
    const MEDIA_REGEX = /\.(m3u8|mpd|mp4|webm|mov|mkv|mp3|aac|m4a|ogg)(\?|$)/i;

    /* ===================== STYLES ===================== */

    const style = document.createElement("style");
    style.textContent = `
    .media-popup {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 420px;
        background: rgba(15,15,20,.95);
        color: #fff;
        font-family: system-ui, -apple-system;
        border-radius: 16px;
        box-shadow: 0 20px 50px rgba(0,0,0,.45);
        padding: 16px;
        z-index: 999999;
        animation: slideIn .25s ease-out;
    }

    @keyframes slideIn {
        from { transform: translateY(25px); opacity: 0 }
        to { transform: translateY(0); opacity: 1 }
    }

    .media-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
        margin-bottom: 10px;
    }

    .media-title span {
        color: #93c5fd;
    }

    .media-close {
        cursor: pointer;
        font-size: 18px;
        opacity: .7;
    }

    .media-box {
        background: #020617;
        border-radius: 10px;
        padding: 10px;
        font-size: 12px;
        word-break: break-all;
        max-height: 120px;
        overflow: auto;
        margin-bottom: 12px;
    }

    .media-actions {
        display: flex;
        gap: 8px;
    }

    .media-btn {
        flex: 1;
        background: #2563eb;
        border: none;
        border-radius: 10px;
        padding: 8px;
        color: #fff;
        font-size: 13px;
        cursor: pointer;
    }

    .media-btn.secondary {
        background: #334155;
    }

    .media-outline {
        position: absolute;
        pointer-events: none;
        border-radius: 20px;
        border: 3px solid white;
        box-shadow:
            0 0 0 2px rgba(255,255,255,.6),
            0 0 22px rgba(255,255,255,.45);
        z-index: 999998;
        transition: all .15s ease;
    }
    `;
    document.head.appendChild(style);

    /* ===================== POPUP ===================== */

    function showPopup(url, ytCmd, isLive) {
        const popup = document.createElement("div");
        popup.className = "media-popup";

        popup.innerHTML = `
        <div class="media-title">
            <span>Media Detected ${isLive ? "LIVE" : ""}</span>
            <div class="media-close">✕</div>
        </div>

        <div class="media-box">${url}</div>

        <div class="media-actions">
            <button class="media-btn secondary">Copy URL</button>
            <button class="media-btn">Copy yt-dlp</button>
        </div>
        `;

        popup.querySelector(".media-close").onclick = () => popup.remove();
        popup.querySelector(".secondary").onclick = () => navigator.clipboard.writeText(url);
        popup.querySelector(".media-btn:not(.secondary)").onclick = () => navigator.clipboard.writeText(ytCmd);

        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 25000);
    }

    /* check liveHLS */

    async function isLiveHLS(url) {
        if (!url.includes(".m3u8")) return false;
        try {
            const res = await fetch(url);
            const text = await res.text();
            if (text.includes("#EXTM3U")) {
                return !text.includes("#EXT-X-ENDLIST");
            }
        } catch {}
        return false;
    }

    /* yt-dlp build cmd */

    function getBaseHeaders() {
        return {
            "User-Agent": navigator.userAgent,
            "Referer": location.href,
            "Origin": location.origin
        };
    }

    function getCookies() {
        try { return document.cookie; } catch { return ""; }
    }

    async function buildYtDlpCommand(url, headers, cookies) {
        let cmd = `yt-dlp "${url}" \\\n`;

        for (const [k, v] of Object.entries(headers)) {
            cmd += `  --add-header "${k}: ${v}" \\\n`;
        }

        if (cookies) {
            cmd += `  --add-header "Cookie: ${cookies}" \\\n`;
        }

        const live = await isLiveHLS(url);
        if (live) {
            cmd += `  --downloader ffmpeg --hls-use-mpegts \\\n`;
            cmd += `  --live-from-start \\\n`;
        }

        cmd += `  -o "%(title)s.%(ext)s"`;
        return { cmd, live };
    }

    async function handleMediaUrl(url, extraHeaders) {
        if (!MEDIA_REGEX.test(url)) return;
        if (seenUrls.has(url)) return;
        seenUrls.add(url);

        const headers = Object.assign({}, getBaseHeaders(), extraHeaders || {});
        const cookies = getCookies();

        const { cmd, live } = await buildYtDlpCommand(url, headers, cookies);
        console.log("[Media Logger]", url);
        showPopup(url, cmd, live);
    }

    /* cool outline that i totally did not ask Ai to write */

    let outlineEl = null;

    function outlineVideo(video) {
        if (!outlineEl) {
            outlineEl = document.createElement("div");
            outlineEl.className = "media-outline";
            document.body.appendChild(outlineEl);
        }

        const r = video.getBoundingClientRect();
        outlineEl.style.width = r.width + "px";
        outlineEl.style.height = r.height + "px";
        outlineEl.style.left = r.left + window.scrollX + "px";
        outlineEl.style.top = r.top + window.scrollY + "px";
        outlineEl.style.display = "block";
    }

    function watchVideos() {
        document.querySelectorAll("video").forEach(v => {
            if (v._tracked) return;
            v._tracked = true;

            v.addEventListener("play", () => outlineVideo(v));
            v.addEventListener("pause", () => outlineEl && (outlineEl.style.display = "none"));
            v.addEventListener("ended", () => outlineEl && (outlineEl.style.display = "none"));
        });
    }

    setInterval(watchVideos, 1000);
    setInterval(() => {
        const v = document.querySelector("video:not([paused])");
        if (v) outlineVideo(v);
    }, 300);

    /* hook it like a geek (found it somewhere on the internet) */

    const origFetch = window.fetch;
    window.fetch = async function (input, init) {
        const res = await origFetch.apply(this, arguments);
        try {
            const url = typeof input === "string" ? input : input.url;
            const headers = {};
            if (init?.headers instanceof Headers) {
                init.headers.forEach((v, k) => headers[k] = v);
            }
            handleMediaUrl(url, headers);
        } catch {}
        return res;
    };

    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
        this._url = url;
        return origOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function () {
        try { handleMediaUrl(this._url); } catch {}
        return origSend.apply(this, arguments);
    };

})();
