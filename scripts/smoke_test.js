/**
 * In-game smoke test for a V14 system. Run it in the browser console (F12) of a world that uses the system,
 * logged in as a GM, or evaluate it through a browser automation tool. It creates temporary documents
 * prefixed "[smoke]", exercises them, then deletes those test documents (and only them).
 * Returns a report array of {step, ok, detail}.
 */
(async () => {
  const report = [];
  const step = async (name, fn) => {
    try { const detail = await fn(); report.push({ step: name, ok: true, detail: detail ?? "" }); }
    catch (err) { report.push({ step: name, ok: false, detail: String(err?.stack ?? err).slice(0, 400) }); }
  };
  const errors = [];
  const onErr = (e) => errors.push(String(e?.message ?? e));
  window.addEventListener("error", onErr);
  const created = [];

  await step("core build", () => `${game.release.generation}.${game.release.build} / system ${game.system.id} ${game.system.version}`);
  await step("dataModels match documentTypes", () => {
    const issues = [];
    for (const [doc, types] of Object.entries(game.system.documentTypes ?? {})) {
      for (const t of Object.keys(types)) if (!CONFIG[doc]?.dataModels?.[t]) issues.push(`${doc}.${t}`);
    }
    if (issues.length) throw new Error("missing dataModels: " + issues.join(", "));
    return "ok";
  });
  for (const type of Object.keys(game.system.documentTypes?.Actor ?? {})) {
    await step(`create Actor.${type}`, async () => {
      const a = await Actor.implementation.create({ name: `[smoke] ${type}`, type });
      created.push(a);
      return JSON.stringify(a.system.toObject()).slice(0, 200);
    });
  }
  const actor = created[0];
  for (const type of Object.keys(game.system.documentTypes?.Item ?? {})) {
    await step(`create embedded Item.${type}`, async () => {
      const [i] = await actor.createEmbeddedDocuments("Item", [{ name: `[smoke] ${type}`, type }]);
      return `${i.uuid}`;
    });
  }
  await step("update actor system data", async () => {
    const path = Object.keys(foundry.utils.flattenObject(actor.system.toObject())).find(k =>
      typeof foundry.utils.getProperty(actor.system, k) === "number");
    if (!path) return "no numeric field";
    await actor.update({ [`system.${path}`]: 1 });
    return `system.${path} = ${foundry.utils.getProperty(actor.system, path)}`;
  });
  await step("getRollData + roll", async () => {
    const r = await new Roll("1d20").evaluate();
    return `rollData keys: ${Object.keys(actor.getRollData()).slice(0, 8).join(",")} · 1d20=${r.total}`;
  });
  for (const doc of [actor, ...actor.items]) {
    await step(`render sheet ${doc.documentName}.${doc.type}`, async () => {
      const sheet = doc.sheet;
      await sheet.render({ force: true });
      await new Promise(r => setTimeout(r, 300));
      const ok = sheet.rendered && sheet.element?.isConnected;
      const name = sheet.constructor.name;
      await sheet.close();
      if (!ok) throw new Error(`${name} did not render`);
      return name;
    });
  }
  await step("active effect (V14 system.changes)", async () => {
    const [e] = await actor.createEmbeddedDocuments("ActiveEffect", [{
      name: "[smoke] effect", type: "base", system: { changes: [] }
    }]);
    return e.uuid;
  });
  await step("cleanup", async () => {
    for (const d of created) await d.delete();
    const msgs = game.messages.filter(m => m.content?.includes?.("[smoke]")).map(m => m.id);
    if (msgs.length) await ChatMessage.implementation.deleteDocuments(msgs);
    return `deleted ${created.length} actor(s)`;
  });
  window.removeEventListener("error", onErr);
  if (errors.length) report.push({ step: "window errors", ok: false, detail: errors.join(" | ") });
  console.table(report);
  return report;
})();
