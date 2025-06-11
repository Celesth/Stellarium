--[[
 discord: korieuko
 haven't updated since ban
--]]

local Players = game:GetService("Players")
local MarketplaceService = game:GetService("MarketplaceService")

local lp = Players.LocalPlayer
local animationInfo = {}
local animPatterns = { "Slash", "Swing", "Sword" }

local function getInfo(id)
    local success, info = pcall(function()
        return MarketplaceService:GetProductInfo(id)
    end)
    return success and info or { Name = "" }
end

local function block()
    keypress(0x46)
    wait()
    keyrelease(0x46)
end

local function onCharacterAdded(v)
    return function(char)
        local humanoid = char:WaitForChild("Humanoid", 5)
        if not humanoid then return end

        humanoid.AnimationPlayed:Connect(function(track)
            local animId = track.Animation.AnimationId
            if not animationInfo[animId] then
                local id = tonumber(animId:match("%d+"))
                if not id then return end
                animationInfo[animId] = getInfo(id)
            end

            local info = animationInfo[animId]
            local vHead = v.Character and v.Character:FindFirstChild("Head")
            local lpHead = lp.Character and lp.Character:FindFirstChild("Head")
            if not (vHead and lpHead) then return end

            if (vHead.Position - lpHead.Position).Magnitude < 15 then
                for _, pattern in ipairs(animPatterns) do
                    if info.Name:find(pattern) then
                        pcall(block)
                        break
                    end
                end
            end
        end)
    end
end

local function onPlayerAdded(v)
    if v == lp then return end
    if v.Character then onCharacterAdded(v)(v.Character) end
    v.CharacterAdded:Connect(onCharacterAdded(v))
end

-- Connect existing and future players
for _, v in ipairs(Players:GetPlayers()) do
    onPlayerAdded(v)
end

Players.PlayerAdded:Connect(onPlayerAdded)
