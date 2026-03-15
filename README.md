# The World's Reflection

A NeoForge 1.21.1 modpack built around exploring 9 parallel mirror dimensions, each a reflection of the Overworld with a unique biome palette, environmental hazards, and boss ecosystem.

## Overview

- **Loader:** NeoForge 1.21.1
- **Custom Mods:** `fracturedworlds`, `hostilemobscore`, `hostilemobsoverworld`
- **Focus:** Exploration, progression through mirror dimensions, tiered crafting and combat

## Structure

| Directory | Purpose |
|---|---|
| `config/` | Mod configuration files |
| `defaultconfigs/` | Default configs shipped with the pack |
| `datapacks/` | Server-side datapacks |
| `kubejs/` | KubeJS scripts and data |
| `kubejs/server_scripts/` | Recipe tweaks, loot, game logic |
| `kubejs/client_scripts/` | Client-side UI/tooltip scripts |
| `kubejs/startup_scripts/` | Startup registry modifications |
| `kubejs/data/` | KubeJS data overrides |
| `changelogs/` | Per-version changelog entries |
| `local/` | Local-only overrides (gitignored) |
| `mods/` | Mod JARs (gitignored, managed by manifest) |

## Development

Custom mods are developed separately and referenced as local dependencies:
- `fracturedworlds`
- `hostilemobscore`
- `hostilemobsoverworld`
