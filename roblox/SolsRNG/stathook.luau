--[[
   discord: korieuko
   Status: 🟢
]]

-- Services
local TextChatService = game:GetService("TextChatService")
local HttpService = game:GetService("HttpService")

-- Webhook URL
_G.WebhookUrl = _G.WebhookUrl or "https://discord.com/api/webhooks/default_webhook_id/default_token"

-- Convert text to Markdown format (removes font tags)
local function convertToMarkdown(rawText)
    rawText = rawText:gsub('<font color="([^"]+)">', '')
    rawText = rawText:gsub('</font>', '')
    return rawText
end

-- Embed Format Function
local function EmbedFormat(displayName, username, itemName, chance)
    -- Get the current date and time
    local currentDate = os.date("%d/%m/%y")
    local currentTime = os.date("%I:%M%p"):lower()

    -- Create embed structure
    local embed = {
        ["title"] = "Aura Rolled!",
        ["description"] = displayName .. " (@**" .. username .. "**) has found **" .. itemName .. "**!",
        ["color"] = 2895667,
        ["fields"] = {
            {["name"] = "Chance", ["value"] = chance, ["inline"] = true},
            {["name"] = "DisplayName", ["value"] = displayName, ["inline"] = true},
            {["name"] = "Username", ["value"] = username, ["inline"] = true},
            {["name"] = "Date", ["value"] = currentDate, ["inline"] = true},
            {["name"] = "Time", ["value"] = currentTime, ["inline"] = true}
        },
        ["footer"] = {["text"] = "made by celesth"}
    }

    local data = {["embeds"] = {embed}}
    return HttpService:JSONEncode(data)
end

-- Function to Send Webhook
local function sendWebhook(webhookUrl, data)
    local headers = {["content-type"] = "application/json"}
    local request = http_request or request or HttpPost
    local webhookRequest = {
        Url = webhookUrl, 
        Body = data, 
        Method = "POST", 
        Headers = headers
    }
    request(webhookRequest)
end

-- Listener for "Server Message" Channel
TextChatService.OnIncomingMessage = function(message)
    -- Ensure the message is coming from the "Server Message" tab
    if message.TextChannel and message.TextChannel.Name == "Server Message" then
        local keyword = "HAS FOUND"
        if string.find(message.Text, keyword) then
            local cleanedText = convertToMarkdown(message.Text)

            -- Extract display name and username
            local displayName, username = string.match(cleanedText, "^(.-)%(@(.-)%) HAS FOUND")
            displayName = displayName or "Unknown Display Name"
            username = username or "Unknown Username"

            -- Extract the Aura Name and Chance
            local itemName = string.match(cleanedText, "HAS FOUND (.+), CHANCE OF") or "Unknown Item"
            local chance = string.match(cleanedText, "CHANCE OF (.+)") or "Unknown Chance"

            -- Debug message filtering
            print("[Filtered]: " .. cleanedText)

            -- Create webhook data and send it
            local webhookData = EmbedFormat(displayName, username, itemName, chance)
            sendWebhook(_G.WebhookUrl, webhookData) -- Fixed issue here
        end
    end

    -- Retain the original message properties
    local messageProperties = Instance.new("TextChatMessageProperties")
    messageProperties.Text = message.Text
    messageProperties.PrefixText = message.PrefixText
    return messageProperties
end
