const { HTMLField, StringField } = foundry.data.fields;

export default class FeatureData extends foundry.abstract.TypeDataModel {
  static LOCALIZATION_PREFIXES = ["__IDU__.Item.feature"];

  static defineSchema() {
    return {
      description: new HTMLField({ required: true, blank: true }),
      source: new StringField({ required: true, blank: true, initial: "" })
    };
  }
}
