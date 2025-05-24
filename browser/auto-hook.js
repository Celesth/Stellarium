// [Save This As A Custom Js Runner In A Browser Or Extension To Use]
// [Paste Your Webhook Link Under 'webhookUrl']
// [Some Browsers Doesn't Support Font Importing]
// [If You Find This Usefull, Please Star ⭐, Also No Skiding It]

(async function sendWebhook() {
  const webhookUrl = "https://discord.com/api/webhooks/channel_id/token";

  // Inject Google Sans Regular
  const fontLink = document.createElement("link");
  fontLink.href = "https://github.com/Rairof/Theme-Fonts/raw/main/GoogleSans/GoogleSans-Normal.ttf?raw=1";
  fontLink.rel = "stylesheet";
  document.head.appendChild(fontLink);

  const websiteTitle = document.title || "Unknown Title";
  const websiteUrl = window.location.href;
  const websiteName = new URL(websiteUrl).hostname;

  let metaTags = document.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]');
  let imageUrl = metaTags.length > 0 ? metaTags[0].getAttribute("content") : null;

  let uploadDate = "Unknown";
  let jsonScripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (let script of jsonScripts) {
    try {
      let jsonData = JSON.parse(script.textContent);
      if (jsonData.thumbnailUrl && !imageUrl) imageUrl = jsonData.thumbnailUrl;
      if (jsonData.uploadDate) uploadDate = new Date(jsonData.uploadDate).toLocaleString();
    } catch (e) {
      console.error("JSON Parsing Error:", e);
    }
  }

  let artist = "Unknown";
  const artistLabel = Array.from(document.querySelectorAll('.label')).find(el => el.textContent.trim() === "Artist");
  if (artistLabel) {
    const artistSpan = artistLabel.closest('.col')?.querySelector('span.name');
    if (artistSpan) artist = artistSpan.textContent.trim();
  }

  const executedOn = new Date().toLocaleString();

  function showNotification(message, success = true) {
    const notif = document.createElement("div");
    notif.textContent = message;
    Object.assign(notif.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      padding: "14px 24px",
      background: success ? "rgba(76, 175, 80, 0.2)" : "rgba(244, 67, 54, 0.2)",
      color: "#fff",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      borderRadius: "14px",
      border: success ? "1px solid #4caf50" : "1px solid #f44336",
      boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      fontSize: "14px",
      fontFamily: "'Google Sans', sans-serif",
      zIndex: "9999",
      opacity: "0",
      transition: "opacity 0.5s ease"
    });
    document.body.appendChild(notif);
    requestAnimationFrame(() => notif.style.opacity = "1");
    setTimeout(() => {
      notif.style.opacity = "0";
      setTimeout(() => notif.remove(), 500);
    }, 4000);
  }

  fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: websiteTitle,
        thumbnail: imageUrl ? { url: imageUrl } : undefined,
        fields: [
          { name: "Website", value: websiteName, inline: false },
          { name: "Link", value: `[Click Here](${websiteUrl})`, inline: false },
          { name: "Artist", value: artist, inline: true },
          { name: "Upload Date", value: uploadDate, inline: true },
          { name: "Checked On", value: executedOn, inline: false }
        ],
        footer: { text: "Made by Celesth" }
      }]
    })
  })
  .then(res => {
    console.log("Webhook Sent:", res.status);
    showNotification("Webhook sent successfully!");
  })
  .catch(err => {
    console.error("Error:", err);
    showNotification("Webhook failed to send.", false);
  });
})();
