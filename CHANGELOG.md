# Changelog

Versions follow [semantic versioning](https://semver.org/): patch for fixes, minor for new content, major for a new Foundry generation or a restructure.
Each entry records the Foundry build it was verified against.

## 1.9.0 — 2026-11-12

Verified against **Foundry VTT 14.369**. These lessons came from importing about two hundred non-player characters from Obsidian notes.

- `references/documents.md`, new section « Creating many actors from notes »: mapping by schema, checking values before `Actor.create`, isolating failures, a report grouped by kind, folders, re-import by flag, portraits and tokens, compendium lookups cached per batch.
- `SKILL.md`: joining a world whose GM user has a password (ask for a dedicated GM user).

## 1.8.0 — 2026-11-12

Verified against **Foundry VTT 14.369**. These lessons came from a module built alongside the system: a holographic 3D map of Paris in a window, synced with a local mini-server.

- New `references/modules-3d-external.md`:
  - a module that depends on an external local service: saying so, locking cleanly, only the active GM polling, CORS;
  - renaming a module: settings namespace, world module list, relaunch to rescan packages;
  - a three.js scene in an ApplicationV2 window: loading, render loop, no long work in `_onFirstRender`, no awaiting `requestAnimationFrame`, GPU-animated progress bars, HTML labels;
  - drawing hundreds of thousands of objects: merged geometry, additive glow without white-out (hidden-line faces + fog), terrain, anti-moiré stripes, separate exaggeration factors;
  - sharing the data with a Claude artifact through a local MCP server.
- `SKILL.md`: the new reference is listed.

## 1.7.0 — 2026-11-09

Verified against **Foundry VTT 14.369**. These lessons came from the seventh session on the same system: players rolling their own combat steps, powers, merits and flaws.

- `references/sheets-appv2.md`, new section 11c-bis:
  - one item sheet for several types (`_configureRenderParts`);
  - overriding `_onDropItem(event, item)` to turn a dropped item into a list line;
  - filtering embedded items by type;
  - a long settings window with bounded height, a scrollable body and a fixed footer.
- `references/rolls-chat.md`: letting each player roll their own step of a chat card (pending step in flags, roll on the clicking client, faces validated by the GM).
- `references/documents.md`: deleting a world compendium, filling several compendiums from one file, parsing notes with a tested Python parser.
- `SKILL.md`: `launchWorld` needs the setup page's session; a desktop client can cache an old language file (restart before concluding a key is missing).

## 1.6.0 — 2026-11-08

Verified against **Foundry VTT 14.369**. These lessons came from the sixth session on the same system: weapons, a combat chat card and werewolf forms.

- `references/sheets-appv2.md`:
  - a tab for some document types only (`_configureRenderParts` and `_prepareTabs`);
  - controls shared by several tabs belong in a part outside the tabs;
  - new section 11d "Layout and security pitfalls": the core hides empty `.hint`, `url()` in a CSS variable resolves against the stylesheet, `mask` clips `filter`, `data-tooltip` renders HTML.
- `references/rolls-chat.md`:
  - `evaluateSync` refuses dice;
  - new section "Interactive chat card that advances": state in flags, content sanitisation (`hidden` stripped), GM-only controls and secrets, player actions through the socket, double-click guard, testing the rules with Node.
- `references/documents.md`: the socket listener's second argument is the sender id given by the server; filling a world compendium from a script.
- `references/data-models.md`: form-dependent derived values, before and after `super.prepareDerivedData()`.
- `SKILL.md`: a scripted click works on hidden elements; check visibility or use the real mouse.

## 1.5.0 — 2026-11-08

Verified against **Foundry VTT 14.369**. These lessons came from the fifth session on the same system: animated gauges in the sheet header.

- `references/sheets-appv2.md`, new section 11c "Animated widgets in a sheet":
  - animating across re-renders by passing the last displayed value to the new widget;
  - stopping `requestAnimationFrame` loops with `isConnected`, unique SVG ids per widget;
  - keeping repeating CSS animations in step with a negative delay from a shared clock;
  - keyframes on `transform` replacing a static `transform`, `prefers-reduced-motion`;
  - core flex sizes of `.form-group` children squeezing custom rows, and the override.
- `references/data-models.md`: promoting a list entry to its own field in `migrateData`; `NumberField({ min })` rejecting updates, and reading the minimum from the schema.
- `references/documents.md`: a shared capacity where one value wins, enforced in `_preUpdate`.
- `SKILL.md`: joining a passwordless test world and launching a world from a script (`/join` with `userId`, `/setup` `launchWorld`).

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
