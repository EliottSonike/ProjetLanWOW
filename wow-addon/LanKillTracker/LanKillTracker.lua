-- LAN Kill Tracker — Addon WoW WotLK 3.3.5
-- Détecte boss kills, compte les wipes, prend un screenshot, sauvegarde pour le watcher Discord

LanKillTrackerDB = LanKillTrackerDB or {}
LanKillTrackerDB.kills = LanKillTrackerDB.kills or {}
LanKillTrackerDB.wipes = LanKillTrackerDB.wipes or {}   -- wipes en cours par encounterID

local GOLD  = "|cFFFFD700[LAN Kill Tracker]|r "
local GREEN = "|cFF00FF00"
local RED   = "|cFFFF4444"
local RESET = "|r"

-- Récupère les noms des membres du groupe/raid
local function GetGroupMembers()
  local members = {}
  local player  = UnitName("player")
  table.insert(members, player)

  if UnitInRaid("player") then
    for i = 1, GetNumRaidMembers() do
      local name = GetRaidRosterInfo(i)
      if name then
        name = name:match("^([^%-]+)") or name   -- retire le "-Realm"
        if name ~= player then table.insert(members, name) end
      end
    end
  else
    for i = 1, GetNumPartyMembers() do
      local name = UnitName("party" .. i)
      if name then table.insert(members, name) end
    end
  end

  return members
end

-- Vérifie si c'est le premier kill de ce boss
local function IsFirstKill(bossName)
  for _, k in ipairs(LanKillTrackerDB.kills) do
    if k.boss == bossName then return false end
  end
  return true
end

-- Evénement boss kill / wipe
local function OnEncounterEnd(encounterID, encounterName, difficultyID, groupSize, success)
  local key = tostring(encounterID)

  if success == 0 then
    -- Wipe : incrémente le compteur
    LanKillTrackerDB.wipes[key] = (LanKillTrackerDB.wipes[key] or 0) + 1
    DEFAULT_CHAT_FRAME:AddMessage(
      GOLD .. RED .. "Wipe " .. RESET ..
      "(" .. LanKillTrackerDB.wipes[key] .. ") sur " .. encounterName
    )
    return
  end

  -- Kill
  local wipeCount = LanKillTrackerDB.wipes[key] or 0
  LanKillTrackerDB.wipes[key] = nil   -- reset pour le prochain pull

  local instanceName = GetInstanceInfo()   -- nom du donjon/raid (WotLK 3.3.5)
  local isFirst      = IsFirstKill(encounterName)

  local kill = {
    boss        = encounterName,
    raid        = instanceName or "Unknown",
    encounterID = encounterID,
    difficulty  = difficultyID,
    wipes       = wipeCount,
    first       = isFirst,
    timestamp   = time(),
    date        = date("%d/%m/%Y"),
    hour        = date("%H:%M"),
    players     = GetGroupMembers(),
  }

  table.insert(LanKillTrackerDB.kills, kill)
  Screenshot()

  -- Messages in-game
  local prefix = isFirst and (GREEN .. "FIRST KILL — " .. RESET) or ""
  DEFAULT_CHAT_FRAME:AddMessage(GOLD .. prefix .. GREEN .. encounterName .. RESET .. " enregistré !")
  if wipeCount > 0 then
    DEFAULT_CHAT_FRAME:AddMessage(GOLD .. wipeCount .. " wipe(s) avant le kill.")
  end
  DEFAULT_CHAT_FRAME:AddMessage(GOLD .. "Fais " .. GREEN .. "/reload" .. RESET .. " pour poster sur Discord.")
end

-- Frame d'écoute
local frame = CreateFrame("Frame", "LanKillTrackerFrame")
frame:RegisterEvent("ENCOUNTER_END")
frame:SetScript("OnEvent", function(self, event, ...)
  if event == "ENCOUNTER_END" then OnEncounterEnd(...) end
end)

-- /lantk pour voir les kills
SLASH_LANTK1 = "/lantk"
SlashCmdList["LANTK"] = function(msg)
  local kills = LanKillTrackerDB.kills
  if #kills == 0 then
    DEFAULT_CHAT_FRAME:AddMessage(GOLD .. "Aucun kill enregistré.")
    return
  end
  DEFAULT_CHAT_FRAME:AddMessage(GOLD .. #kills .. " kill(s) enregistré(s) :")
  for i, k in ipairs(kills) do
    local flag = k.first and " [FIRST]" or ""
    DEFAULT_CHAT_FRAME:AddMessage(
      string.format("  %d. %s%s — %d wipe(s) — %s %s", i, k.boss, flag, k.wipes or 0, k.date, k.hour)
    )
  end
end

DEFAULT_CHAT_FRAME:AddMessage(GOLD .. "Chargé. /lantk pour voir les kills.")
