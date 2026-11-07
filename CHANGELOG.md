# Changelog

Versions follow [semantic versioning](https://semver.org/): patch for fixes, minor for new content, major for a new Foundry generation or a restructure.
Each entry records the Foundry build it was verified against.

## 1.4.0 — 2026-11-07

Verified against **Foundry VTT 14.369**. These lessons came from the fourth session on the same system: resources spent during rolls, extending rolls from the chat, a clickable health track.

- `references/rolls-chat.md`:
  - buttons on chat cards bound in the `renderChatMessageHTML` hook (plain `HTMLElement`, owner check, a custom `data-*` attribute, follow-up data in flags);
  - deterministic dice for tests through `CONFIG.Dice.randomUniform`, with the verified mapping from `u` to the face.
- `references/documents.md`: capping a stored value by a derived maximum in `_preUpdate`, using the post-update data (`mergeObject(..., { inplace: false })`), and `actor.reset()` after a world setting that the derived data depends on changes.

## 1.3.0 — 2026-11-06

Verified against **Foundry VTT 14.369**. These lessons came from the third session on the same system: trait profiles with JSON export and import, a dice pool with a custom chat card.

- `references/rolls-chat.md`, new section **Custom result card**:
  - keeping a real `Roll` with your own HTML `content` (`toMessage({ content })`, kept only when it contains elements);
  - outcome in `flags`;
  - colours that read on the light parchment of the chat log;
  - house rules in a world setting with defaults merged at read time.
- `references/sheets-appv2.md`: controls inside a sheet that must not submit it (`stopPropagation` on `change` in a container), and keeping transient UI state across re-renders.
- `references/api-lookup.md`:
  - `foundry.utils` cannot be monkey-patched;
  - testing exports and imports without real file dialogs;
  - importing system modules in the console to test pure functions.

## 1.2.0 — 2026-11-06

Verified against **Foundry VTT 14.369**. These lessons came from the second working session on a five-actor-type system: clickable dots, GM configuration window, welcome scene.

- `references/sheets-appv2.md`:
  - custom input widgets (a hidden input plus a bubbling `change` event) and `data-dtype` casting;
  - every key of an `ArrayField` row must be in the form;
  - `ObjectField` for keys added at runtime;
  - why `<datalist>` cannot be styled, and how to build a suggestion menu (focus and Escape pitfalls);
  - per-subtype CSS classes through `_initializeApplicationOptions`;
  - the core form footer part;
  - GM configuration windows with `registerMenu` (`restricted`) and a world `Object` setting that re-renders open sheets.
- New section **UI entry points**: left toolbar tools in the V14 `getSceneControlButtons` record, and the 14.369 pitfall that toolbar clicks are ignored while `canvas.ready` is false (no active scene), with two fallbacks: a `renderSceneControls` listener and a Settings sidebar button.
- `references/v14-changes.md`: scene images now live on the first `Level` (`levels[0].background.src`), with a verified recipe for creating a scene that shows an image.
- `references/manifest.md`: the `background` field (join screen and world tile), read at server start.
- `references/api-lookup.md`: testing in a live world without disturbing the user (close the test client), launching a world through `POST /setup`, what needs a restart and what needs only a reload, and spotting a stale client.
- `SKILL.md`: two new rows in the V14 pitfalls table (scene levels, toolbar without a scene).

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
