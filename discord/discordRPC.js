// Discord-self-bot RPC
// Have insane risks of getting terminated or banned.(TOS violation)
// Status: 🟢

const WebSocket = require("ws");

const token = "YOUR_USER_TOKEN_HERE";

const ws = new WebSocket("wss://gateway.discord.gg/?v=9&encoding=json");

ws.on("open", () => console.log("🔌 Connected to Discord Gateway"));

ws.on("message", (data) => {
  const payload = JSON.parse(data);
  const { op, d } = payload;

  if (op === 10) {
    // Start heartbeat
    setInterval(() => ws.send(JSON.stringify({ op: 1, d: null })), d.heartbeat_interval);

    // Identify with token
    ws.send(JSON.stringify({
      op: 2,
      d: {
        token,
        properties: {
          os: "Windows", // change according to needs
          browser: "Chrome", // change according to needs
          device: "",
        },
        presence: {
          status: "online",
          since: 0,
          afk: false,
          activities: [
            {
              name: "Rizzing Up Da Goth Girls",
              type: 4, // Custom
              details: "Hooking up with goth gfs",
              state: "get goth gfs",
              timestamps: {
                start: Math.floor(Date.now() / 1000)
              },
              application_id: "very cool number", // optional
              assets: {
                large_image: "beeg image",
                large_text: "beeg text",
                small_image: "smol image",
                small_text: "Smol text"
              },
              buttons: [
                { label: "Join Discord", url: "youtube.com" },
                { label: "Get Scripts", url: "https://gogogaga.com" }
              ]
            }
          ]
        }
      }
    }));
  }
});
