export default class __CLASS__Actor extends Actor {
  /** @inheritDoc */
  getRollData() {
    const data = { ...super.getRollData() };
    // Shortcuts: @str, @agi, @mind
    for (const [key, ability] of Object.entries(this.system.abilities ?? {})) data[key] = ability.value;
    return data;
  }

  /** @inheritDoc */
  async _preCreate(data, options, user) {
    if ((await super._preCreate(data, options, user)) === false) return false;
    if (this.type === "character") this.updateSource({ prototypeToken: { actorLink: true } });
  }

  /**
   * Roll an ability check and post it to chat.
   * @param {string} key                    Ability key (str, agi, mind)
   * @param {object} [options]
   * @param {string} [options.messageMode]  V14 message mode; defaults to the user's current mode
   * @returns {Promise<Roll>}
   */
  async rollAbility(key, { messageMode } = {}) {
    const label = _loc(CONFIG.__IDU__.abilities[key]);
    const roll = new Roll(`1d20 + @${key}`, this.getRollData());
    await roll.toMessage({
      speaker: ChatMessage.implementation.getSpeaker({ actor: this }),
      flavor: _loc("__IDU__.Roll.Ability", { ability: label })
    }, { messageMode });
    return roll;
  }

  /**
   * Apply damage to health.
   * @param {number} amount
   */
  async applyDamage(amount) {
    const value = Math.max(0, this.system.health.value - Math.max(0, amount));
    return this.update({ "system.health.value": value });
  }
}
