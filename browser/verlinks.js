// [Save This As A Custom Js Runner In A Browser Or Extension To Use]
// [Paste Your Webhook Link Under 'webhookUrl']
// [Some Browsers Doesn't Support Font Importing]
// [If You Find This Usefull, Please Star ⭐, Also No Skiding It]
(async function sendWebhook() {
  const webhookUrl = "webhook url here";

  const fontStyle = document.createElement("style");
  fontStyle.innerHTML = `
    @font-face {
      font-family: 'Google Sans';
      src: url('https://github.com/Rairof/Theme-Fonts/raw/main/GoogleSans/GoogleSans-Normal.ttf') format('truetype');
    }
  `;
  document.head.appendChild(fontStyle);

  const websiteTitle = document.title || "Unknown Title";
  const websiteUrl = window.location.href;
  const websiteName = new URL(websiteUrl).hostname;

  let imageUrl = null;
  let uploadDate = "Unknown";
  let description = "No description found.";

  const jsonScripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (let script of jsonScripts) {
    try {
      const jsonData = JSON.parse(script.textContent);
      if (jsonData['@type'] === "VideoObject") {
        if (jsonData.thumbnailUrl) {
          imageUrl = Array.isArray(jsonData.thumbnailUrl)
            ? jsonData.thumbnailUrl[0]
            : jsonData.thumbnailUrl;
        }
        if (jsonData.description) description = jsonData.description;
        if (jsonData.uploadDate) uploadDate = new Date(jsonData.uploadDate).toLocaleString();
        break;
      }
    } catch (e) {
      console.error("JSON parsing error:", e);
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
      padding: "16px 28px",
      background: success ? "rgba(40, 180, 99, 0.2)" : "rgba(231, 76, 60, 0.2)",
      color: "#fff",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      borderRadius: "16px",
      border: success ? "1px solid #27ae60" : "1px solid #e74c3c",
      boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
      fontSize: "15px",
      fontFamily: "'Google Sans', sans-serif",
      zIndex: "9999",
      opacity: "0",
      transition: "opacity 0.6s ease"
    });
    document.body.appendChild(notif);
    requestAnimationFrame(() => notif.style.opacity = "1");
    setTimeout(() => {
      notif.style.opacity = "0";
      setTimeout(() => notif.remove(), 600);
    }, 4000);
  }

  const payload = {
    embeds: [{
      title: websiteTitle,
      description: description,
      thumbnail: imageUrl ? { url: imageUrl } : undefined,
      image: imageUrl ? { url: imageUrl } : undefined,
      fields: [
        { name: "Website", value: websiteName, inline: false },
        { name: "Link", value: `[Click Here](${websiteUrl})`, inline: false },
        { name: "Artist", value: artist, inline: true },
        { name: "Upload Date", value: uploadDate, inline: true },
        { name: "Checked On", value: executedOn, inline: false }
      ],
      footer: { text: "Made by Celesth" }
    }]
  };

  console.log("Payload being sent to Discord:", JSON.stringify(payload, null, 2));

  fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
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
