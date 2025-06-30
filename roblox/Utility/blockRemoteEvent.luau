local event = REMOTEEVENTHERE

local old; old = hookmetamethod(game, "__namecall", newcclosure(function(self, ...)
    local args = {...}
    local method = getnamecallmethod()
    if method == 'FireServer' and self == event then
        return task.wait(9e9)
    end
    return old(self, ...)
end))
