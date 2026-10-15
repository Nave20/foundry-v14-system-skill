import ActorBaseData from "./actor-base.mjs";

const { NumberField } = foundry.data.fields;

export default class CharacterData extends ActorBaseData {
  static LOCALIZATION_PREFIXES = [...super.LOCALIZATION_PREFIXES, "__IDU__.Actor.character"];

  static defineSchema() {
    return {
      ...super.defineSchema(),
      xp: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 })
    };
  }

  /** @inheritDoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    // Derived (not persisted): one level per 10 XP
    this.level = Math.floor(this.xp / 10) + 1;
  }
}
