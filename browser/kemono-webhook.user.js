// ==UserScript==
// @name         Kemono → Discord Webhook
// @namespace    https://github.com/Celesth
// @version      1.0.0
// @description  Full post dump to Discord with Hyprland-style notifications
// @author       Celesth
// @match        https://kemono.su/*/user/*/post/*
// @match        https://coomer.su/*/user/*/post/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      discord.com
// @connect      discordapp.com
// ==/UserScript==

(function () {
  "use strict";

  /* ─────────────────────────────────────────────
     CONFIG
  ───────────────────────────────────────────── */
  const CONFIG = {
    webhookUrl:    "",        // ← your Discord webhook URL
    notifDuration: 6000,
    footerText:    "Made by Celesth · kemono",
    maxEmbeds:     10,        // Discord limit per request is 10 embeds
    embedColor:    0xb3a2d5,
    accentColor:   0xef8f9a,
  };

  /* ─────────────────────────────────────────────
     STYLES  (Hyprland notification + FAB button)
  ───────────────────────────────────────────── */
  GM_addStyle(`
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');

    :root {
      --hypr-bg:        rgba(18, 13, 13, 0.88);
      --hypr-border:    rgba(235, 224, 223, 0.07);
      --hypr-fg:        #ebe0df;
      --hypr-fg-muted:  rgba(235, 224, 223, 0.45);
      --hypr-fg-dim:    rgba(235, 224, 223, 0.22);
      --hypr-success:   #ffbca9;
      --hypr-error:     #ff535f;
      --hypr-info:      #b3a2d5;
      --hypr-warn:      #ffdfd9;
      --hypr-separator: rgba(235, 224, 223, 0.06);
    }

    /* ── Notification container ── */
    .hypr-wrap {
      position: fixed;
      top: 18px;
      right: 18px;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
      font-family: 'JetBrains Mono', monospace;
    }

    .hypr-notif {
      pointer-events: all;
      width: 340px;
      background: var(--hypr-bg);
      backdrop-filter: blur(24px) saturate(160%);
      -webkit-backdrop-filter: blur(24px) saturate(160%);
      border-radius: 12px;
      border: 1px solid var(--hypr-border);
      box-shadow:
        0 2px 0 rgba(235,224,223,0.04) inset,
        0 16px 48px rgba(0,0,0,0.65),
        0 4px 12px rgba(0,0,0,0.35);
      overflow: hidden;
      color: var(--hypr-fg);
      opacity: 0;
      transform: translateX(calc(100% + 24px)) scale(0.96);
      transition:
        opacity 0.38s cubic-bezier(0.16, 1, 0.3, 1),
        transform 0.38s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .hypr-notif.hypr-in {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
    .hypr-notif.hypr-out {
      opacity: 0;
      transform: translateX(calc(100% + 24px)) scale(0.96);
      transition: opacity 0.22s ease-in, transform 0.22s ease-in;
    }

    .hypr-accent { height: 2.5px; width: 100%; }
    .hypr-accent.success { background: linear-gradient(90deg, var(--hypr-success), #ffdfd9); }
    .hypr-accent.error   { background: linear-gradient(90deg, var(--hypr-error),   #ff8486); }
    .hypr-accent.info    { background: linear-gradient(90deg, var(--hypr-info),     #ef8f9a); }
    .hypr-accent.warn    { background: linear-gradient(90deg, var(--hypr-warn),     #ffba93); }

    .hypr-header {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 10px 12px 8px;
    }
    .hypr-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .hypr-dot.success { background: var(--hypr-success); box-shadow: 0 0 6px var(--hypr-success); }
    .hypr-dot.error   { background: var(--hypr-error);   box-shadow: 0 0 6px var(--hypr-error);   }
    .hypr-dot.info    { background: var(--hypr-info);     box-shadow: 0 0 6px var(--hypr-info);    }
    .hypr-dot.warn    { background: var(--hypr-warn);     box-shadow: 0 0 6px var(--hypr-warn);    }

    .hypr-appname {
      font-size: 9.5px; font-weight: 600;
      letter-spacing: 0.12em; text-transform: uppercase;
      color: var(--hypr-fg-muted); flex: 1;
    }
    .hypr-tag {
      font-size: 9px; font-weight: 600;
      letter-spacing: 0.06em; text-transform: uppercase;
      padding: 2px 7px; border-radius: 4px;
    }
    .hypr-tag.success { background: rgba(255,188,169,0.12); color: var(--hypr-success); }
    .hypr-tag.error   { background: rgba(255,83,95,0.12);   color: var(--hypr-error);   }
    .hypr-tag.info    { background: rgba(179,162,213,0.12); color: var(--hypr-info);    }
    .hypr-tag.warn    { background: rgba(255,223,217,0.12); color: var(--hypr-warn);    }

    .hypr-close {
      background: none; border: none;
      color: var(--hypr-fg-dim); cursor: pointer;
      font-size: 15px; line-height: 1; padding: 0 1px;
      transition: color 0.15s; font-family: inherit;
    }
    .hypr-close:hover { color: var(--hypr-fg); }

    .hypr-divider { height: 1px; background: var(--hypr-separator); margin: 0 12px; }

    .hypr-body {
      padding: 10px 12px 4px;
      display: flex; gap: 10px; align-items: flex-start;
    }
    .hypr-thumb {
      width: 46px; height: 46px; border-radius: 6px;
      object-fit: cover; flex-shrink: 0;
      border: 1px solid var(--hypr-border);
      background: rgba(255,255,255,0.04);
    }
    .hypr-thumb-placeholder {
      width: 46px; height: 46px; border-radius: 6px; flex-shrink: 0;
      background: rgba(179,162,213,0.08); border: 1px solid var(--hypr-border);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; opacity: 0.5;
    }
    .hypr-text { flex: 1; min-width: 0; }
    .hypr-title {
      font-size: 12px; font-weight: 600; color: var(--hypr-fg);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      line-height: 1.3; margin-bottom: 3px;
    }
    .hypr-message { font-size: 10.5px; color: var(--hypr-fg-muted); line-height: 1.5; }

    .hypr-meta {
      display: flex; flex-wrap: wrap;
      gap: 6px 0; padding: 8px 12px 10px;
    }
    .hypr-meta-item {
      display: flex; align-items: center; gap: 5px;
      width: 50%; min-width: 0;
    }
    .hypr-meta-item.full { width: 100%; }
    .hypr-meta-label {
      font-size: 9px; font-weight: 600;
      letter-spacing: 0.08em; text-transform: uppercase;
      color: var(--hypr-fg-dim); white-space: nowrap;
    }
    .hypr-meta-value {
      font-size: 10px; color: var(--hypr-fg-muted);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0;
    }
    .hypr-meta-value.accent { color: var(--hypr-info); }

    .hypr-bar { height: 1.5px; background: var(--hypr-separator); position: relative; overflow: hidden; }
    .hypr-bar-fill { position: absolute; inset: 0; width: 100%; transform-origin: left; }
    .hypr-bar-fill.success { background: var(--hypr-success); }
    .hypr-bar-fill.error   { background: var(--hypr-error);   }
    .hypr-bar-fill.info    { background: var(--hypr-info);     }
    .hypr-bar-fill.warn    { background: var(--hypr-warn);     }

    /* ── FAB trigger button ── */
    #kmn-send-btn {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 2147483646;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(18, 13, 13, 0.88);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(179, 162, 213, 0.25);
      box-shadow:
        0 0 0 1px rgba(179,162,213,0.08),
        0 8px 24px rgba(0,0,0,0.55);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
      font-family: 'JetBrains Mono', monospace;
    }
    #kmn-send-btn:hover {
      border-color: rgba(179, 162, 213, 0.55);
      box-shadow:
        0 0 0 1px rgba(179,162,213,0.18),
        0 0 18px rgba(179,162,213,0.15),
        0 8px 24px rgba(0,0,0,0.55);
      transform: translateY(-1px);
    }
    #kmn-send-btn:active { transform: scale(0.95); }
    #kmn-send-btn svg { width: 20px; height: 20px; }
    #kmn-send-btn.sending {
      border-color: rgba(179,162,213,0.6);
      animation: kmn-pulse 1s ease-in-out infinite;
      pointer-events: none;
    }
    @keyframes kmn-pulse {
      0%, 100% { box-shadow: 0 0 0 1px rgba(179,162,213,0.18), 0 8px 24px rgba(0,0,0,0.55); }
      50%       { box-shadow: 0 0 0 3px rgba(179,162,213,0.25), 0 0 24px rgba(179,162,213,0.2), 0 8px 24px rgba(0,0,0,0.55); }
    }
  `);

  /* ─────────────────────────────────────────────
     NOTIFICATION SYSTEM
  ───────────────────────────────────────────── */
  const Notify = (() => {
    let container = document.querySelector(".hypr-wrap");
    if (!container) {
      container = document.createElement("div");
      container.className = "hypr-wrap";
      document.body.appendChild(container);
    }

    function show({ message, type = "info", duration = CONFIG.notifDuration, title, thumbnail, meta = [] }) {
      const labels = { success: "Sent", error: "Failed", info: "Pending", warn: "Warning" };

      const notif = document.createElement("div");
      notif.className = "hypr-notif";

      const thumbHTML = thumbnail
        ? `<img class="hypr-thumb" src="${thumbnail}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'hypr-thumb-placeholder',textContent:'⬡'}))">`
        : `<div class="hypr-thumb-placeholder">⬡</div>`;

      const metaHTML = meta.map(m => `
        <div class="hypr-meta-item ${m.full ? "full" : ""}">
          <span class="hypr-meta-label">${m.label}</span>
          <span class="hypr-meta-value ${m.accent ? "accent" : ""}">${m.value}</span>
        </div>`).join("");

      notif.innerHTML = `
        <div class="hypr-accent ${type}"></div>
        <div class="hypr-header">
          <span class="hypr-dot ${type}"></span>
          <span class="hypr-appname">Kemono Webhook</span>
          <span class="hypr-tag ${type}">${labels[type]}</span>
          <button class="hypr-close" aria-label="Dismiss">×</button>
        </div>
        <div class="hypr-divider"></div>
        <div class="hypr-body">
          ${thumbHTML}
          <div class="hypr-text">
            ${title ? `<div class="hypr-title">${title}</div>` : ""}
            <div class="hypr-message">${message}</div>
          </div>
        </div>
        ${meta.length ? `<div class="hypr-meta">${metaHTML}</div>` : ""}
        <div class="hypr-bar"><div class="hypr-bar-fill ${type}"></div></div>
      `;

      container.appendChild(notif);
      requestAnimationFrame(() => requestAnimationFrame(() => notif.classList.add("hypr-in")));

      const fill = notif.querySelector(".hypr-bar-fill");
      requestAnimationFrame(() => {
        fill.style.transition = `transform ${duration}ms linear`;
        requestAnimationFrame(() => { fill.style.transform = "scaleX(0)"; });
      });

      const dismiss = () => {
        notif.classList.remove("hypr-in");
        notif.classList.add("hypr-out");
        setTimeout(() => notif.remove(), 240);
      };

      const timer = setTimeout(dismiss, duration);
      notif.querySelector(".hypr-close").addEventListener("click", () => {
        clearTimeout(timer);
        dismiss();
      });
    }

    return { show };
  })();

  /* ─────────────────────────────────────────────
     KEMONO POST SCRAPER
  ───────────────────────────────────────────── */
  function scrapePost() {
    const post = {};

    // ── URL / service / user ──
    post.url      = window.location.href;
    const urlParts = location.pathname.split("/");
    // pathname: /{service}/user/{userId}/post/{postId}
    post.service  = urlParts[1] ?? "unknown";
    post.userId   = urlParts[3] ?? "unknown";
    post.postId   = urlParts[5] ?? "unknown";
    post.site     = location.hostname; // kemono.su or coomer.su

    // ── Title ──
    post.title =
      document.querySelector(".post__title")?.textContent?.trim() ||
      document.querySelector("h1.post__title span")?.textContent?.trim() ||
      document.title || "Untitled Post";

    // ── Artist name ──
    post.artist =
      document.querySelector(".post__user-name")?.textContent?.trim() ||
      document.querySelector('a[href*="/user/"]')?.textContent?.trim() ||
      "Unknown";

    // ── Published date ──
    post.published =
      document.querySelector(".post__published time")?.getAttribute("datetime") ||
      document.querySelector("time[datetime]")?.getAttribute("datetime") ||
      null;
    post.publishedDisplay = post.published
      ? new Date(post.published).toLocaleString()
      : "Unknown";

    // ── Post body / content ──
    const contentEl = document.querySelector(".post__content");
    post.content = contentEl?.innerText?.trim().slice(0, 500) || "No text content.";

    // ── Tags ──
    post.tags = [...document.querySelectorAll(".post__tags .post__tag")]
      .map(t => t.textContent.trim())
      .filter(Boolean);

    // ── Thumbnail (first image) ──
    const firstThumb =
      document.querySelector(".post__thumbnail img") ||
      document.querySelector(".post__files .post__thumbnail img") ||
      document.querySelector('img[src*="/thumbnail/"]');
    post.thumbnail = firstThumb?.src || null;

    // ── File attachments ──
    post.files = [...document.querySelectorAll(".post__files .post__thumbnail")]
      .map(el => {
        const link = el.querySelector("a");
        const img  = el.querySelector("img");
        return {
          url:  link?.href || img?.src || null,
          name: link?.download || link?.href?.split("/").pop() || "file",
          thumb: img?.src || null,
        };
      })
      .filter(f => f.url);

    // Fallback: direct file links
    if (!post.files.length) {
      post.files = [...document.querySelectorAll('a[href*="/data/"], a[download]')]
        .map(a => ({
          url:  a.href,
          name: a.download || a.href.split("/").pop() || "file",
          thumb: null,
        }));
    }

    // ── Attachments section (non-image linked files) ──
    post.attachments = [...document.querySelectorAll(".post__attachments .post__attachment")]
      .map(el => {
        const link = el.querySelector("a.post__attachment-link");
        return link ? { url: link.href, name: link.textContent.trim() || link.href.split("/").pop() } : null;
      })
      .filter(Boolean);

    // ── Comments ──
    post.comments = [...document.querySelectorAll(".post__comments .comment")]
      .slice(0, 5) // cap at 5 for the embed
      .map(el => ({
        author:  el.querySelector(".comment__name")?.textContent?.trim() || "anon",
        content: el.querySelector(".comment__message")?.innerText?.trim().slice(0, 200) || "",
      }))
      .filter(c => c.content);

    return post;
  }

  /* ─────────────────────────────────────────────
     DISCORD PAYLOAD BUILDER
  ───────────────────────────────────────────── */
  function buildPayloads(post) {
    const embeds = [];
    const now = new Date().toLocaleString();

    // ── Embed 1: Main post info ──
    embeds.push({
      title:       post.title.slice(0, 256),
      url:         post.url,
      color:       CONFIG.embedColor,
      description: post.content.length > 0 ? post.content : undefined,
      ...(post.thumbnail && { thumbnail: { url: post.thumbnail } }),
      fields: [
        { name: "✦ Artist",    value: post.artist,           inline: true  },
        { name: "✦ Service",   value: post.service,          inline: true  },
        { name: "✦ Site",      value: post.site,             inline: true  },
        { name: "✦ Published", value: post.publishedDisplay, inline: true  },
        { name: "✦ Post ID",   value: post.postId,           inline: true  },
        { name: "✦ User ID",   value: post.userId,           inline: true  },
        ...(post.tags.length ? [{ name: "✦ Tags", value: post.tags.slice(0, 15).map(t => `\`${t}\``).join(" "), inline: false }] : []),
        { name: "✦ Checked On", value: now, inline: false },
      ],
      footer: { text: CONFIG.footerText },
    });

    // ── Embed 2+: File attachments (one embed per image, up to limit) ──
    const imageExts = /\.(jpg|jpeg|png|gif|webp|avif)(\?|$)/i;
    const imageFiles = post.files.filter(f => imageExts.test(f.url));
    const otherFiles = post.files.filter(f => !imageExts.test(f.url));

    imageFiles.slice(0, CONFIG.maxEmbeds - 1).forEach((file, i) => {
      embeds.push({
        color: CONFIG.accentColor,
        image: { url: file.url },
        footer: { text: `Image ${i + 1} of ${imageFiles.length} · ${file.name}` },
      });
    });

    // ── Non-image files as a single field embed ──
    const allOther = [
      ...otherFiles.map(f => `[${f.name}](${f.url})`),
      ...post.attachments.map(a => `[${a.name}](${a.url})`),
    ];

    if (allOther.length) {
      embeds.push({
        color:  CONFIG.embedColor,
        fields: [{
          name:  "✦ Attachments / Files",
          value: allOther.slice(0, 15).join("\n").slice(0, 1024),
        }],
        footer: { text: CONFIG.footerText },
      });
    }

    // ── Comments embed ──
    if (post.comments.length) {
      embeds.push({
        color:  CONFIG.embedColor,
        fields: post.comments.map(c => ({
          name:  c.author.slice(0, 256),
          value: c.content.slice(0, 1024),
        })),
        footer: { text: `Comments · ${CONFIG.footerText}` },
      });
    }

    // Discord allows max 10 embeds per message — batch into chunks
    const chunks = [];
    for (let i = 0; i < embeds.length; i += 10) {
      chunks.push({ embeds: embeds.slice(i, i + 10) });
    }

    return chunks;
  }

  /* ─────────────────────────────────────────────
     SEND  (uses GM_xmlhttpRequest to bypass CORS)
  ───────────────────────────────────────────── */
  function sendChunk(payload) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method:  "POST",
        url:     CONFIG.webhookUrl,
        headers: { "Content-Type": "application/json" },
        data:    JSON.stringify(payload),
        onload:  res => res.status >= 200 && res.status < 300 ? resolve(res) : reject(res),
        onerror: reject,
      });
    });
  }

  async function sendAll(chunks) {
    for (let i = 0; i < chunks.length; i++) {
      await sendChunk(chunks[i]);
      // Rate limit safety — Discord allows ~5 webhooks/2s
      if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 500));
    }
  }

  /* ─────────────────────────────────────────────
     MAIN TRIGGER
  ───────────────────────────────────────────── */
  async function run() {
    if (!CONFIG.webhookUrl) {
      Notify.show({ type: "error", title: "Not configured", message: "Set webhookUrl in CONFIG." });
      return;
    }

    const btn = document.getElementById("kmn-send-btn");
    const post = scrapePost();
    const chunks = buildPayloads(post);

    const totalFiles  = post.files.length + post.attachments.length;
    const totalEmbeds = chunks.reduce((n, c) => n + c.embeds.length, 0);

    Notify.show({
      type:      "info",
      title:     post.title.length > 38 ? post.title.slice(0, 36) + "…" : post.title,
      message:   "Dispatching to Discord…",
      thumbnail: post.thumbnail,
      duration:  2400,
      meta: [
        { label: "artist",  value: post.artist,  accent: true },
        { label: "service", value: post.service },
        { label: "files",   value: String(totalFiles) },
        { label: "embeds",  value: String(totalEmbeds) },
      ],
    });

    btn?.classList.add("sending");

    try {
      await sendAll(chunks);

      Notify.show({
        type:      "success",
        title:     post.title.length > 38 ? post.title.slice(0, 36) + "…" : post.title,
        message:   `Sent ${chunks.length} batch${chunks.length > 1 ? "es" : ""} to Discord.`,
        thumbnail: post.thumbnail,
        meta: [
          { label: "artist",  value: post.artist,           accent: true },
          { label: "service", value: post.service },
          { label: "files",   value: String(totalFiles) },
          { label: "sent",    value: new Date().toLocaleTimeString() },
          { label: "tags",    value: post.tags.slice(0, 3).join(", ") || "none", full: true },
        ],
      });

      console.log(`[Kemono Webhook] Sent ${chunks.length} batch(es), ${totalEmbeds} embeds.`);
    } catch (err) {
      const status = err?.status ? `HTTP ${err.status}` : "Network error";
      Notify.show({
        type:    "error",
        title:   status,
        message: "Webhook failed. Check console for details.",
        meta: [
          { label: "post",    value: post.postId, accent: true },
          { label: "batches", value: String(chunks.length) },
        ],
      });
      console.error("[Kemono Webhook] Error:", err);
    } finally {
      btn?.classList.remove("sending");
    }
  }

  /* ─────────────────────────────────────────────
     FAB BUTTON
  ───────────────────────────────────────────── */
  function injectButton() {
    if (document.getElementById("kmn-send-btn")) return;

    const btn = document.createElement("button");
    btn.id = "kmn-send-btn";
    btn.title = "Send post to Discord";
    btn.setAttribute("aria-label", "Send to Discord");
    // Discord logo icon
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z" fill="#b3a2d5"/>
    </svg>`;

    btn.addEventListener("click", run);
    document.body.appendChild(btn);
  }

  // Wait for DOM then inject
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectButton);
  } else {
    injectButton();
  }

})();
