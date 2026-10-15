# foundry-v14-system — a Claude skill for Foundry VTT V14 game systems

A [Claude](https://claude.com/claude-code) **skill** that teaches Claude how to create, extend, debug and migrate
**game systems for Foundry Virtual Tabletop, Version 14**.

> **Target version: Foundry VTT 14, build 369 (`14.369`, "V14 Stable 11", 2026-10-08).**
> Everything in this skill was checked against the source code of that exact build.
> The target build **will change** as Foundry releases new builds. Check [`CHANGELOG.md`](CHANGELOG.md)
> for the build each version of the skill was verified against.

Current skill version: **1.0.0**

## What it contains

| Path | Content |
|---|---|
| `SKILL.md` | Entry point: V14 pitfalls (legacy vs V14 table), workflow, reference index, continuous-improvement rules |
| `references/manifest.md` | `system.json` for V14: `documentTypes`, packs, languages, compatibility |
| `references/data-models.md` | `TypeDataModel`, field types and options, data preparation order, migrations, field localization, `_del` / `_replace` |
| `references/documents.md` | Custom Document classes, CRUD, lifecycle, hooks, settings, sockets, user queries |
| `references/sheets-appv2.md` | ApplicationV2 + Handlebars sheets: `PARTS`, `TABS`, actions, forms, drag & drop, dialogs, CSS |
| `references/active-effects.md` | Active Effects V2: `system.changes`, string change types, phases, durations, status effects |
| `references/rolls-chat.md` | Rolls, `messageMode` (replaces roll modes), chat cards, initiative |
| `references/v14-changes.md` | Every system-relevant change from 14.349 to 14.369, plus a migration checklist |
| `references/api-lookup.md` | Where to look things up: installed core source, online API, a real V14 system |
| `assets/system-template/` | A minimal, working V14 system (2 actor types, 2 item types, AppV2 sheets, rolls, EN/FR) |
| `scripts/find_foundry.py` | Locates the Foundry install (core source and build) and user-data folder |
| `scripts/new_system.py` | Scaffolds a new system from the template |
| `scripts/check_system.py` | Static checks: manifest, files, data models vs `documentTypes`, legacy API usage |
| `scripts/smoke_test.js` | In-game test (run as GM): creates, renders, rolls, then cleans up |

## Installation (Claude Code)

```bash
git clone https://github.com/Nave20/foundry-v14-system-skill ~/.claude/skills/foundry-v14-system
```

Claude then loads the skill automatically whenever you talk about Foundry VTT development.
Python 3.9+ is needed for the scripts.

## Quick start

```bash
python ~/.claude/skills/foundry-v14-system/scripts/new_system.py mysystem "My System" --author "Your Name"
python ~/.claude/skills/foundry-v14-system/scripts/check_system.py <foundry-data>/Data/systems/mysystem
```

Restart Foundry (it only discovers new systems at startup), create a world with the system, then paste
`scripts/smoke_test.js` into the browser console as GM.

## How the skill improves

`SKILL.md` asks Claude to note every gap it hits while using the skill: wrong or outdated information, missing
pitfalls, missing checks. Only verified, general knowledge goes back into the skill, after a test in Foundry and a
privacy check, and the maintainer approves every push. Issues and pull requests are welcome.

## Sources

- Foundry VTT API documentation: https://foundryvtt.com/api/
- Release notes 14.349 → 14.369: https://foundryvtt.com/releases/
- Knowledge Base: https://foundryvtt.com/article/system-development/ and https://foundryvtt.com/article/system-data-models/
- The official D&D 5e system (V14-compatible), used as a real-world reference: https://github.com/foundryvtt/dnd5e

## License and disclaimer

[MIT](LICENSE) for the content of this repository. The repository contains **no Foundry VTT source code**, only
original explanations, examples and scripts. Foundry Virtual Tabletop is a trademark of Foundry Gaming LLC. This
project is not affiliated with or endorsed by Foundry Gaming LLC.
