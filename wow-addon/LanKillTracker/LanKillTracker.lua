-- LAN Kill Tracker — Addon WoW WotLK 3.3.5
-- Détecte boss kills, compte les wipes, screenshot auto, logging combat auto.
-- Aucune commande /reload nécessaire — le watcher lit WoWCombatLog.txt en temps réel.

local GOLD  = "|cFFFFD700[LAN Kill Tracker]|r "
local GREEN = "|cFF00FF00"
local RED   = "|cFFFF4444"
local RESET = "|r"

-- Active le logging combat automatiquement au démarrage
LoggingCombat(true)

-- Comptage des wipes par encounterID (en mémoire uniquement, pas besoin SavedVars)
local wipeCounts = {}

local function OnEncounterEnd(encounterID, encounterName, difficultyID, groupSize, success)
  local key = tostring(encounterID)

  if success == 0 then
    wipeCounts[key] = (wipeCounts[key] or 0) + 1
    DEFAULT_CHAT_FRAME:AddMessage(
      GOLD .. RED .. "Wipe " .. RESET ..
      "(" .. wipeCounts[key] .. ") sur " .. encounterName
    )
    return
  end

  -- Kill
  local wipeCount  = wipeCounts[key] or 0
  wipeCounts[key]  = nil

  Screenshot()

  local prefix = wipeCount > 0 and (" — " .. GREEN .. wipeCount .. " wipe(s)" .. RESET) or ""
  DEFAULT_CHAT_FRAME:AddMessage(GOLD .. GREEN .. encounterName .. RESET .. " kill !" .. prefix)
  DEFAULT_CHAT_FRAME:AddMessage(GOLD .. "Screenshot pris, post Discord automatique.")
end

local frame = CreateFrame("Frame", "LanKillTrackerFrame")
frame:RegisterEvent("ENCOUNTER_END")
frame:SetScript("OnEvent", function(self, event, ...)
  if event == "ENCOUNTER_END" then OnEncounterEnd(...) end
end)

-- /lantk : affiche un résumé de la session (wipes en cours)
SLASH_LANTK1 = "/lantk"
SlashCmdList["LANTK"] = function()
  local hasWipes = false
  for k, v in pairs(wipeCounts) do
    DEFAULT_CHAT_FRAME:AddMessage(GOLD .. "Encounter " .. k .. " : " .. v .. " wipe(s)")
    hasWipes = true
  end
  if not hasWipes then
    DEFAULT_CHAT_FRAME:AddMessage(GOLD .. "Aucun wipe en cours.")
  end
end

DEFAULT_CHAT_FRAME:AddMessage(GOLD .. "Chargé — combat logging actif, Discord auto.")
