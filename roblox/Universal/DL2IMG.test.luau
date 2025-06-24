--[[
   discord: korieuko
   Status: 🟢
]]

--// Services
local uis = game:GetService("UserInputService")
local rs = game:GetService("RunService")
local coreGui = game:GetService("CoreGui")
local cam = workspace.CurrentCamera

--// Utilities
local function toVec2(pos)
	return typeof(pos) == "Vector3" and Vector2.new(pos.X, pos.Y) or pos
end

--// Setup: Executor name (fallback: Unknown)
local executor = typeof(identifyexecutor) == "function" and identifyexecutor() or "Unknown"

--// Main Table Container
local Main = {

	--// ✅ Notification (first one - GUI text)
	Notify = function(text)
		local gui = Instance.new("ScreenGui", coreGui)
		gui.IgnoreGuiInset = true
		gui.Name = "DrawNotify"

		local frame = Instance.new("Frame", gui)
		frame.Position = UDim2.new(0.5, -160, 0.45, 0)
		frame.Size = UDim2.new(0, 320, 0, 60)
		frame.BackgroundColor3 = Color3.fromRGB(26, 25, 26)
		frame.BackgroundTransparency = 1
		frame.ZIndex = 5

		Instance.new("UICorner", frame).CornerRadius = UDim.new(0, 8)

		local stroke = Instance.new("UIStroke", frame)
		stroke.Color = Color3.fromRGB(100, 100, 100)
		stroke.Thickness = 1.2

		local shadow = Instance.new("ImageLabel", frame)
		shadow.Image = "rbxassetid://1316045217"
		shadow.BackgroundTransparency = 1
		shadow.ImageTransparency = 0.5
		shadow.ImageColor3 = Color3.fromRGB(15, 15, 15)
		shadow.ScaleType = Enum.ScaleType.Slice
		shadow.SliceCenter = Rect.new(10, 10, 118, 118)
		shadow.AnchorPoint = Vector2.new(0.5, 0.5)
		shadow.Position = UDim2.new(0.5, 2, 0.5, 2)
		shadow.Size = UDim2.new(1, 14, 1, 14)
		shadow.ZIndex = 4

		local label = Instance.new("TextLabel", frame)
		label.Text = text
		label.Size = UDim2.new(1, -20, 1, 0)
		label.Position = UDim2.new(0, 10, 0, 0)
		label.BackgroundTransparency = 1
		label.TextColor3 = Color3.new(1, 1, 1)
		label.Font = Enum.Font.Code
		label.TextSize = 14
		label.TextXAlignment = Enum.TextXAlignment.Left
		label.ZIndex = 6

		for i = 1, 10 do
			frame.BackgroundTransparency = 1 - (i * 0.1)
			task.wait(0.03)
		end

		task.delay(5, function()
			gui:Destroy()
		end)
	end,

	--// 🖼️ DrawingLib-based image popup (second notification)
	ShowImage = function(url)
		local req = http_request or request or syn and syn.request or fluxus and fluxus.request
		assert(req, "❌ No supported request API")

		local response = req({
			Url = url,
			Method = "GET"
		})
		assert(response and response.Body and response.StatusCode == 200, "❌ Failed to fetch image.")

		local viewport = cam.ViewportSize
		local imgSize = Vector2.new(400, 300)

		local img = Drawing.new("Image")
		img.Data = response.Body
		img.Size = imgSize
		img.Position = Vector2.new(
			(viewport.X - imgSize.X) / 2,
			(viewport.Y - imgSize.Y) / 2
		)
		img.Rounding = 7
		img.Transparency = 1
		img.Visible = true

		local dragging, offset = false, Vector2.zero

		task.wait(2)
		for i = 1, 20 do
			img.Transparency = 1 - (i / 20)
			task.wait(0.025)
		end

		task.delay(7, function()
			for i = 1, 20 do
				img.Transparency = i / 20
				task.wait(0.025)
			end
			pcall(function() img:Remove() end)
		end)

		local conn
		conn = rs.RenderStepped:Connect(function()
			if img then img.Visible = true else conn:Disconnect() end
		end)

		uis.InputBegan:Connect(function(input)
			local pos = toVec2(input.Position)
			if pos.X >= img.Position.X and pos.X <= img.Position.X + img.Size.X and
			   pos.Y >= img.Position.Y and pos.Y <= img.Position.Y + img.Size.Y then
				if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
					dragging = true
					offset = pos - img.Position
				end
			end
		end)

		uis.InputEnded:Connect(function(input)
			if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
				dragging = false
			end
		end)

		uis.InputChanged:Connect(function(input)
			if dragging and (input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch) then
				img.Position = toVec2(input.Position) - offset
			end
		end)
	end
}

--// ✅ Detection logic + Execution
do
	local ok = pcall(function()
		local test = Drawing.new("Image")
		test:Remove()
	end)

	if ok then
		Main.Notify("✔️ " .. executor .. " has DrawingLib integrated")
		Main.ShowImage("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTHyGN2-qJ_ZxeP2nvc1tNbZTDmU8zJh1IPbddJkXKfFpKv8pv2FwbbqUg&s=10")
	else
		Main.Notify("❌ DrawingLib not found in " .. executor)
	end
end