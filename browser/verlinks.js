// [Save This As A Custom Js Runner In A Browser Or Extension To Use]
// [Paste Your Webhook Link Under 'webhookUrl']
// [Some Browsers Doesn't Support Font Importing]
// [If You Find This Usefull, Please Star ⭐, Also No Skiding It]
(async function sendWebhook() {
  const webhookUrl = "https://discord.com/api/webhooks/"; // Your Discord webhook URL

  // Inject Google Sans font
  const fontStyle = document.createElement("style");
  fontStyle.innerHTML = `
    @font-face {
      font-family: 'Google Sans';
      src: url('https://github.com/Rairof/Theme-Fonts/raw/main/GoogleSans/GoogleSans-Normal.ttf') format('truetype');
    }
  `;
  document.head.appendChild(fontStyle);

  // Get website info
  const websiteTitle = document.title || "Unknown Title";
  const websiteUrl = window.location.href;
  const websiteName = new URL(websiteUrl).hostname;

  // Extract video metadata from JSON-LD
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

  // Extract artist if available
  let artist = "Unknown";
  const artistLabel = Array.from(document.querySelectorAll('.label')).find(el => el.textContent.trim() === "Artist");
  if (artistLabel) {
    const artistSpan = artistLabel.closest('.col')?.querySelector('span.name');
    if (artistSpan) artist = artistSpan.textContent.trim();
  }

  const executedOn = new Date().toLocaleString();

  // VapeV4-style notification
  function showNotification(message, success = true, duration = 3500) {
    const notif = document.createElement("div");
    const bar = document.createElement("div");

    notif.textContent = message;

    Object.assign(notif.style, {
      position: "fixed",
      bottom: "30px",
      right: "30px",
      padding: "12px 22px",
      background: "#111111",
      color: "white",
      fontFamily: "'Google Sans', sans-serif",
      fontSize: "14px",
      borderRadius: "10px",
      border: success ? "1px solid #56ffa9" : "1px solid #ff4f4f",
      boxShadow: "0 0 10px rgba(0,0,0,0.45)",
      opacity: "0",
      transform: "translateY(15px)",
      transition: "opacity 0.3s ease, transform 0.3s ease",
      zIndex: 9999,
      overflow: "hidden",
    });

    Object.assign(bar.style, {
      position: "absolute",
      bottom: "0",
      left: "0",
      height: "3px",
      width: "100%",
      background: success ? "#56ffa9" : "#ff4f4f",
      transition: `width ${duration}ms linear`,
    });

    notif.appendChild(bar);
    document.body.appendChild(notif);

    // Animate in
    requestAnimationFrame(() => {
      notif.style.opacity = "1";
      notif.style.transform = "translateY(0)";
    });

    // Shrink bar
    requestAnimationFrame(() => {
      bar.style.width = "0%";
    });

    // Fade out
    setTimeout(() => {
      notif.style.opacity = "0";
      notif.style.transform = "translateY(15px)";
      setTimeout(() => notif.remove(), 300);
    }, duration);
  }

  // Build Discord payload
  const payload = {
    embeds: [{
      title: websiteTitle,
      description: description,
      thumbnail: imageUrl ? { url: imageUrl } : undefined,
      image: imageUrl ? { url: imageUrl } : undefined,
      fields: [
        { name: "Website", value: websiteName, inline: false },
        // Copyable black box for link
        { name: "Link", value: `\`\`\`${websiteUrl}\`\`\``, inline: false },
        { name: "Artist", value: artist, inline: true },
        { name: "Upload Date", value: uploadDate, inline: true },
        { name: "Checked On", value: executedOn, inline: false }
      ],
      footer: { text: "Made by Celesth" }
    }]
  };

  console.log("Payload being sent to Discord:", JSON.stringify(payload, null, 2));

  // Send webhook
  fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(res => {
      console.log("Webhook Sent:", res.status);
      showNotification("Webhook sent successfully!", true);
    })
    .catch(err => {
      console.error("Error:", err);
      showNotification("Webhook failed to send.", false);
    });
})();
