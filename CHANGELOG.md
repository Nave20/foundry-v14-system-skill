# Changelog

Versions follow [semantic versioning](https://semver.org/): patch for fixes, minor for new content, major for a new Foundry generation or a restructure.
Each entry records the Foundry build it was verified against.

## 1.0.0 — 2026-10-15

Verified against **Foundry VTT 14.369**.

- First release.
- References: manifest, data models, documents, AppV2 sheets, Active Effects V2, rolls and chat, V14 changes (14.349 → 14.369), API lookup.
- Minimal V14 system template (character/npc actors, gear/feature items, AppV2 sheets with tabs, rolls, EN/FR).
- Scripts: `find_foundry.py`, `new_system.py`, `check_system.py`, `smoke_test.js`.
- Verification: the template passed `check_system.py` with 0 errors and 0 warnings, and passed `smoke_test.js` (16/16 steps) in a 14.369 world, with no console errors or deprecation warnings.
