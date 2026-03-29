// XP Crystals — Server Logic (deposit / withdraw / recipes)
// XP is stored as raw integer points, so partial levels are preserved exactly.
// Formulas: https://minecraft.wiki/w/Experience

// ── XP math ──────────────────────────────────────────────────────────────────

// Total XP points needed to reach a given level from zero
function xpToReachLevel(level) {
    if (level <= 16) return level * level + 6 * level
    if (level <= 31) return 2.5 * level * level - 40.5 * level + 360
    return 4.5 * level * level - 162.5 * level + 2220
}

// XP points required to advance from level N to N+1
function xpForNextLevel(level) {
    if (level <= 15) return 2 * level + 7
    if (level <= 30) return 5 * level - 38
    return 9 * level - 158
}

// Convert a player's current level + progress into a total integer XP point count
function playerXpPoints(player) {
    const level    = player.experienceLevel
    const progress = player.experienceProgress
    return Math.floor(xpToReachLevel(level) + Math.round(progress * xpForNextLevel(level)))
}

// Resolve total XP points to { level, progress }
function pointsToLevelProgress(points) {
    let level = 0
    while (xpToReachLevel(level + 1) <= points) level++
    const base    = xpToReachLevel(level)
    const forNext = xpForNextLevel(level)
    return { level: level, progress: forNext > 0 ? (points - base) / forNext : 0 }
}

// Remove all XP from the player
function clearPlayerXp(player) {
    player.giveExperienceLevels(-player.experienceLevel)
    player.experienceProgress = 0.0
}

// Give the player exactly N additional XP points (preserves existing XP)
function givePlayerXpPoints(player, points) {
    if (points <= 0) return
    const newTotal              = playerXpPoints(player) + points
    const { level, progress }   = pointsToLevelProgress(newTotal)
    clearPlayerXp(player)
    player.giveExperienceLevels(level)
    player.experienceProgress = progress
}

// Take exactly N XP points from the player (clamps to zero)
function takePlayerXpPoints(player, points) {
    const newTotal              = Math.max(0, playerXpPoints(player) - points)
    const { level, progress }   = pointsToLevelProgress(newTotal)
    clearPlayerXp(player)
    if (newTotal > 0) {
        player.giveExperienceLevels(level)
        player.experienceProgress = progress
    }
}

// ── Tier configuration ───────────────────────────────────────────────────────
// Copper=10 / Silver=20 / Gold=30 / Platinum=40 / Mithril=50
const LEVEL_CAPS = { 1: 10, 2: 20, 3: 30, 4: 40, 5: 50 }

function capacityPoints(tier) {
    return Math.floor(xpToReachLevel(LEVEL_CAPS[tier]))
}

function getTier(itemId) {
    const match = itemId.match(/xp_crystal_(\d)$/)
    return match ? parseInt(match[1]) : null
}

// ── Java interop ─────────────────────────────────────────────────────────────
const DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents')
const CustomData     = Java.loadClass('net.minecraft.world.item.component.CustomData')
const CompoundTag    = Java.loadClass('net.minecraft.nbt.CompoundTag')

function getStoredPoints(item) {
    const data = item.get(DataComponents.CUSTOM_DATA)
    if (!data) return 0
    const tag = data.copyTag()
    return tag.contains('stored_xp') ? tag.getInt('stored_xp') : 0
}

function setStoredPoints(item, points) {
    if (points <= 0) {
        // Clear data entirely so all empty crystals are identical and stack together
        item.remove(DataComponents.CUSTOM_DATA)
        return
    }
    const tag = new CompoundTag()
    tag.putInt('stored_xp', points)
    item.set(DataComponents.CUSTOM_DATA, CustomData.of(tag))
}

// ── Right-click events ───────────────────────────────────────────────────────
// Right-click        = deposit all XP into crystal (up to capacity)
// Sneak+right-click  = withdraw enough points for 1 level (or all remaining)
const msgCooldown = {}  // key: "playerUUID:type" → last-sent timestamp (ms)

function canTell(player, type) {
    const key  = player.uuid + ':' + type
    const now  = Date.now()
    if (msgCooldown[key] && now - msgCooldown[key] < 2000) return false
    msgCooldown[key] = now
    return true
}

for (let i = 1; i <= 5; i++) {
    ItemEvents.rightClicked(`kubejs:xp_crystal_${i}`, event => {
        const { player, item } = event
        const tier     = getTier(item.id)
        if (tier === null) return

        const capPoints = capacityPoints(tier)
        const stored    = getStoredPoints(item)
        const count     = item.count  // all crystals in stack share the same stored_xp

        if (player.crouching) {
            if (stored <= 0) {
                if (canTell(player, 'empty')) player.tell('§cThe crystal is empty.')
                return
            }
            // All `count` crystals drain simultaneously — give XP for all of them
            const drainPerCrystal = Math.min(stored, xpForNextLevel(player.experienceLevel))
            givePlayerXpPoints(player, drainPerCrystal * count)
            setStoredPoints(item, stored - drainPerCrystal)
            player.playNotifySound('minecraft:entity.experience_orb.pickup', 'players', 0.5, 0.8)

        } else {
            const playerPoints = playerXpPoints(player)
            if (playerPoints <= 0) {
                if (canTell(player, 'noxp')) player.tell('§cYou have no XP to deposit.')
                return
            }
            if (stored >= capPoints) {
                if (canTell(player, 'full')) player.tell('§cThe crystal is full.')
                return
            }

            // Spread deposit evenly across all `count` crystals
            const totalSpace         = (capPoints - stored) * count
            const toTake             = Math.min(playerPoints, totalSpace)
            const newStoredPerCrystal = stored + Math.floor(toTake / count)
            const actualTaken        = (newStoredPerCrystal - stored) * count

            takePlayerXpPoints(player, actualTaken)
            setStoredPoints(item, newStoredPerCrystal)
            player.playNotifySound('minecraft:entity.experience_orb.pickup', 'players', 0.5, 1.5)
        }

        event.cancel()
    })
}

// ── Recipes ──────────────────────────────────────────────────────────────────

ServerEvents.recipes(event => {
    // Tier I (3 levels) — early game: amethyst + glass bottle
    event.shaped('kubejs:xp_crystal_1', [
        ' A ',
        'ABA',
        ' A '
    ], {
        A: 'minecraft:amethyst_shard',
        B: 'minecraft:glass_bottle'
    })

    // Tier II (10 levels) — amethyst + experience bottle + Tier I
    event.shaped('kubejs:xp_crystal_2', [
        'AEA',
        'EBE',
        'AEA'
    ], {
        A: 'minecraft:amethyst_shard',
        E: 'minecraft:experience_bottle',
        B: 'kubejs:xp_crystal_1'
    })

    // Tier III (30 levels) — ender pearls (post-nether) + Tier II
    event.shaped('kubejs:xp_crystal_3', [
        'PPP',
        'PBP',
        'PPP'
    ], {
        P: 'minecraft:ender_pearl',
        B: 'kubejs:xp_crystal_2'
    })

    // Tier IV (50 levels) — ender eyes + echo shards (deep dark) + Tier III
    event.shaped('kubejs:xp_crystal_4', [
        'ESE',
        'SBS',
        'ESE'
    ], {
        E: 'minecraft:ender_eye',
        S: 'minecraft:echo_shard',
        B: 'kubejs:xp_crystal_3'
    })

    // Tier V (unlimited) — nether star (wither kill required) + Tier IV
    event.shaped('kubejs:xp_crystal_5', [
        ' N ',
        'NBN',
        ' N '
    ], {
        N: 'minecraft:nether_star',
        B: 'kubejs:xp_crystal_4'
    })
})
