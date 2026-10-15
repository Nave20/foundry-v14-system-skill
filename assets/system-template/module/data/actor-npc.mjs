import ActorBaseData from "./actor-base.mjs";

const { NumberField } = foundry.data.fields;

export default class NpcData extends ActorBaseData {
  static LOCALIZATION_PREFIXES = [...super.LOCALIZATION_PREFIXES, "__IDU__.Actor.npc"];

  static defineSchema() {
    return {
      ...super.defineSchema(),
      threat: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 1 })
    };
  }
}
