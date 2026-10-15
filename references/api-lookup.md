# Looking things up precisely

Do not guess a signature. The local source is the exact 14.369 code and is faster to search than the website.

## 1. Local source (preferred)

Root: the `app` path printed by `python scripts/find_foundry.py`
(Windows default: `%PROGRAMFILES%/Foundry Virtual Tabletop/resources/app/`).

| Need | Where |
|---|---|
| Document client logic (`Actor#getRollData`, `ActiveEffect#apply…`) | `client/documents/<name>.mjs` |
| Document schema (`defineSchema`, `metadata`) | `common/documents/<name>.mjs` |
| DataModel / TypeDataModel / Document base | `common/abstract/data.mjs`, `common/abstract/document.mjs` |
| Field classes and options | `common/data/fields.mjs`, `common/data/_types.mjs` |
| Constants (`CONST.*`) | `common/constants.mjs` |
| `CONFIG.*` defaults | `client/config.mjs` |
| Globals (`_del`, `_replace`, `_loc`, `fromUuid`) | `client/client.mjs` |
| AppV2 core | `client/applications/api/` (application, handlebars-application, document-sheet, dialog) |
| Core sheets (examples to imitate) | `client/applications/sheets/` (actor-sheet, item-sheet, active-effect-config…) |
| Form helpers (`formGroup`, `formInput`) | `client/applications/forms/fields.mjs`, `client/applications/handlebars.mjs` |
| Custom elements (`<prose-mirror>`, `<formula-input>`) | `client/applications/elements/` |
| Hook signatures (documented stubs) | `client/hooks.mjs` |
| Dice | `client/dice/` (roll.mjs, terms/) |
| Core templates (`tab-navigation.hbs`…) | `templates/` |
| Manifest schema | `common/packages/base-system.mjs`, `common/packages/_types.mjs` |
| Core strings (to reuse core i18n keys) | `public/lang/en.json` |

Use Grep, for example `pattern: "static DEFAULT_OPTIONS"`, `path: ".../client/applications/sheets"`.
Deprecations: grep `logCompatibilityWarning` with `since: 14` to see what V14 deprecated and when it will be removed.

## 2. Online API (TypeDoc)

- Home: `https://foundryvtt.com/api/`
- Class: `https://foundryvtt.com/api/classes/<full.namespace.Class>.html`
  for example `classes/foundry.documents.Actor.html`, `classes/foundry.applications.sheets.ActorSheetV2.html`,
  `classes/foundry.abstract.TypeDataModel.html`, `classes/foundry.data.ActiveEffectTypeDataModel.html`
- Namespace: `https://foundryvtt.com/api/modules/foundry.data.fields.html`, `modules/hookEvents.html`
- Function: `https://foundryvtt.com/api/functions/foundry.applications.api.HandlebarsApplicationMixin.html`
- Constant: `https://foundryvtt.com/api/variables/CONST.CHAT_MESSAGE_STYLES.html`
- Release notes: `https://foundryvtt.com/releases/14.369` (any build number)
- Knowledge base: `https://foundryvtt.com/article/system-development/`, `/article/system-data-models/` (older examples)

The pages are large. Fetch them with WebFetch and a precise question, or download one with curl and grep for the member name (`### methodName`).

## 3. Real-world V14 code

`foundryvtt/dnd5e` (master, v6.x, minimum 14.367) shows production patterns: `dnd5e.mjs` (init and registration), `module/data/abstract/*`, `module/applications/actor/api/base-actor-sheet.mjs`, `module/documents/active-effect.mjs`.
Raw files: `https://raw.githubusercontent.com/foundryvtt/dnd5e/master/<path>`.
Treat it as a reference, not a template: it is far more complex than a typical system needs.

## 4. Testing in the running app

- The browser console (F12) inside Foundry shows `CONFIG`, `game.system`, `game.actors`, `CONFIG.Actor.dataModels`, and you can run `new Roll("1d20").evaluate()`.
- `CONFIG.debug.hooks = true` logs every hook call.
- After changing `system.json`, return to Setup and relaunch the world. Changes to `.mjs` need a reload (F5). CSS, HBS and lang files hot-reload when `flags.hotReload` is set.
