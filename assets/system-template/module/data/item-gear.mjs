const { HTMLField, NumberField, StringField } = foundry.data.fields;

export default class GearData extends foundry.abstract.TypeDataModel {
  static LOCALIZATION_PREFIXES = ["__IDU__.Item.gear"];

  static defineSchema() {
    return {
      description: new HTMLField({ required: true, blank: true }),
      quantity: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 1 }),
      weight: new NumberField({ required: true, nullable: false, min: 0, initial: 0 }),
      formula: new StringField({ required: true, blank: true, initial: "" })
    };
  }

  /** @inheritDoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.totalWeight = this.quantity * this.weight;
  }
}
