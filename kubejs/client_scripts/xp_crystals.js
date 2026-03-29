const CRYSTAL_NAMES = [
    'Copper Crystal',
    'Silver Crystal',
    'Gold Crystal',
    'Platinum Crystal',
    'Mithril Crystal'
]

ClientEvents.lang('en_us', event => {
    for (let i = 0; i < 5; i++) {
        event.add(`item.kubejs.xp_crystal_${i + 1}`, CRYSTAL_NAMES[i])
    }
})
