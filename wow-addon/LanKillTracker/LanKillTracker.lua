-- LAN Kill Tracker — Compatible WotLK 3.3.5 + MoP 5.x
-- Détecte boss kills, compte les wipes, screenshot auto, logging combat auto.
-- Aucune commande /reload nécessaire — le watcher lit WoWCombatLog.txt.

local GOLD  = "|cFFFFD700[LAN Kill Tracker]|r "
local GREEN = "|cFF00FF00"
local RED   = "|cFFFF4444"
local RESET = "|r"

-- Active le logging combat automatiquement
LoggingCombat(true)

-- Comptage des wipes en mémoire
local wipeCounts = {}

-- ── Compatibilité API WotLK / MoP ────────────────────────────────────
local function GetGroupMembers()
  local members = {}
  local player  = UnitName("player")
  table.insert(members, player)

  -- MoP+ : GetNumGroupMembers() + IsInRaid()
  if GetNumGroupMembers then
    local n = GetNumGroupMembers()
    if n > 0 then
      if IsInRaid and IsInRaid() then
        for i = 1, n do
          local name = GetRaidRosterInfo(i)
          if name then
            name = name:match("^([^%-]+)") or name
            if name ~= player then table.insert(members, name) end
          end
        end
      else
        -- Groupe de donjons : party1..party4 (n-1 autres joueurs)
        for i = 1, n - 1 do
          local name = UnitName("party" .. i)
          if name then table.insert(members, name) end
        end
      end
    end
  else
    -- WotLK legacy API
    if UnitInRaid("player") then
      for i = 1, GetNumRaidMembers() do
        local name = GetRaidRosterInfo(i)
        if name then
          name = name:match("^([^%-]+)") or name
          if name ~= player then table.insert(members, name) end
        end
      end
    else
      for i = 1, GetNumPartyMembers() do
        local name = UnitName("party" .. i)
        if name then table.insert(members, name) end
      end
    end
  end

  return members
end

-- ── Vérifie si c'est le premier kill du boss ──────────────────────────
local function IsFirstKill(bossName)
  if not LanKillTrackerDB or not LanKillTrackerDB.kills then return true end
  for _, k in ipairs(LanKillTrackerDB.kills) do
    if k.boss == bossName then return false end
  end
  return true
end

-- ── Evénement boss kill / wipe ────────────────────────────────────────
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

  local wipeCount = wipeCounts[key] or 0
  wipeCounts[key] = nil

  local instanceName = GetInstanceInfo()
  local isFirst      = IsFirstKill(encounterName)

  -- Initialise la DB si besoin
  LanKillTrackerDB = LanKillTrackerDB or {}
  LanKillTrackerDB.kills = LanKillTrackerDB.kills or {}

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

  local prefix = isFirst and (GREEN .. "FIRST KILL — " .. RESET) or ""
  DEFAULT_CHAT_FRAME:AddMessage(GOLD .. prefix .. GREEN .. encounterName .. RESET .. " kill !")
  if wipeCount > 0 then
    DEFAULT_CHAT_FRAME:AddMessage(GOLD .. wipeCount .. " wipe(s) avant le kill.")
  end
  DEFAULT_CHAT_FRAME:AddMessage(GOLD .. "Screenshot pris, post Discord automatique.")
end

-- ── Frame d'écoute ────────────────────────────────────────────────────
local frame = CreateFrame("Frame", "LanKillTrackerFrame")
frame:RegisterEvent("ENCOUNTER_END")
frame:SetScript("OnEvent", function(self, event, ...)
  if event == "ENCOUNTER_END" then OnEncounterEnd(...) end
end)

-- ── /lantk : résumé session ───────────────────────────────────────────
SLASH_LANTK1 = "/lantk"
SlashCmdList["LANTK"] = function()
  local kills = (LanKillTrackerDB or {}).kills or {}
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

DEFAULT_CHAT_FRAME:AddMessage(GOLD .. "Chargé — combat logging actif, Discord auto.")
