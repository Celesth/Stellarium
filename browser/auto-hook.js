// [Save This As A Custom Js Runner In A Browser Or Extension To Use./


(async function sendWebhook() {
  const webhookUrl = "discord Webhook here.";

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

  // Try to find the Artist
  let artist = "Unknown";
  const artistLabel = Array.from(document.querySelectorAll('.label')).find(el => el.textContent.trim() === "Artist");
  if (artistLabel) {
    const artistSpan = artistLabel.closest('.col')?.querySelector('span.name');
    if (artistSpan) artist = artistSpan.textContent.trim();
  }

  const executedOn = new Date().toLocaleString();

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
  .then(res => console.log("Webhook Sent:", res.status))
  .catch(err => console.error("Error:", err));
})();
