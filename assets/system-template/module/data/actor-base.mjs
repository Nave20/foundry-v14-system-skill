const { HTMLField, NumberField, SchemaField } = foundry.data.fields;

/**
 * Fields and logic shared by every Actor subtype.
 */
export default class ActorBaseData extends foundry.abstract.TypeDataModel {
  static LOCALIZATION_PREFIXES = ["__IDU__.Actor.base"];

  static defineSchema() {
    const ability = () => new SchemaField({
      value: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 1 })
    });
    return {
      health: new SchemaField({
        value: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 10 }),
        max: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 10 })
      }),
      abilities: new SchemaField({
        str: ability(),
        agi: ability(),
        mind: ability()
      }),
      biography: new HTMLField({ required: true, blank: true })
    };
  }

  /** @inheritDoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.health.value = Math.clamp(this.health.value, 0, this.health.max);
  }
}
