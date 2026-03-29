// XP Crystals — Item Registration
// Tier capacities in XP *points* (= xpToReachLevel of each level cap):
//   Copper   = 10 levels =  160 pts
//   Silver   = 20 levels =  550 pts
//   Gold     = 30 levels = 1395 pts
//   Platinum = 40 levels = 2920 pts
//   Mithril  = 50 levels = 5345 pts
const TIER_POINT_CAPS = [160, 550, 1395, 2920, 5345]

StartupEvents.registry('item', event => {
    for (let i = 1; i <= 5; i++) {
        event.create(`xp_crystal_${i}`)
            .maxStackSize(16)
            .tag('currency:xp_crystal')
    }
})
