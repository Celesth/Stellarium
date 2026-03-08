// [Save This As A Custom Js Runner In A Browser Or Extension To Use]
// [Paste Your Webhook Link Under 'webhookUrl']
// [Some Browsers Doesn't Support Font Importing]
// [If You Find This Usefull, Please Star ⭐, Also No Skiding It]
/**
 * Discord Webhook Bookmarklet
 * Hyprland-style notifications · Made by Celesth
 */
(async function () {

  /* ─────────────────────────────────────────────
     CONFIG
  ───────────────────────────────────────────── */
  const CONFIG = {
    webhookUrl: "https://discord.com/api/webhooks/",          // ← paste your Discord webhook URL here
    notifDuration: 4000,     // ms
    footerText: "Made by Celesth",
  };

  /* ─────────────────────────────────────────────
     HYPRLAND NOTIFICATION SYSTEM
  ───────────────────────────────────────────── */
  const Notify = (() => {
    // Inject styles once
    const STYLE_ID = "__hypr_notif_style__";
    if (!document.getElementById(STYLE_ID)) {
      const s = document.createElement("style");
      s.id = STYLE_ID;
      s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap');

        .hypr-notif-wrap {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 2147483647;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
        }

        .hypr-notif {
          pointer-events: all;
          min-width: 280px;
          max-width: 360px;
          background: rgba(15, 15, 20, 0.78);
          backdrop-filter: blur(18px) saturate(180%);
          -webkit-backdrop-filter: blur(18px) saturate(180%);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.55),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
          overflow: hidden;
          font-family: 'JetBrains Mono', monospace;
          color: #e8e8f0;

          /* entry animation */
          opacity: 0;
          transform: translateX(calc(100% + 28px));
          transition:
            opacity 0.32s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .hypr-notif.hypr-show {
          opacity: 1;
          transform: translateX(0);
        }

        .hypr-notif.hypr-hide {
          opacity: 0;
          transform: translateX(calc(100% + 28px));
          transition:
            opacity 0.25s ease-in,
            transform 0.25s ease-in;
        }

        .hypr-notif__header {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 11px 14px 8px;
        }

        .hypr-notif__icon {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
        }

        .hypr-notif__icon.success { background: #4ade80; color: #0a1a10; }
        .hypr-notif__icon.error   { background: #f87171; color: #1a0a0a; }
        .hypr-notif__icon.info    { background: #60a5fa; color: #0a0f1a; }

        .hypr-notif__app {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
        }

        .hypr-notif__close {
          margin-left: auto;
          background: none;
          border: none;
          color: rgba(255,255,255,0.25);
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
          padding: 0 2px;
          transition: color 0.15s;
        }
        .hypr-notif__close:hover { color: rgba(255,255,255,0.7); }

        .hypr-notif__body {
          padding: 0 14px 13px;
          font-size: 12.5px;
          line-height: 1.55;
          color: rgba(232, 232, 240, 0.88);
        }

        .hypr-notif__bar {
          height: 2px;
          width: 100%;
          transition: none; /* set via JS for precise timing */
        }

        .hypr-notif__bar.success { background: #4ade80; }
        .hypr-notif__bar.error   { background: #f87171; }
        .hypr-notif__bar.info    { background: #60a5fa; }
      `;
      document.head.appendChild(s);
    }

    // Shared container
    let container = document.querySelector(".hypr-notif-wrap");
    if (!container) {
      container = document.createElement("div");
      container.className = "hypr-notif-wrap";
      document.body.appendChild(container);
    }

    /**
     * @param {string} message
     * @param {"success"|"error"|"info"} type
     * @param {number} [duration]
     */
    function show(message, type = "info", duration = CONFIG.notifDuration) {
      const icons = { success: "✓", error: "✕", info: "i" };

      const notif = document.createElement("div");
      notif.className = "hypr-notif";
      notif.innerHTML = `
        <div class="hypr-notif__header">
          <span class="hypr-notif__icon ${type}">${icons[type]}</span>
          <span class="hypr-notif__app">Webhook</span>
          <button class="hypr-notif__close" aria-label="Close">×</button>
        </div>
        <div class="hypr-notif__body">${message}</div>
        <div class="hypr-notif__bar ${type}"></div>
      `;

      container.appendChild(notif);

      // Animate in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => notif.classList.add("hypr-show"));
      });

      // Progress bar shrink
      const bar = notif.querySelector(".hypr-notif__bar");
      requestAnimationFrame(() => {
        bar.style.transition = `width ${duration}ms linear`;
        requestAnimationFrame(() => { bar.style.width = "0%"; });
      });

      // Dismiss helpers
      const dismiss = () => {
        notif.classList.add("hypr-hide");
        notif.classList.remove("hypr-show");
        setTimeout(() => notif.remove(), 280);
      };

      const timer = setTimeout(dismiss, duration);
      notif.querySelector(".hypr-notif__close").addEventListener("click", () => {
        clearTimeout(timer);
        dismiss();
      });
    }

    return { show };
  })();

  /* ─────────────────────────────────────────────
     PAGE METADATA EXTRACTION
  ───────────────────────────────────────────── */
  function getPageMeta() {
    const title = document.title || "Unknown Title";
    const url = window.location.href;
    const hostname = new URL(url).hostname;

    let thumbnail = null;
    let description = "No description available.";
    let uploadDate = "Unknown";

    // Try JSON-LD structured data first (VideoObject, Article, etc.)
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const data = JSON.parse(script.textContent);
        const targets = Array.isArray(data) ? data : [data];
        for (const node of targets) {
          if (!["VideoObject", "Article", "NewsArticle", "WebPage"].includes(node["@type"])) continue;
          thumbnail = Array.isArray(node.thumbnailUrl) ? node.thumbnailUrl[0] : node.thumbnailUrl ?? null;
          description = node.description ?? description;
          uploadDate = node.uploadDate ? new Date(node.uploadDate).toLocaleString() : uploadDate;
          break;
        }
      } catch { /* skip malformed */ }
    }

    // Fallback: og:image / twitter:image meta tags
    if (!thumbnail) {
      thumbnail =
        document.querySelector('meta[property="og:image"]')?.content ??
        document.querySelector('meta[name="twitter:image"]')?.content ??
        null;
    }

    // Fallback description from OG meta
    if (description === "No description available.") {
      description =
        document.querySelector('meta[property="og:description"]')?.content ??
        document.querySelector('meta[name="description"]')?.content ??
        description;
    }

    // Artist field (site-specific — extend as needed)
    let artist = "Unknown";
    const artistLabel = [...document.querySelectorAll(".label")]
      .find(el => el.textContent.trim() === "Artist");
    if (artistLabel) {
      artist = artistLabel.closest(".col")?.querySelector("span.name")?.textContent.trim() ?? artist;
    }

    return { title, url, hostname, thumbnail, description, uploadDate, artist };
  }

  /* ─────────────────────────────────────────────
     DISCORD EMBED BUILDER
  ───────────────────────────────────────────── */
  function buildPayload(meta) {
    const { title, url, hostname, thumbnail, description, uploadDate, artist } = meta;

    return {
      embeds: [{
        title,
        description: description.length > 350 ? description.slice(0, 347) + "…" : description,
        color: 0x7289da,
        ...(thumbnail && {
          thumbnail: { url: thumbnail },
          image:     { url: thumbnail },
        }),
        fields: [
          { name: "✦ Website",     value: hostname,                         inline: false },
          { name: "✦ Link",        value: `\`\`\`${url}\`\`\``,            inline: false },
          { name: "✦ Artist",      value: artist,                           inline: true  },
          { name: "✦ Upload Date", value: uploadDate,                       inline: true  },
          { name: "✦ Checked On",  value: new Date().toLocaleString(),      inline: false },
        ],
        footer: { text: CONFIG.footerText },
      }],
    };
  }

  /* ─────────────────────────────────────────────
     SEND WEBHOOK
  ───────────────────────────────────────────── */
  async function sendWebhook() {
    if (!CONFIG.webhookUrl) {
      Notify.show("No webhook URL configured.", "error");
      console.error("[Webhook] CONFIG.webhookUrl is empty.");
      return;
    }

    const meta    = getPageMeta();
    const payload = buildPayload(meta);

    console.log("[Webhook] Sending payload:", payload);
    Notify.show("Sending webhook…", "info", 2000);

    try {
      const res = await fetch(CONFIG.webhookUrl, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      if (res.ok) {
        Notify.show("Webhook delivered successfully.", "success");
        console.log("[Webhook] Sent:", res.status);
      } else {
        const body = await res.text();
        Notify.show(`Webhook failed — HTTP ${res.status}`, "error");
        console.error("[Webhook] Error response:", body);
      }
    } catch (err) {
      Notify.show("Network error — webhook not sent.", "error");
      console.error("[Webhook] Fetch error:", err);
    }
  }

  await sendWebhook();
})();
    
