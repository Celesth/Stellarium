// [Save This As A Custom Js Runner In A Browser Or Extension To Use]
// [Paste Your Webhook Link Under 'webhookUrl']
// [Some Browsers Doesn't Support Font Importing]
// [If You Find This Usefull, Please Star ⭐, Also No Skiding It]

(async function sendWebhook() {
  const webhookUrl = "Discord.Webhook.Url";

  const fontStyle = document.createElement("style");
  fontStyle.innerHTML = `
    @font-face {
      font-family: 'Google Sans';
      src: url('https://github.com/Rairof/Theme-Fonts/raw/main/GoogleSans/GoogleSans-Normal.ttf') format('truetype');
    }
  `;
  document.head.appendChild(fontStyle);

  const websiteUrl = window.location.href;
  const websiteName = new URL(websiteUrl).hostname;
  const executedOn = new Date().toLocaleString();

  let websiteTitle = "Unknown Title";
  let imageUrl = null;
  let artist = "Unknown";
  let description = "No description found.";
  let uploadDate = "Unknown";

  if (websiteName === "www.iwara.tv") {
    // Custom selectors for this website

    // Title
    const titleEl = document.querySelector("#app > div.page.page-video > section > div > div > div.col-12.col-md-9 > div.page-video__details > div.text.mb-1.text--h1.text--bold");
    if (titleEl) websiteTitle = titleEl.textContent.trim();

    // Thumbnail
    const posterDiv = document.querySelector(".vjs-poster");
    if (posterDiv) {
      const bgStyle = posterDiv.style.backgroundImage;
      const match = bgStyle.match(/url\(["']?(\/\/[^"')]+)["']?\)/);
      if (match) imageUrl = "https:" + match[1];
    }

    // Artist
    const artistEl = document.querySelector("a.avatar[href^='/profile/']");
    if (artistEl) {
      const href = artistEl.getAttribute("href");
      const username = href.split("/").filter(Boolean).pop();
      if (username) artist = username;
    }

    // Description (optional)
    const descMeta = document.querySelector("meta[name='description']");
    if (descMeta) description = descMeta.getAttribute("content") || description;
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
    })
    .catch(err => {
      console.error("Error:", err);
    });
})();
