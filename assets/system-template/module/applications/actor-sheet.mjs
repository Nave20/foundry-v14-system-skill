const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

const TEMPLATES = "systems/__ID__/templates/actor";

export default class __CLASS__ActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["__ID__", "actor"],
    position: { width: 600, height: 640 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      rollAbility: __CLASS__ActorSheet.#onRollAbility,
      itemCreate: __CLASS__ActorSheet.#onItemCreate,
      itemEdit: __CLASS__ActorSheet.#onItemEdit,
      itemDelete: __CLASS__ActorSheet.#onItemDelete,
      itemUse: __CLASS__ActorSheet.#onItemUse
    }
  };

  static PARTS = {
    header: { template: `${TEMPLATES}/header.hbs` },
    tabs: { template: "templates/generic/tab-navigation.hbs" },
    attributes: { template: `${TEMPLATES}/attributes.hbs`, scrollable: [""] },
    items: { template: `${TEMPLATES}/items.hbs`, scrollable: [""] },
    biography: { template: `${TEMPLATES}/biography.hbs`, scrollable: [""] }
  };

  static TABS = {
    primary: {
      tabs: [{ id: "attributes" }, { id: "items" }, { id: "biography" }],
      initial: "attributes",
      labelPrefix: "__IDU__.Sheet.Tabs"
    }
  };

  /** @inheritDoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.actor;
    context.actor = actor;
    context.system = actor.system;
    context.systemSource = actor._source.system;
    context.systemFields = actor.system.schema.fields;
    context.isCharacter = actor.type === "character";
    context.abilities = Object.entries(CONFIG.__IDU__.abilities).map(([key, label]) => ({
      key, label, value: actor.system.abilities[key].value,
      field: context.systemFields.abilities.fields[key].fields.value
    }));
    const items = actor.items.contents.sort((a, b) => a.sort - b.sort);
    context.itemGroups = ["gear", "feature"].map(type => ({
      type, label: CONFIG.Item.typeLabels[type], items: items.filter(i => i.type === type)
    }));
    return context;
  }

  /** @inheritDoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);
    if (partId in (context.tabs ?? {})) context.tab = context.tabs[partId];
    if (partId === "biography") {
      context.enrichedBiography = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
        this.actor.system.biography,
        { secrets: this.actor.isOwner, rollData: this.actor.getRollData(), relativeTo: this.actor }
      );
    }
    return context;
  }

  /* -------------------------------------------- */
  /*  Actions (this = sheet instance)             */
  /* -------------------------------------------- */

  static async #onRollAbility(event, target) {
    return this.actor.rollAbility(target.dataset.ability);
  }

  static async #onItemCreate(event, target) {
    const type = target.dataset.type;
    const name = _loc("__IDU__.Item.New", { type: _loc(CONFIG.Item.typeLabels[type]) });
    return Item.implementation.create({ name, type }, { parent: this.actor });
  }

  /** @this {__CLASS__ActorSheet} */
  static #getItem(target) {
    const id = target.closest("[data-item-id]")?.dataset.itemId;
    return this.actor.items.get(id);
  }

  static async #onItemEdit(event, target) {
    return __CLASS__ActorSheet.#getItem.call(this, target)?.sheet.render({ force: true });
  }

  static async #onItemDelete(event, target) {
    return __CLASS__ActorSheet.#getItem.call(this, target)?.deleteDialog();
  }

  static async #onItemUse(event, target) {
    return __CLASS__ActorSheet.#getItem.call(this, target)?.use();
  }
}
