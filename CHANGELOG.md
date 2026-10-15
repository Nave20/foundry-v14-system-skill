# Changelog

Versions follow [semantic versioning](https://semver.org/): patch for fixes, minor for new content, major for a new Foundry generation or a restructure.
Each entry records the Foundry build it was verified against.

## 1.1.0 — 2026-10-15

Verified against **Foundry VTT 14.369**. These lessons came from building a five-actor-type system with the skill.

- `new_system.py`: system ids may contain underscores. Foundry's `BasePackage.validateId` allows `[A-Za-z0-9-_]`; the script used to reject them.
- `check_system.py`: no longer flags legacy globals that are actually local aliases of the namespaced API, such as `const TextEditor = foundry.applications.ux.TextEditor.implementation`.
- Template sheets now include the `standard-form` class. Without it, `{{formGroup}}` rows stack the label above the input in V14. Documented in `SKILL.md` and `references/sheets-appv2.md`.
- `references/sheets-appv2.md`: how V14 injects system CSS (`@import … layer(system)`), editable array lists in forms (`system.list.N.key` and `ArrayField._cast`), and keeping `gmOnly` inputs out of player forms.
- `references/manifest.md`: underscores are allowed in ids, and one language file can be mapped to several language codes.
- `references/api-lookup.md`: wait before relaunching the desktop app after killing it.

## 1.0.0 — 2026-10-15

Verified against **Foundry VTT 14.369**.

- First release.
- References: manifest, data models, documents, AppV2 sheets, Active Effects V2, rolls and chat, V14 changes (14.349 → 14.369), API lookup.
- Minimal V14 system template (character/npc actors, gear/feature items, AppV2 sheets with tabs, rolls, EN/FR).
- Scripts: `find_foundry.py`, `new_system.py`, `check_system.py`, `smoke_test.js`.
- Verification: the template passed `check_system.py` with 0 errors and 0 warnings, and passed `smoke_test.js` (16/16 steps) in a 14.369 world, with no console errors or deprecation warnings.
