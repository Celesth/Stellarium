// ==UserScript==
// @name         Celesth's Blob/Etc Logger ( yt-dlp and discord too )
// @namespace    
// @version      3.0
// @description  Logs .m3u8 URLs + full headers + cookies for yt-dlp
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const webhookURL = "Replace This With Your Discord Webhook"; // Replace with your webhook URL

    // Send message to Discord
    function sendToDiscord(message) {
        fetch(webhookURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: "```py\n" + message + "\n```" })
        }).catch(err => console.error("Webhook Error:", err));
    }

    // Build yt-dlp command
    function buildYtDlpCommand(url, headers, cookies) {
        let cmd = `yt-dlp "${url}" \\\n`;
        for (let [key, value] of Object.entries(headers)) {
            cmd += `  --add-header "${key}: ${value}" \\\n`;
        }
        if (cookies) {
            cmd += `  --add-header "Cookie: ${cookies}" \\\n`;
        }
        cmd += `  -o "video.mp4"`;
        return cmd;
    }

    // Get default page headers
    function getBaseHeaders() {
        return {
            "User-Agent": navigator.userAgent,
            "Referer": location.href,
            "Origin": location.origin
        };
    }

    // Get cookies for the current domain
    function getCookies() {
        try {
            return document.cookie; // Simple, works for non-HttpOnly cookies
        } catch (e) {
            return "";
        }
    }

    function handleMediaUrl(url, extraHeaders) {
        if (!/\.m3u8(\?|$)/i.test(url)) return;
        const headers = Object.assign({}, getBaseHeaders(), extraHeaders || {});
        const cookies = getCookies();
        const cmd = buildYtDlpCommand(url, headers, cookies);
        console.log("[HLS Logger] Sending command to Discord:", cmd);
        sendToDiscord(cmd);
    }

    // Hook fetch
    const origFetch = window.fetch;
    window.fetch = async function(input, init) {
        const res = await origFetch.apply(this, arguments);
        try {
            const url = (typeof input === "string") ? input : input.url;
            const extraHeaders = {};
            if (init && init.headers) {
                if (init.headers instanceof Headers) {
                    init.headers.forEach((v, k) => extraHeaders[k] = v);
                } else {
                    Object.assign(extraHeaders, init.headers);
                }
            }
            handleMediaUrl(url, extraHeaders);
        } catch (e) { console.error(e); }
        return res;
    };

    // Hook XHR
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url) {
        this._url = url;
        return origOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function(body) {
        try {
            handleMediaUrl(this._url);
        } catch (e) { console.error(e); }
        return origSend.apply(this, arguments);
    };

})();
