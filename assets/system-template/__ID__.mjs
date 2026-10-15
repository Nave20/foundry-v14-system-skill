/**
 * __TITLE__ — Foundry VTT V14 game system entry point.
 */
import { __IDU__ } from "./module/config.mjs";
import * as dataModels from "./module/data/_module.mjs";
import __CLASS__Actor from "./module/documents/actor.mjs";
import __CLASS__Item from "./module/documents/item.mjs";
import __CLASS__ActorSheet from "./module/applications/actor-sheet.mjs";
import __CLASS__ItemSheet from "./module/applications/item-sheet.mjs";

Hooks.once("init", () => {
  console.log("__ID__ | Initializing __TITLE__");

  // Expose the system API for macros and other packages
  game.system.api = { dataModels, documents: { __CLASS__Actor, __CLASS__Item } };
  CONFIG.__IDU__ = __IDU__;

  // Documents
  CONFIG.Actor.documentClass = __CLASS__Actor;
  CONFIG.Item.documentClass = __CLASS__Item;

  // Data models: keys must match system.json → documentTypes
  CONFIG.Actor.dataModels = {
    character: dataModels.CharacterData,
    npc: dataModels.NpcData
  };
  CONFIG.Item.dataModels = {
    gear: dataModels.GearData,
    feature: dataModels.FeatureData
  };

  // Token bars and initiative
  CONFIG.Actor.trackableAttributes = {
    character: { bar: ["health"], value: [] },
    npc: { bar: ["health"], value: [] }
  };
  CONFIG.Combat.initiative = { formula: "1d20 + @abilities.agi.value", decimals: 2 };

  // Sheets (ApplicationV2)
  const { DocumentSheetConfig } = foundry.applications.apps;
  DocumentSheetConfig.unregisterSheet(Actor, "core", foundry.appv1.sheets.ActorSheet);
  DocumentSheetConfig.registerSheet(Actor, "__ID__", __CLASS__ActorSheet, {
    types: ["character", "npc"], makeDefault: true, label: "__IDU__.Sheet.Actor"
  });
  DocumentSheetConfig.unregisterSheet(Item, "core", foundry.appv1.sheets.ItemSheet);
  DocumentSheetConfig.registerSheet(Item, "__ID__", __CLASS__ItemSheet, {
    types: ["gear", "feature"], makeDefault: true, label: "__IDU__.Sheet.Item"
  });
});
