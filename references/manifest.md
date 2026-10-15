# system.json — V14 system manifest

Source of truth: `common/packages/base-system.mjs`, `base-package.mjs`, `_types.mjs`.

## Minimal complete example

```json
{
  "id": "mysys",
  "type": "system",
  "title": "My System",
  "description": "<p>Short HTML description shown on the setup screen.</p>",
  "version": "0.1.0",
  "compatibility": { "minimum": "14", "verified": "14.369" },
  "authors": [{ "name": "Author Name", "discord": "handle" }],
  "esmodules": ["mysys.mjs"],
  "styles": ["styles/mysys.css"],
  "languages": [
    { "lang": "en", "name": "English", "path": "lang/en.json" },
    { "lang": "fr", "name": "Français", "path": "lang/fr.json" }
  ],
  "documentTypes": {
    "Actor": {
      "character": { "htmlFields": ["biography"] },
      "npc": { "htmlFields": ["biography"] }
    },
    "Item": {
      "weapon": { "htmlFields": ["description"] },
      "skill": { "htmlFields": ["description"] }
    }
  },
  "packs": [
    { "name": "weapons", "label": "Weapons", "path": "packs/weapons", "type": "Item", "system": "mysys" }
  ],
  "packFolders": [{ "name": "My System", "sorting": "a", "color": "#4b2e83", "packs": ["weapons"] }],
  "initiative": "1d20 + @abilities.dex.mod",
  "grid": { "distance": 5, "units": "ft" },
  "primaryTokenAttribute": "health",
  "secondaryTokenAttribute": "power",
  "socket": false,
  "flags": { "hotReload": { "extensions": ["css", "hbs", "json"], "paths": ["styles", "templates", "lang"] } },
  "url": "https://github.com/me/mysys",
  "manifest": "https://github.com/me/mysys/releases/latest/download/system.json",
  "download": "https://github.com/me/mysys/releases/download/v0.1.0/mysys.zip"
}
```

## Field notes

- **id**: `BasePackage.validateId` allows only `/^[A-Za-z0-9-_]+$/`, so hyphens **and underscores** are fine. Use lower case by convention. The id **must equal the folder name** in `Data/systems/`.
- **type**: `"system"` (added in V14, optional but recommended; it prevents installing the package as the wrong type).
- **compatibility**: these are strings in V14. `minimum` is a generation (`"14"`) or a build (`"14.369"`). `verified` is the build you actually tested. Add `maximum` only to block future versions.
- **esmodules**: the entry point(s). Prefer a single `.mjs` file that imports the rest. Paths are relative to the system root.
- **documentTypes**: declares every subtype to the server. A subtype missing here is **invalid**, and documents of that type are flagged as broken. Each subtype accepts `ServerSanitizationFields`, with paths relative to `system`:
  - `htmlFields: ["biography", "details.notes"]`: server-side HTML sanitization. Declare **every** `HTMLField`.
  - `filePathFields: { "crest": ["IMAGE"] }`: extracts base64 data into real files (categories come from `CONST.FILE_CATEGORIES`).
  - `gmOnlyFields: ["secret"]`: only a GM may update these.
  - An empty object `{}` is valid.
  - Systems can also add subtypes to `ActiveEffect`, `ChatMessage`, `JournalEntryPage`, `Combat`, `Combatant`, `Card`, `Cards`, `RegionBehavior` and others.
- **template.json is deprecated in V14.** Do not create one. Every subtype gets its schema from a `TypeDataModel` registered in `CONFIG.<Doc>.dataModels`. A subtype with no data model at all is allowed but has no system data.
- **initiative**: the default formula for `Combatant` initiative. `@` paths resolve against `actor.getRollData()`.
- **primary/secondaryTokenAttribute**: a path (relative to `system`) to an object with `value` and `max`. It becomes the default bar of new prototype tokens.
- **grid**: default scene grid `{type, distance, units, diagonals}`. `type` and `diagonals` come from `CONST.GRID_TYPES` and `CONST.GRID_DIAGONALS`.
- **packs**: in V11+ each pack is a LevelDB **folder** at `path`. `type` is the Document name (`Actor`, `Item`, `JournalEntry`, `RollTable`, `Macro`, `Scene`, `Adventure`, `Cards`, `Playlist`, and since V14 `ActiveEffect`). Edit pack content in-game (unlock the pack), or build it from JSON/YAML with the `@foundryvtt/foundryvtt-cli` (`fvtt package pack`).
- **languages**: `lang` is a BCP-47 code. Several files can share the same `lang`. Foundry loads a package's strings only for the client's current language (plus English as fallback). A single-language system, for example French only, can map the same file to both codes (`{"lang": "fr", "path": "lang/fr.json"}` and `{"lang": "en", "path": "lang/fr.json"}`) so its labels show even when the core UI is in English. This was verified in 14.369.
- **relationships**: `{ "requires": [{ "id": "lib-x", "type": "module", "compatibility": {...} }], "recommends": [...] }`.
- **socket: true** reserves the `system.<id>` socket channel (`game.socket.emit("system.mysys", data)`).
- **flags.hotReload**: in dev mode, edits to CSS, HBS and JSON apply live without a reload.
- Unknown top-level keys produce warnings. Put custom data under `flags`.

## Folder layout (recommended)

```
Data/systems/mysys/
├── system.json
├── mysys.mjs                 ← entry: imports + Hooks.once("init")
├── module/
│   ├── config.mjs            ← SYSTEM constants (abilities, damage types…)
│   ├── data/                 ← TypeDataModels (actor-*.mjs, item-*.mjs, _module.mjs)
│   ├── documents/            ← Actor / Item / ActiveEffect subclasses
│   ├── applications/         ← AppV2 sheets & dialogs
│   └── helpers/              ← dice, chat, utils
├── templates/                ← .hbs (actor/, item/, chat/, parts/)
├── styles/mysys.css
├── lang/en.json, fr.json
├── packs/                    ← LevelDB folders (generated)
└── assets/                   ← icons, images
```
