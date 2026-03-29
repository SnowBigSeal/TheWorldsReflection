// XP Crystal Villager Trades — requires MoreJS addon
// Tier point caps must match startup_scripts/xp_crystals.js
//   Copper=160  Silver=550  Gold=1395  Platinum=2920  Mithril=5345

MoreJS.villagerTrades(event => {
    const copperFull   = Item.of('kubejs:xp_crystal_1[custom_data={stored_xp:160}]');
    const silverFull   = Item.of('kubejs:xp_crystal_2[custom_data={stored_xp:550}]');
    const goldFull     = Item.of('kubejs:xp_crystal_3[custom_data={stored_xp:1395}]');
    const platinumFull = Item.of('kubejs:xp_crystal_4[custom_data={stored_xp:2920}]');
    const mithrilFull  = Item.of('kubejs:xp_crystal_5[custom_data={stored_xp:5345}]');

    function potion(id) {
        return Item.of('minecraft:potion[potion_contents={potion:"' + id + '"}]');
    }

    // ── Cleric ────────────────────────────────────────────────────────────
    event.removeVanillaTypedTrades(['minecraft:cleric']);

    // Tier 1 – Novice: Copper Crystal → basic healing/vision
    event.addTrade('minecraft:cleric', 1, [copperFull], potion('minecraft:healing'));
    event.addTrade('minecraft:cleric', 1, [copperFull], potion('minecraft:night_vision'));

    // Tier 2 – Apprentice: Silver Crystal → utility
    event.addTrade('minecraft:cleric', 2, [silverFull], potion('minecraft:regeneration'));
    event.addTrade('minecraft:cleric', 2, [silverFull], potion('minecraft:fire_resistance'));

    // Tier 3 – Journeyman: Gold Crystal → combat buffs
    event.addTrade('minecraft:cleric', 3, [goldFull], potion('minecraft:strength'));
    event.addTrade('minecraft:cleric', 3, [goldFull], potion('minecraft:swiftness'));

    // Tier 4 – Expert: Platinum Crystal → enhanced potions
    event.addTrade('minecraft:cleric', 4, [platinumFull], potion('minecraft:strong_healing'));
    event.addTrade('minecraft:cleric', 4, [platinumFull], potion('minecraft:strong_strength'));

    // Tier 5 – Master: Mithril Crystal → rare/legendary
    event.addTrade('minecraft:cleric', 5, [mithrilFull], potion('minecraft:luck'));
    event.addTrade('minecraft:cleric', 5, [mithrilFull], Item.of('minecraft:experience_bottle', 16));
});
