"""Static sanity checks for a Foundry VTT V14 game system folder.

Usage:  python check_system.py <path-to-system-folder>

Checks (errors fail with exit code 1, warnings do not):
- system.json parses; id matches folder name; required keys; V14 compatibility
- no template.json (deprecated in V14)
- every esmodule / style / language / pack path exists; lang files are valid JSON
- documentTypes subtypes <-> CONFIG.<Doc>.dataModels keys found in the code
- HTMLField paths declared in htmlFields (best effort)
- legacy API usage (AppV1 sheets, rollMode, ACTIVE_EFFECT_MODES, game.i18n.format, "-=" keys, jQuery, ...)
- leftover template placeholders (__ID__ etc.)
- every "systems/<id>/..." path referenced in code/templates exists
"""
import json
import re
import sys
from pathlib import Path

LEGACY = [
    (r"\bActorSheet\b(?!V2)(?!\.)", "AppV1 ActorSheet: use HandlebarsApplicationMixin(ActorSheetV2)"),
    (r"\bItemSheet\b(?!V2)(?!\.)", "AppV1 ItemSheet: use HandlebarsApplicationMixin(ItemSheetV2)"),
    (r"\bActors\.registerSheet|\bItems\.registerSheet", "use foundry.applications.apps.DocumentSheetConfig.registerSheet"),
    (r"\bgetData\s*\(", "AppV1 getData(): use _prepareContext(options)"),
    (r"\bactivateListeners\s*\(", "AppV1 activateListeners(): use actions / _onRender"),
    (r"\brollMode\b", "rollMode is deprecated in V14: use messageMode"),
    (r"DICE_ROLL_MODES", "CONST.DICE_ROLL_MODES is legacy: use CONFIG.ChatMessage.modes"),
    (r"ACTIVE_EFFECT_MODES", "use string change types (CONST.ACTIVE_EFFECT_CHANGE_TYPES)"),
    (r"\.changes\b(?<!system\.changes)", "check: V14 ActiveEffect changes live in effect.system.changes"),
    (r"game\.i18n\.format\(", "game.i18n.format merged into game.i18n.localize(key, data) / _loc"),
    (r"[\"']-=|[\"']==", "'-=' / '==' update keys are deprecated: use _del / _replace()"),
    (r"\bMeasuredTemplate\b", "MeasuredTemplate was removed in V14: use Regions"),
    (r"\$\(|\bhtml\.find\(", "jQuery usage: AppV2 gives plain HTMLElements"),
    (r"renderChatMessage\b(?!HTML)", "use the renderChatMessageHTML hook"),
    (r"MESSAGE_PATTERNS", "use ChatLog.CHAT_COMMANDS"),
    (r"(?<![\w.])loadTemplates\(|(?<![\w.])renderTemplate\(", "use foundry.applications.handlebars.* (namespaced)"),
    (r"(?<![\w.])TextEditor\.enrichHTML", "use foundry.applications.ux.TextEditor.implementation.enrichHTML"),
    (r"\bdata\.data\b|\bactor\.data\.data\b", "pre-V10 data access"),
]


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    root = Path(sys.argv[1]).resolve()
    errors, warnings = [], []

    mf = root / "system.json"
    if not mf.exists():
        print(f"ERROR: {mf} not found")
        return 1
    try:
        m = json.loads(mf.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"ERROR: system.json is not valid JSON: {e}")
        return 1

    sid = m.get("id")
    for k in ("id", "title", "version"):
        if not m.get(k):
            errors.append(f"system.json: missing '{k}'")
    if sid and sid != root.name:
        errors.append(f"id '{sid}' must equal folder name '{root.name}'")
    comp = m.get("compatibility") or {}
    if not str(comp.get("minimum", "")).startswith("14") and not str(comp.get("verified", "")).startswith("14"):
        warnings.append(f"compatibility does not mention V14: {comp}")
    if (root / "template.json").exists():
        errors.append("template.json present: deprecated in V14 (use documentTypes + TypeDataModel)")
    if not m.get("esmodules") and not m.get("scripts"):
        errors.append("no esmodules/scripts declared")

    def must_exist(rel, what):
        if rel and not str(rel).startswith("http") and not (root / rel).exists():
            errors.append(f"{what} not found: {rel}")

    for p in m.get("esmodules", []) + m.get("scripts", []):
        must_exist(p, "script")
    for p in m.get("styles", []):
        must_exist(p, "style")
    for lang in m.get("languages", []):
        must_exist(lang.get("path"), "language file")
        lp = root / lang.get("path", "")
        if lp.is_file():
            try:
                json.loads(lp.read_text(encoding="utf-8"))
            except json.JSONDecodeError as e:
                errors.append(f"{lang['path']}: invalid JSON ({e})")
    for pack in m.get("packs", []):
        if not pack.get("path"):
            warnings.append(f"pack '{pack.get('name')}' has no path")
        elif not (root / pack["path"]).exists():
            warnings.append(f"pack folder not built yet: {pack['path']}")

    code_files = [p for p in root.rglob("*") if p.suffix in {".mjs", ".js"} and "node_modules" not in p.parts]
    tpl_files = [p for p in root.rglob("*") if p.suffix in {".hbs", ".html"} and "node_modules" not in p.parts]
    code = {p: p.read_text(encoding="utf-8", errors="replace") for p in code_files}
    all_code = "\n".join(code.values())

    # documentTypes <-> dataModels
    doc_types = m.get("documentTypes") or {}
    for doc in ("Actor", "Item"):
        if not doc_types.get(doc) and not (root / "template.json").exists():
            errors.append(f"documentTypes.{doc} is empty: Actor and Item need at least one system subtype in V14")
    for doc, subtypes in doc_types.items():
        for st, cfg in subtypes.items():
            pat = rf"{st}\s*:\s*[\w.]+|dataModels\.{st}\s*=|dataModels\[[\"']{st}[\"']\]"
            if f"CONFIG.{doc}.dataModels" not in all_code and doc not in ("ActiveEffect",):
                warnings.append(f"no CONFIG.{doc}.dataModels assignment found for {doc}")
                break
            if not re.search(pat, all_code):
                warnings.append(f"subtype {doc}.{st} declared but no matching dataModels entry found")
    # HTMLField declared?
    html_fields = set(re.findall(r"(\w+)\s*:\s*new\s+(?:fields\.)?HTMLField", all_code))
    declared = {f.split(".")[-1] for subs in doc_types.values() for c in subs.values() for f in (c or {}).get("htmlFields", [])}
    for f in sorted(html_fields - declared):
        warnings.append(f"HTMLField '{f}' not listed in any documentTypes htmlFields (server sanitization)")

    # legacy API
    for p, txt in code.items():
        # names bound locally from the namespaced API are fine, e.g.
        # const TextEditor = foundry.applications.ux.TextEditor.implementation;  const { renderTemplate } = foundry.applications.handlebars;
        aliases = set(re.findall(r"const\s+(\w+)\s*=\s*foundry\.", txt))
        for group in re.findall(r"const\s*\{([^}]*)\}\s*=\s*foundry\.", txt):
            aliases.update(n.split(":")[-1].strip() for n in group.split(",") if n.strip())
        for i, line in enumerate(txt.splitlines(), 1):
            s = line.strip()
            if s.startswith("//") or s.startswith("*"):
                continue
            for pat, msg in LEGACY:
                m = re.search(pat, line)
                if m:
                    if "foundry.appv1.sheets" in line and "Sheet" in msg:  # unregistering core v1 sheets is fine
                        continue
                    if re.match(r"\w+", m.group(0)) and re.match(r"\w+", m.group(0)).group(0) in aliases:
                        continue
                    warnings.append(f"{p.relative_to(root)}:{i}: {msg}")

    # placeholders and referenced paths
    for p in code_files + tpl_files + [mf]:
        txt = p.read_text(encoding="utf-8", errors="replace")
        if re.search(r"__(ID|IDU|CLASS|TITLE|AUTHOR)__", txt):
            errors.append(f"{p.relative_to(root)}: leftover template placeholder")
        # resolve simple path constants used in template literals: const X = "systems/id/..."; `${X}/a.hbs`
        for name, val in re.findall(r"const\s+(\w+)\s*=\s*[\"'`](systems/[^\"'`$]+)[\"'`]", txt):
            txt = txt.replace("${" + name + "}", val)
        if sid:
            for ref in re.findall(rf"systems/{re.escape(sid)}/([\w./-]+\.(?:hbs|html|css|json|png|webp|svg|jpg))", txt):
                if not (root / ref).exists():
                    errors.append(f"{p.relative_to(root)}: referenced file missing: systems/{sid}/{ref}")

    for w in warnings:
        print(f"WARN  {w}")
    for e in errors:
        print(f"ERROR {e}")
    print(f"\n{len(errors)} error(s), {len(warnings)} warning(s) — {root.name}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
