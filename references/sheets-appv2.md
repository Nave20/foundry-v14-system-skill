# Sheets & Applications — ApplicationV2 (V14)

Source: `client/applications/api/{application,handlebars-application,document-sheet,dialog}.mjs`,
`client/applications/sheets/{actor-sheet,item-sheet}.mjs`, `templates/generic/*.hbs`.

## Contents
1. Minimal actor sheet
2. Registering sheets
3. DEFAULT_OPTIONS
4. PARTS (Handlebars)
5. TABS
6. Context: `_prepareContext` / `_preparePartContext`
7. Actions (click handlers)
8. Forms and inputs (`formGroup`, `formInput`, prose-mirror)
9. Drag & drop, embedded items
10. `_onRender`, listeners, context menus
11. Dialogs (DialogV2) and standalone apps
12. CSS

---

## 1. Minimal actor sheet

```js
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export default class MySysActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["mysys", "actor"],
    position: { width: 620, height: 680 },
    window: { resizable: true },
    form: { submitOnChange: true },               // save on every change (DocumentSheetV2 default is false)
    actions: {
      roll: MySysActorSheet.#onRoll,
      itemCreate: MySysActorSheet.#onItemCreate,
      itemEdit: MySysActorSheet.#onItemEdit,
      itemDelete: MySysActorSheet.#onItemDelete
    }
  };

  static PARTS = {
    header: { template: "systems/mysys/templates/actor/header.hbs" },
    tabs:   { template: "templates/generic/tab-navigation.hbs" },          // core template
    stats:  { template: "systems/mysys/templates/actor/stats.hbs", scrollable: [""] },
    items:  { template: "systems/mysys/templates/actor/items.hbs", scrollable: [""] },
    bio:    { template: "systems/mysys/templates/actor/bio.hbs", scrollable: [""] }
  };

  static TABS = {
    primary: {
      tabs: [{ id: "stats", icon: "fa-solid fa-dice-d20" }, { id: "items" }, { id: "bio" }],
      initial: "stats",
      labelPrefix: "MYSYS.Sheet.Tabs"        // label = MYSYS.Sheet.Tabs.stats …
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);   // document, source, fields, editable, user, tabs…
    context.actor = this.actor;
    context.system = this.actor.system;
    context.systemFields = this.actor.system.schema.fields;
    context.items = this.actor.items.contents.sort((a, b) => a.sort - b.sort);
    context.config = CONFIG.MYSYS;
    return context;
  }

  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);
    if (partId in context.tabs) context.tab = context.tabs[partId];   // for the <section class="tab"> wrapper
    if (partId === "bio") {
      context.enrichedBio = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
        this.actor.system.biography, { secrets: this.document.isOwner, rollData: this.actor.getRollData(), relativeTo: this.actor });
    }
    return context;
  }

  /** `this` is the sheet; `target` is the element carrying data-action */
  static async #onRoll(event, target) {
    const { ability } = target.dataset;
    return this.actor.rollAbility(ability);
  }
  static async #onItemCreate(event, target) {
    const type = target.dataset.type;
    return Item.implementation.create({ name: _loc("MYSYS.NewItem"), type }, { parent: this.actor });
  }
  static #getItem(target) {
    return this.actor.items.get(target.closest("[data-item-id]")?.dataset.itemId);
  }
  static async #onItemEdit(event, target) { MySysActorSheet.#getItem.call(this, target)?.sheet.render({ force: true }); }
  static async #onItemDelete(event, target) { await MySysActorSheet.#getItem.call(this, target)?.deleteDialog(); }
}
```

## 2. Registering sheets (in `init`)

```js
const { DocumentSheetConfig } = foundry.applications.apps;
DocumentSheetConfig.unregisterSheet(Actor, "core", foundry.appv1.sheets.ActorSheet);   // optional: hide the core sheet
DocumentSheetConfig.registerSheet(Actor, "mysys", MySysActorSheet, {
  types: ["character", "npc"], makeDefault: true, label: "MYSYS.Sheet.Actor"
});
DocumentSheetConfig.unregisterSheet(Item, "core", foundry.appv1.sheets.ItemSheet);
DocumentSheetConfig.registerSheet(Item, "mysys", MySysItemSheet, { makeDefault: true, label: "MYSYS.Sheet.Item" });
```

Each sheet should list the `types` it supports. A different class per type is fine.

## 3. DEFAULT_OPTIONS (merged up the inheritance chain, so only declare what changes)

| Key | Meaning |
|---|---|
| `id` | DocumentSheetV2 default is `"{id}"`, unique per document |
| `classes` | CSS classes on the root element; add your system id |
| `tag` | `"form"` for document sheets (default); `"div"` for plain apps |
| `position` | `{width, height, top, left, scale}` (`height: "auto"` allowed) |
| `window` | `{title, icon, resizable, minimizable, frame, positioned, controls: [...]}` |
| `actions` | `{name: handler}` or `{name: {handler, buttons: [0, 2]}}` |
| `form` | `{handler, submitOnChange, closeOnSubmit}` (the document sheet handler is built in) |
| `viewPermission` / `editPermission` | ownership levels (default LIMITED / OWNER) |
| `sheetConfig`, `ownershipConfig`, `canCreate`, `canImport` | header controls |

`this.isEditable` (read-only when locked or not owned) is passed to the context as `editable`.

**Per-subtype CSS classes** (one colour per actor type, for example): override `_initializeApplicationOptions(options)`, call `super`, then ``options.classes.push(`type-${options.document.type}`)``. `options.document` is already set there, and the class lands on the application root.

## 4. PARTS (HandlebarsApplicationMixin)

`HandlebarsTemplatePart` = `{ template, id?, classes?, root?, templates?: [partials], scrollable?: [selectors], forms?: {selector: config} }`.

- Each part renders into its own element `[data-application-part="<partId>"]`. A part template must have **exactly one root element**.
- `scrollable: [""]` preserves the scroll position of the part's root across re-renders.
- `templates: [...]` lists partials used inside the part (they are preloaded). Elsewhere, preload with `foundry.applications.handlebars.loadTemplates([...])` and use `{{> "systems/mysys/templates/parts/x.hbs"}}`.
- Re-render only some parts: `this.render({ parts: ["items"] })`.
- To vary parts by type or permission, override `_configureRenderOptions(options)` and set `options.parts = [...]` (for example, a limited view shows only `header`).

## 5. TABS

`static TABS = { <group>: { tabs: [{id, icon?, label?, tooltip?, cssClass?}], initial?, labelPrefix? } }`.

- With **one** tab group, `super._prepareContext()` sets `context.tabs` (a record keyed by tab id, with `{id, group, active, cssClass, label, icon}`). With several groups, call `this._prepareTabs("groupName")` yourself.
- The core `templates/generic/tab-navigation.hbs` renders `<a data-action="tab" data-group data-tab>`; clicking switches tabs without a re-render.
- Each tab body must look like this:

```hbs
<section class="tab {{tab.cssClass}}" data-group="primary" data-tab="stats">
  …
</section>
```

`tab.cssClass` contains `active` for the current tab. The current tab is stored in `this.tabGroups.primary`. Change it with `this.changeTab("items", "primary")`.

## 6. Context

`DocumentSheetV2._prepareContext` already provides: `document`, `source` (`_source`), `fields` (document schema fields), `editable`, `user`, `rootId`, and `tabs` (single group).
Add `system`, `systemFields: document.system.schema.fields`, sorted items, CONFIG constants, and enriched HTML.
Keep `_prepareContext` free of side effects. `_preparePartContext` is the place for per-part work.

## 7. Actions

```hbs
<button type="button" data-action="roll" data-ability="str">{{localize "MYSYS.Roll"}}</button>
<a data-action="itemEdit" data-tooltip="MYSYS.Edit"><i class="fa-solid fa-pen"></i></a>
<img src="{{document.img}}" data-action="editImage" data-edit="img" alt="">   {{!-- core action, IMG only --}}
```

- A handler is a function (static private `#fn` recommended), with signature `(event, target)` and `this` = the app instance.
- Built-in actions: `editImage` (needs `data-edit="img"`), `configureSheet`, `copyUuid`, `tab`, `close`. Actor sheets add `configurePrototypeToken`, `configureToken`, `showPortraitArtwork`, `showTokenArtwork`.
- Buttons inside a `<form>` need `type="button"`, otherwise they submit the form.
- `buttons: [0, 2]` also triggers the action on right-click; middle-click (`auxclick`) support was added in V14.

## 8. Forms and inputs

With `tag: "form"` and `submitOnChange: true`, any input whose `name` is a document path saves automatically:

```hbs
{{!-- quickest: input + label + hint generated from the DataField (localized via LOCALIZATION_PREFIXES) --}}
{{formGroup systemFields.level value=system.level localize=true}}
{{formGroup systemFields.health.fields.value value=system.health.value}}
{{formInput systemFields.rarity value=system.rarity}}          {{!-- choices → <select> --}}
{{formInput fields.name value=source.name}}

{{!-- manual input --}}
<input type="number" name="system.health.max" value="{{system.health.max}}" data-dtype="Number">

{{!-- rich text (HTMLField) --}}
{{formInput systemFields.biography enriched=enrichedBio value=system.biography toggled=true}}
{{!-- or: <prose-mirror name="system.biography" value="{{system.biography}}" toggled>{{{enrichedBio}}}</prose-mirror> --}}
```

The `name` given by `formGroup` / `formInput` comes from `field.fieldPath` (for example `system.health.value`), so it matches the document automatically.
Use `source.x` (raw) rather than `system.x` (prepared) when active effects may have changed the prepared value; otherwise saving would write the modified value back.
Core Handlebars helpers: `localize`, `formGroup`, `formInput`, `formField` (alias), `selectOptions`, `radioBoxes`, `numberInput`, `rangePicker`, `filePicker`, `checked`, `disabled`, `concat`, `ifThen`, `numberFormat`, `timeSince`, `eq`, `ne`, `lt`, `gt`, `lte`, `gte`, `not`, `and`, `or`, `object`.
Register custom helpers with `Handlebars.registerHelper` in `init`.

**Editable lists in a form** (an `ArrayField` of `SchemaField` rows): name the inputs `system.<list>.<index>.<key>`, for example `system.backgrounds.0.name`. Form data expands these to `{0: {...}, 1: {...}}`, and `ArrayField._cast` turns an index-keyed plain object back into an array (`common/data/fields.mjs`). Render **every** row in the form, because the submitted array replaces the stored one. The same goes for every key of each row: a key with no input (for example a category, or a value edited by a custom widget) is lost on the next submit, so carry it in an `<input type="hidden">`. For add and remove buttons, use actions that `deepClone(this.document._source.system.<list>)`, then `push` or `splice`, then `update` the whole array.

**Custom input widgets** (clickable dots, toggles…): keep the value in an `<input type="hidden" name="system.x" data-dtype="Number">`. The click handler sets `input.value`, then calls `input.dispatchEvent(new Event("change", { bubbles: true }))`. The form's change listener (`_onChangeForm`) then submits as for any input, and `FormDataExtended` casts the value using `data-dtype`.

**Controls that must not save the sheet** (a roll-builder bar, a "use specialty" checkbox inside the sheet): every `change` event bubbles to the form, and `submitOnChange` then submits and re-renders. Listen on the widget's container and call `event.stopPropagation()`. The container is a descendant of the form, so its listener runs first. Keep transient UI state (current selection, toggles) in private instance fields and re-apply it in `_onRender`, because every submit re-renders the parts.

**Dynamic keys** (traits a GM adds at runtime): an `ObjectField` accepts form names such as `system.extra.<key>.value`. The update merges into the stored object, so keys not rendered on the sheet are kept.

**Suggestions on a text input**: a native `<datalist>` cannot be styled (Chromium draws it). Build a small menu instead: append it to `this.element`, so it inherits the sheet's CSS variables. Call `preventDefault()` on the menu's `mousedown`, so the input keeps focus and the click registers. On Escape, call `stopPropagation()`, otherwise Foundry also closes the sheet.

Fields marked `gmOnly` reject updates from non-GM users. Do not render their inputs for players (`{{#if isGM}}`), otherwise a player's form submission would include them.

Hook into submission with `_prepareSubmitData(event, form, formData, updateData)` or `_processSubmitData(event, form, submitData, options)` (V14: returns `{created, updated}`).

## 9. Drag & drop

`ActorSheetV2` already handles it:
- Elements with class `.draggable` plus `data-item-id` (or `data-effect-id`) can be dragged. `_onDragStart` sets the document's `toDragData()`.
- Dropping an Item creates it on the actor (from a compendium, it goes through `game.items.fromCompendium`), and dropping inside the same actor re-sorts it. ActiveEffect, Actor and Folder drops have their own handlers (`_onDropItem`, `_onDropActiveEffect`, `_onDropActor`, `_onDropFolder`, `_onDropDocument`).
- Override `_onDropItem(event, item)` for custom rules (for example, refuse a type), and call `super` to keep the default behaviour.

```hbs
<li class="item draggable" data-item-id="{{item.id}}"> … </li>
```

## 10. Rendering hooks and listeners

```js
async _onRender(context, options) {
  await super._onRender(context, options);       // ActorSheetV2 binds drag & drop here, so keep the super call
  // Plain DOM API. this.element = root HTMLElement. No jQuery.
  this.element.querySelectorAll("input.inline-edit").forEach(el => el.addEventListener("change", this.#onInlineEdit.bind(this)));
}
_onFirstRender(context, options) { /* one-time setup, e.g. context menus */ }
```

Context menus: `this._createContextMenu(() => entries, ".item", { hookName: "getItemContextOptions", fixed: true })`, where each entry is `{ name, icon: "fa-solid fa-trash", condition: li => bool, callback: li => {} }`. V14 lets `icon` be class names, and build 369 adds `cssClass`.

Other lifecycle methods: `_preFirstRender`, `_preRender`, `_onClose`, `_canRender`, `_onChangeForm(formConfig, event)`, `_tearDown`.
Hook emitted on render: `render<ClassName>` for each class in the chain (for example `renderActorSheetV2`), with `(app, element, context, options)`.

## 11. Dialogs and standalone apps

```js
const { DialogV2 } = foundry.applications.api;
const ok = await DialogV2.confirm({ window: { title: "MYSYS.Confirm" }, content: "<p>Sure?</p>" });
const result = await DialogV2.prompt({
  window: { title: "MYSYS.RollOptions" },
  content: `<label>Bonus <input name="bonus" type="number" value="0"></label>`,
  ok: { label: "MYSYS.Roll", callback: (event, button) => button.form.elements.bonus.valueAsNumber }
});
const choice = await DialogV2.wait({ window: { title: "…" }, content: "…",
  buttons: [{ action: "a", label: "A", default: true }, { action: "b", label: "B" }] });
```

For a standalone app, extend `HandlebarsApplicationMixin(ApplicationV2)` with `tag: "form"` and `form: { handler: MyApp.#onSubmit }`, where the handler signature is `(event, form, formData)` and `formData.object` holds the values.
V14 can pop any AppV2 out into a separate browser window (`detachWindow()`), so do not rely on the global `document`. Use `this.element.ownerDocument`.
A form app can use the core footer part: `footer: { template: "templates/generic/form-footer.hbs" }`, with `context.buttons = [{ type: "submit", icon, label }, …]`.

**GM configuration window** (world-level settings that need a real UI):
```js
game.settings.register("mysys", "traits", { scope: "world", config: false, type: Object, default: {},
  onChange: () => { for (const app of foundry.applications.instances.values()) if (app.document instanceof Actor) app.render(); } });
game.settings.registerMenu("mysys", "traitsMenu", { name: "MYSYS.Traits.Title", label: "MYSYS.Traits.Open",
  icon: "fa-solid fa-list-check", type: TraitsConfig, restricted: true });   // restricted = GM only
```
The menu shows under Game Settings → Configure Settings → the system's category. Keep stable internal keys and store only display overrides (rename, hide, add), so rolls and data paths never change.

## 11b. UI entry points outside sheets

- **Left toolbar button** (`getSceneControlButtons` hook; in V14 `controls` is a record keyed by control name):
  ```js
  Hooks.on("getSceneControlButtons", controls => {
    controls.tokens.tools.myTool = { name: "myTool", title: "MYSYS.Tool", icon: "fa-solid fa-gear",
      order: Object.keys(controls.tokens.tools).length, button: true, visible: game.user.isGM, onChange: () => openMyApp() };
  });
  ```
  **Pitfall (14.369): with no active scene, `canvas.ready` is false and `SceneControls` ignores every click in the toolbar** (`#onChangeControl` and `#onChangeTool` return early). A world with no scene therefore looks broken. Either make sure a scene exists, or add a fallback listener that only acts when `!canvas.ready`, so it never fires twice:
  ```js
  Hooks.on("renderSceneControls", (app, element) => {
    element.querySelector('button[data-tool="myTool"]')?.addEventListener("click", () => { if (!canvas.ready) openMyApp(); });
  });
  ```
- **Settings sidebar button** (always works): `Hooks.on("renderSettings", (app, element) => …)` and insert a `<button>` after `element.querySelector("section.settings h4.divider")`. Guard against duplicates, because the sidebar re-renders.

## 11c. Animated widgets in a sheet (verified in 14.369)

Gauges drawn in SVG or CSS (a resource bar, a dial, a liquid level) work well in a sheet part, with a few rules:

- **Every render rebuilds the part's DOM.** A widget created in `_onRender` starts from scratch after each `actor.update`. To animate a change, keep the value the widget displayed in a private field of the sheet (`#lastShown`), pass it to the new widget, then store the new one. Comparing the two also tells you which effect to play (gain or loss).
- **Stop animation loops when the element leaves the page.** In a `requestAnimationFrame` loop, return as soon as `!svg.isConnected` (the sheet re-rendered or closed). Otherwise every render leaves a loop running.
- **Make SVG ids unique per widget.** Gradients, filters and clip paths are found by `id` in the whole document, and two open sheets share it. Prefix every id with a module-level counter (`gauge${++count}-glow`).
- **Keep repeating CSS animations in step across renders.** Elements recreated by a render restart their animation at 0. Set a negative delay from a shared clock instead: `el.style.setProperty("--dl", `${(i * stagger - (performance.now() / 1000) % period).toFixed(3)}s`)` with `animation-delay: var(--dl)`. All instances then follow the same timeline, even after a re-render or a state change.
- **A keyframe that animates `transform` replaces any static `transform` on the element.** A `skewX(-18deg)` box loses its skew during a `scale()` or `translateY()` animation. Repeat the static part in every keyframe (`transform: skewX(-18deg) translateY(-2px)`), or put the static transform on a wrapper and animate a child.
- Respect `@media (prefers-reduced-motion: reduce)`: disable CSS animations, and draw the final state once instead of starting the loop.
- **Custom rows inside a `.form-group` inherit core flex sizes.** In a `standard-form` sheet, the core gives the children of `.form-group` flex weights (measured: the label `1 1 0%`, another child `2 1 0%`). A row "label + gauge + buttons" then squeezes the gauge to a few pixels. Override with a selector at least as specific as the core one: `.mysys .form-group.my-row > label { flex: 0 0 auto; }` and `.mysys .form-group.my-row > .gauge { flex: 1 1 auto; }`.
- To preview a widget's look before coding it in the sheet, a standalone HTML page or an inline preview is much cheaper than a test world: the same SVG and CSS run unchanged.

## 12. CSS

- **Add `"standard-form"` to `DEFAULT_OPTIONS.classes`** of your sheets. Without it, the `.form-group` elements generated by `{{formGroup}}` have no core layout (in 14.369 they compute to `display: block`, with the label stacked above the input). With it, you get the core row layout: label on the left, input on the right. This was verified in a 14.369 world, and dnd5e does the same through its base `DocumentSheet5e`.
- V14 loads package stylesheets as `@import "systems/<id>/styles/x.css" layer(system);` inside a `<style>` tag, not as `<link>` elements. Your rules live in the `system` cascade layer, so to inspect them in the console, look through `document.querySelectorAll("style")` and not `link[rel=stylesheet]`. If an edited CSS file does not show up, reload the client (F5) before debugging specificity.
- Scope everything under your root class: `.mysys.sheet .stats { … }`. Do not restyle core classes globally.
- V13+ uses CSS layers and variables: `--color-text-primary`, `--color-border`, `--font-size-14`… Core form classes: `.form-group`, `.form-fields`, `.hint`, `.standard-form`.
- V13+ ships light and dark themes (`.theme-light` / `.theme-dark` on the app element). Use variables instead of hard-coded colours.
- Sheets need a defined height or `scrollable` parts to avoid overflowing.
