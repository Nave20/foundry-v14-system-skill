# Dice, Chat & Combat — V14

Source: `client/dice/roll.mjs`, `client/documents/chat-message.mjs`, `client/config.mjs` (`ChatMessage.modes`), `client/documents/combat.mjs`.

## Rolling

```js
const roll = new Roll("1d20 + @abilities.str.mod + @prof", actor.getRollData(), { flavor: "Strength" });
await roll.evaluate();                 // async (needed for interactive / manual dice fulfillment)
roll.total; roll.dice; roll.terms; roll.result;
roll.evaluateSync({ strict: false });  // only for deterministic formulas (no dice), e.g. computing a modifier
Roll.validate("2d6+3");                // is the formula syntactically valid?

await roll.toMessage({
  speaker: ChatMessage.implementation.getSpeaker({ actor }),
  flavor: _loc("MYSYS.Roll.Attack", { name: item.name })   // V14: localize also formats
}, { messageMode: "public" });         // omit it to use the user's current mode (setting core.messageMode)
```

- **Message modes (V14)** replace roll modes: `CONFIG.ChatMessage.modes` = `public`, `gm` (private to GMs), `blind`, `self`, `ic` (in-character). The current choice is in `game.settings.get("core", "messageMode")`. Passing `rollMode` still works but prints a deprecation warning (until V16), and `CONST.DICE_ROLL_MODES` is legacy.
- Roll data: `@path` resolves against the object passed as `data`. Return useful shortcuts from `Actor#getRollData()`.
- Formula syntax: `4d6kh3` (keep highest 3), `1d20x` (exploding), `2d20kl` (keep lowest), `1d10r1` (reroll 1s), `5d10cs>=8` (count successes ≥ 8), `{1d20, 10}kh` (pool), `1d6[fire]` (flavor), `@lvl` data, math functions `floor()`, `ceil()`, `max()`. V14 evaluates booleans in formulas as 0/1.
- Custom Roll class: `class MyRoll extends Roll { static CHAT_TEMPLATE = "systems/mysys/templates/chat/roll.hbs"; }`, then `CONFIG.Dice.rolls.push(MyRoll)` so it can be rebuilt from chat messages.
- Custom die: extend `foundry.dice.terms.Die`, set `static DENOMINATION = "s"`, and register `CONFIG.Dice.terms.s = MyDie`.

## Custom result card (dice pools, success counting)

Verified in 14.369. To show your own card (for example "3 successes" instead of the dice total) while keeping a real `Roll` on the message, so that 3D dice modules and re-rendering still work:

```js
const roll = await new Roll(`${pool}d10`).evaluate();
const results = roll.dice[0].results.map(r => r.result);
const content = await foundry.applications.handlebars.renderTemplate("systems/mysys/templates/chat/pool.hbs", { results, successes });
await roll.toMessage({ speaker: ChatMessage.implementation.getSpeaker({ actor }), content, flags: { mysys: { successes } } });
```

- `ChatMessage#renderHTML` keeps your `content` **only if it contains HTML elements**. Plain text, or a number such as the default total, is replaced by the standard roll template (`#renderRollContent` in `client/documents/chat-message.mjs`). Wrap the card in a `<div>`.
- When the viewer may not see the content (private or blind roll), Foundry still shows the standard "rolled privately" roll render.
- Put the computed outcome in `flags` too, so later code (a damage button, an opposed roll) can read it without parsing HTML.
- The chat log draws message bodies on a light parchment background, even with the dark interface. Pick colours that read on it, not the sheet's dark palette.
- Keep house rules (difficulty, what a 10 or a 1 does, critical thresholds…) in a world `Object` setting with defaults merged at read time (`{ ...DEFAULTS, ...game.settings.get(...) }`), and give the GM a `registerMenu` window to edit them. Pure functions such as `countSuccesses(results, rules)` can then be checked in the console with known dice.

## Example: an "ability check" method on the Actor

```js
async rollAbility(key, { messageMode } = {}) {
  const ability = this.system.abilities[key];
  const label = _loc(CONFIG.MYSYS.abilities[key]);
  const roll = new Roll("1d20 + @mod", { mod: ability.mod });
  await roll.toMessage({
    speaker: ChatMessage.implementation.getSpeaker({ actor: this }),
    flavor: _loc("MYSYS.Roll.AbilityCheck", { ability: label })
  }, { messageMode });
  return roll;
}
```

## Chat messages without a roll

```js
const content = await foundry.applications.handlebars.renderTemplate("systems/mysys/templates/chat/item-card.hbs", { item, actor });
await ChatMessage.implementation.create(ChatMessage.applyMode({
  author: game.user.id,                 // V12+: `author`, not `user`
  speaker: ChatMessage.implementation.getSpeaker({ actor }),
  content,
  rolls: [],                            // you may attach evaluated rolls
  flags: { mysys: { itemUuid: item.uuid } }
}, game.settings.get("core", "messageMode")));
```

- `ChatMessage.applyMode(data, mode)` sets `whisper` and `blind`. `ChatMessage.getWhisperRecipients("GM")` returns the GM users.
- The `style` field uses `CONST.CHAT_MESSAGE_STYLES` (`OTHER`, `OOC`, `IC`, `EMOTE`).
- Interactive chat cards: listen in `Hooks.on("renderChatMessageHTML", (message, html, context) => {...})`. `html` is an **HTMLElement** (the jQuery `renderChatMessage` hook is deprecated). Attach click listeners to `[data-action]` inside it, and re-check permissions (`message.isOwner`, `game.user.isGM`) in the handler.
- A system can define ChatMessage subtypes (a data model plus `documentTypes.ChatMessage`) and override `renderHTML` for fully custom cards.
- Chat commands: `ChatLog.CHAT_COMMANDS` (V14) replaces `ChatLog.MESSAGE_PATTERNS`.

## Combat & initiative

```js
CONFIG.Combat.initiative = { formula: "1d20 + @abilities.dex.mod", decimals: 2 };  // or "initiative" in system.json
```

- Override `Combatant#getInitiativeRoll(formula)` or `Combatant#_getInitiativeFormula()` (check the signature in `client/documents/combatant.mjs`) for per-actor formulas.
- `actor.rollInitiative({ createCombatants: true, rerollInitiative: false, initiativeOptions: { messageMode } })`.
- Turn order: override `Combat#_sortCombatants(a, b)`. In V14 it decides the actual order, not just the display.
- Combat hooks: `combatStart`, `combatTurn`, `combatRound`, `combatTurnChange`, `updateCombat`. V14 added `Combat#name`, and the ActiveEffect registry reacts to turn and round events (expiry).
- Token bars: `CONFIG.Actor.trackableAttributes` (see `documents.md`). Resources with value 0 now display in the tracker (14.364 fix).
