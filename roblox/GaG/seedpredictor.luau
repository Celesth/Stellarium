-- released by usamiername on V3rm

local SeedData = require(game.ReplicatedStorage.Data.SeedData)
local GearData = require(game.ReplicatedStorage.Data.GearData)

local SeedKeyOrdering = {}
local GearKeyOrdering = {}

for Key in pairs(SeedData) do
    table.insert(SeedKeyOrdering, Key)
end
for Key in pairs(GearData) do
    table.insert(GearKeyOrdering, Key)
end

table.sort(SeedKeyOrdering, function(a, b)
    return SeedData[a].Price < SeedData[b].Price
end)
table.sort(GearKeyOrdering, function(a, b)
    return GearData[a].Price < GearData[b].Price
end)

function GetSeedStockAtSeed(Seed)
    local Rand = Random.new(Seed)
    local Stock = {}
    for _, key in pairs(SeedKeyOrdering) do
        v = SeedData[key]
        local StockChance = Rand:NextInteger(1, v.StockChance)
        local StockAmount = Rand:NextInteger(v.StockAmount[1], v.StockAmount[2])
        if StockChance == 1 and StockAmount > 0 and v.DisplayInShop then
            Stock[v.SeedName] = StockAmount
        end
    end
    return Stock
end
function FindSeedStock(SeedName, Increment, Seed)
    local StockSearched = 0;
    local Found = 0
    local Amount = 0
    while Found ~= Increment do
        StockSearched = StockSearched + 1
        local AllSeedStock = GetSeedStockAtSeed(Seed + StockSearched)
        if AllSeedStock[SeedName] then
            Found = Found + 1
            Amount = AllSeedStock[SeedName]
        end
    end
    return StockSearched, Amount
end

function GetGearStockAtSeed(Seed)
    local Rand = Random.new(Seed)
    local Stock = {}
    for _, key in pairs(GearKeyOrdering) do
        v = GearData[key]
        local StockChance = Rand:NextInteger(1, v.StockChance)
        local StockAmount = Rand:NextInteger(v.StockAmount[1], v.StockAmount[2])
        if StockChance == 1 and StockAmount > 0 and v.DisplayInShop then
            Stock[v.GearName] = StockAmount
        end
    end
    return Stock
end
function FindGearStock(GearName, Increment, Seed)
    local StockSearched = 0;
    local Found = 0
    local Amount = 0
    while Found ~= Increment do
        StockSearched = StockSearched + 1
        local AllGearStock = GetGearStockAtSeed(Seed + StockSearched)
        if AllGearStock[GearName] then
            Found = Found + 1
            Amount = AllGearStock[GearName]
        end
    end
    return StockSearched, Amount
end

--[[
    Usage:
    GetSeedStockAtSeed(Seed), GetGearStockAtSeed(Seed)
        Seed -> random seed

        Returns the seed shop stock or the gear shop stock at a given Random.new() seed.
        In the game, the seed for the current seed shop or gear shop is given by
        floor(UnixTimeInSeconds/300).
    FindSeedStock(SeedName, Increment, Seed), FindGearStock(GearName, Increment, Seed)
        SeedName, GearName -> name of the item to search
        Increment -> the order of the occurrence (1 for next, 2 for the one after, etc.)
        Seed -> random seed

        Returns the amount of restocks until the item given by SeedName or GearName
        is in the seed shop / gear shop, as well as the amount of items to restock.
        The result can be converted into Unix time by adding it to the current seed
        and multiplying by 300 (since restocks happen every 5 minutes).
]]
local CurrentSeed = math.floor(workspace:GetServerTimeNow()/300)

local Item = "Grandmaster Sprinkler"
local StockSearched, Amount = FindGearStock(Item, 1, CurrentSeed)
print(
    "There will be a "
    .. Item ..
    " in "
    .. tostring(StockSearched) ..
    " restock(s) [amount: "
    .. tostring(Amount) ..
    "] (at "
    .. os.date("%m/%d/%Y %H:%M:%S %Z", (CurrentSeed + StockSearched) * 300) ..
    ")"
)
