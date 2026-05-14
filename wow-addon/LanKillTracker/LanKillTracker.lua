-- LAN Kill Tracker — Addon WoW WotLK 3.3.5
-- Détecte les boss kills, prend un screenshot, sauvegarde pour le watcher Discord

LanKillTrackerDB = LanKillTrackerDB or {}
LanKillTrackerDB.kills = LanKillTrackerDB.kills or {}

local GOLD  = "|cFFFFD700[LAN Kill Tracker]|r "
local GREEN = "|cFF00FF00"
local RESET = "|r"

-- Récupère les noms des membres du groupe
local function GetGroupMembers()
  local members = {}
  local player  = UnitName("player")
  table.insert(members, player)

  if UnitInRaid("player") then
    for i = 1, GetNumRaidMembers() do
      local name = GetRaidRosterInfo(i)
      if name then
        name = name:match("^([^%-]+)") or name   -- retire le "-Realm"
        if name ~= player then
          table.insert(members, name)
        end
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

-- Evénement boss kill
local function OnEncounterEnd(encounterID, encounterName, difficultyID, groupSize, success)
  if success ~= 1 then return end

  local kill = {
    boss        = encounterName,
    encounterID = encounterID,
    difficulty  = difficultyID,
    timestamp   = time(),
    date        = date("%d/%m/%Y"),
    hour        = date("%H:%M"),
    players     = GetGroupMembers(),
  }

  table.insert(LanKillTrackerDB.kills, kill)

  -- Screenshot automatique
  Screenshot()

  -- Messages in-game
  DEFAULT_CHAT_FRAME:AddMessage(GOLD .. GREEN .. encounterName .. RESET .. " enregistré !")
  DEFAULT_CHAT_FRAME:AddMessage(GOLD .. "Fais " .. GREEN .. "/reload" .. RESET .. " pour poster sur Discord.")
end

-- Frame d'écoute des events
local frame = CreateFrame("Frame", "LanKillTrackerFrame")
frame:RegisterEvent("ENCOUNTER_END")
frame:SetScript("OnEvent", function(self, event, ...)
  if event == "ENCOUNTER_END" then
    OnEncounterEnd(...)
  end
end)

-- Commande /lantk pour voir les kills enregistrés
SLASH_LANTK1 = "/lantk"
SlashCmdList["LANTK"] = function(msg)
  local kills = LanKillTrackerDB.kills
  if #kills == 0 then
    DEFAULT_CHAT_FRAME:AddMessage(GOLD .. "Aucun kill enregistré.")
    return
  end
  DEFAULT_CHAT_FRAME:AddMessage(GOLD .. #kills .. " kill(s) enregistré(s) :")
  for i, k in ipairs(kills) do
    DEFAULT_CHAT_FRAME:AddMessage(string.format("  %d. %s — %s %s", i, k.boss, k.date, k.hour))
  end
end

DEFAULT_CHAT_FRAME:AddMessage(GOLD .. "Chargé. /lantk pour voir les kills enregistrés.")
