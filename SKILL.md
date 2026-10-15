---
name: foundry-v14-system
description: Create, extend, debug or migrate a Foundry Virtual Tabletop GAME SYSTEM for Version 14 (target build 14.369). Covers system.json, TypeDataModel schemas, custom Actor/Item/ActiveEffect documents, ApplicationV2 + Handlebars sheets, Active Effects V2, rolls and chat messages, localization, compendium packs, and V14 breaking changes. Use this skill whenever the user talks about Foundry VTT / FVTT development — a system, a character sheet, actor or item types, data models, rolls, active effects, a module that touches system data — or names a TTRPG they want playable in Foundry, even if they do not say "V14" or "system" explicitly.
---

# Foundry VTT V14 — Game System Development

Target: **Foundry VTT Version 14, build 369** (`14.369`, "V14 Stable 11", released 2026-10-08).
Online API docs are labelled 14.368; build 369 only added bug fixes plus a `cssClass` option on `ContextMenu`.

## Sources of truth (in priority order)

1. **The installed core source** — unminified ES modules, the most reliable reference for the build actually installed.
   Run `python scripts/find_foundry.py` to locate it: it prints `app` (the core source folder), `build`, `data` (user data) and `systems`.
   Typical `app` locations: Windows `%PROGRAMFILES%/Foundry Virtual Tabletop/resources/app`, macOS
   `/Applications/Foundry Virtual Tabletop.app/Contents/Resources/app`, Node install `<install>/resources/app`.
   Override with the env vars `FOUNDRY_INSTALL` / `FOUNDRY_DATA`.
   - `client/`: client classes (`documents/`, `applications/`, `dice/`, `config.mjs`, and `client.mjs` for globals)
   - `common/`: shared code (`abstract/`, `data/fields.mjs`, `documents/` base schemas, `constants.mjs`)
   - `templates/`: core Handlebars templates (e.g. `templates/generic/tab-navigation.hbs`)
   Grep it before guessing a signature. If the installed build is not 14.369, say so to the user and trust the installed source over this skill.
2. **The online API**: `https://foundryvtt.com/api/` (see `references/api-lookup.md` for URL patterns).
3. **A real V14 system**: `foundryvtt/dnd5e` on GitHub (v6.x, `compatibility.minimum: "14.367"`).
4. The **Knowledge Base** articles (system-development, system-data-models) — conceptually right but their
   examples show `compatibility: 12`. Never copy version numbers from them.

User data: Windows `%LOCALAPPDATA%/FoundryVTT`, macOS `~/Library/Application Support/FoundryVTT`, Linux `~/.local/share/FoundryVTT`. Systems live in `<data>/Data/systems/<id>/`.

## V14 rules that trip people up

Code written from older tutorials (V10–V12) breaks or warns in V14. Check this list every time:

| Do this in V14 | Not this (legacy) |
|---|---|
| `documentTypes` in `system.json` + a `TypeDataModel` per subtype | `template.json` (deprecated since V14) |
| Sheets = `HandlebarsApplicationMixin(ActorSheetV2 / ItemSheetV2)` from `foundry.applications.*` | `ActorSheet` / `ItemSheet` (AppV1, now under `foundry.appv1.*`) |
| `foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, id, Sheet, {...})` | `Actors.registerSheet(...)` |
| `static DEFAULT_OPTIONS`, `static PARTS`, `static TABS`, `actions` with `data-action` | `defaultOptions`, `getData`, `activateListeners` with jQuery |
| `_prepareContext(options)` returns the context; `this.element` is a plain `HTMLElement` | `getData()`, `html.find(...)` |
| ActiveEffect changes in `effect.system.changes`, `type` is a string (`"add"`, `"override"`…) | `effect.changes`, numeric `mode` / `CONST.ACTIVE_EFFECT_MODES` |
| `roll.toMessage(data, { messageMode })`, modes `public`/`gm`/`blind`/`self`/`ic`, setting `core.messageMode` | `rollMode`, `core.rollMode`, `CONST.DICE_ROLL_MODES` |
| `{"system.foo": _del}` and `_replace(value)` (global operators) | `"system.-=foo": null`, `"==foo"` keys |
| `game.i18n.localize(key, data)` or the `_loc(key, data)` alias | `game.i18n.format` (merged into `localize`) |
| Regions (measured-template mode in the Region layer) | `MeasuredTemplate` documents (removed) |
| `ChatLog.CHAT_COMMANDS` | `ChatLog.MESSAGE_PATTERNS` (deprecated) |
| `CONFIG.statusEffects` as an object keyed by id | an array (still shimmed) |
| `foundry.applications.handlebars.loadTemplates`, `foundry.applications.ux.TextEditor.implementation` | bare globals `loadTemplates`, `TextEditor` |

`references/v14-changes.md` holds the full list, sourced from the release notes.

## Workflow: building a system

1. **Start from the template.** Run `python scripts/new_system.py <id> "<Title>" [--dest DIR]`.
   It copies `assets/system-template/` and renames every identifier. The template is a minimal, working V14 system: actor types `character` / `npc`, item types `gear` / `feature`, AppV2 sheets with tabs, rolls posted to chat, and EN/FR i18n.
   The default destination is the detected Foundry `Data/systems/` folder.
2. **Model the data first** (`references/data-models.md`). Add each subtype to `system.json → documentTypes` **and** to `CONFIG.<Doc>.dataModels` (the two must match). Put shared fields in a base class or a template function. Put derived values in `prepareDerivedData`, never in the schema.
3. **Custom documents** (`references/documents.md`): subclass `Actor` / `Item`, then assign `CONFIG.Actor.documentClass`. Keep subtype-specific logic in the data model and cross-type logic in the document.
4. **Sheets** (`references/sheets-appv2.md`): one AppV2 sheet class per family of types, Handlebars parts, actions, tabs.
5. **Rolls and chat** (`references/rolls-chat.md`). **Active effects** (`references/active-effects.md`).
6. **Localization** in `lang/*.json`, using `LOCALIZATION_PREFIXES` for automatic field labels.
7. **Compendiums** (`references/manifest.md` → packs), only once the data model is stable.
8. **Validate statically** with `python scripts/check_system.py <path-to-system>`. It catches mismatched ids, missing dataModels, a leftover template.json, broken lang JSON, missing files and legacy (pre-V14) API usage.
9. **Validate in the running app.** Foundry only discovers new systems **at startup**, so restart it after adding a system folder or changing `system.json`. Create or launch a test world that uses the system, then run `scripts/smoke_test.js` in the console (or through the built-in browser's JavaScript tool) as GM. It creates one document of each type, renders every sheet, rolls, creates an effect, then deletes its `[smoke]` documents. Afterwards, read the console warnings (deprecations show `since` / `until`).

## Reference index — read only what the task needs

| File | Read it when |
|---|---|
| `references/manifest.md` | writing or editing `system.json`, packs, languages, relationships, compatibility |
| `references/data-models.md` | defining schemas, field types, migrations, derived data, localization of fields |
| `references/documents.md` | custom Document classes, CRUD, update operators, flags, lifecycle hooks, settings, socket |
| `references/sheets-appv2.md` | any sheet or application: PARTS, TABS, actions, forms, drag & drop, templates, CSS |
| `references/active-effects.md` | effects, conditions, status effects, change types and phases |
| `references/rolls-chat.md` | dice, roll data, chat cards, message modes, initiative and combat |
| `references/v14-changes.md` | migrating older code, or anything that "worked in V12/V13" |
| `references/api-lookup.md` | you need an exact signature: how to grep the local source or fetch API pages |

## Working conventions

- Use ES modules (`.mjs`), `"esmodules"` in the manifest, and one entry file that registers everything inside `Hooks.once("init")`.
- Use the system id as the namespace for flags (`flags.<id>`), settings (`game.settings.register("<id>", ...)`), CSS (`.<id>` root class) and i18n keys (`<ID>.…`).
- Use lower-case, hyphenated file names; templates in `templates/`, styles in `styles/`, language files in `lang/`.
- Use only the public API (no `_private` or `#private` members). The `@protected` methods (`_prepareContext`, `_onRender`, `_preCreate`…) are meant to be overridden. Always call `super`.
- Bump `version` in `system.json` with each release. Set `compatibility.minimum` to `"14"` (or `"14.369"` if you rely on a build-specific fix) and `verified` to `"14.369"`.

## Improving this skill (continuous improvement)

This skill is published at **https://github.com/Nave20/foundry-v14-system-skill**, and the installed folder is a git clone of it. Every real use is a chance to make it better, so follow this loop:

1. **While working, keep a short list of skill gaps.** A gap is something you had to discover the hard way: a statement here that turned out wrong or outdated, a missing V14 pitfall, an API you had to look up repeatedly, a check that `check_system.py` should have caught, a helper you wrote that the template or scripts should provide, a smoke-test step that was missing.
2. **Keep only verified, general knowledge.** Each change must be confirmed by the installed Foundry source, the official docs or release notes, or a real test in Foundry. Never add anything specific to one project (the user's game rules, their system's names or data), and never add personal information (names, e-mails, usernames, absolute home paths, world names).
3. **At the end of the task, if the list is not empty**, edit the skill files, add an entry to `CHANGELOG.md` (semantic version: patch for fixes, minor for new content), and update the version in `README.md`.
4. **Verify before publishing.** Unless the user explicitly waives it:
   - run `scripts/check_system.py` on a system freshly generated with `scripts/new_system.py`;
   - restart Foundry if needed, then run `scripts/smoke_test.js` in a test world as GM;
   - if the change concerns code examples in `references/`, exercise them in that world too.
   Report the results in a component/status table.
5. **Run a privacy scan** of the diff (grep for the user's OS username, e-mail, home paths, private names). Commits must use the GitHub noreply identity configured in the clone, never a personal e-mail.
6. **Ask the user before every push.** Show the version, the CHANGELOG entry and the verification results, and push only after an explicit yes. Then `git add -A && git commit && git push`.
7. If the installed folder is not a clone the current user can push to (someone else's install), do not push. Offer to open an issue or a pull request on the repository instead.

If the installed Foundry build is newer than 14.369, treat that as a gap too. Re-check the release notes since 14.369, update `references/v14-changes.md` and the target build, and note it in the CHANGELOG.
