export default class __CLASS__Item extends Item {
  /** @inheritDoc */
  getRollData() {
    const data = { ...super.getRollData() };
    if (this.actor) data.actor = this.actor.getRollData();
    return data;
  }

  /**
   * Use the item: roll its formula if it has one, otherwise post its description.
   * @param {object} [options]
   * @param {string} [options.messageMode]
   */
  async use({ messageMode } = {}) {
    const speaker = ChatMessage.implementation.getSpeaker({ actor: this.actor });
    const formula = this.system.formula;
    if (formula && Roll.validate(formula)) {
      const roll = new Roll(formula, this.getRollData());
      return roll.toMessage({ speaker, flavor: this.name }, { messageMode });
    }
    const content = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      `<h3>${this.name}</h3>${this.system.description ?? ""}`, { relativeTo: this, rollData: this.getRollData() }
    );
    const data = { author: game.user.id, speaker, content };
    return ChatMessage.implementation.create(
      ChatMessage.applyMode(data, messageMode ?? game.settings.get("core", "messageMode"))
    );
  }
}
