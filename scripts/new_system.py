"""Scaffold a new Foundry VTT V14 game system from the bundled template.

Usage:
    python new_system.py <id> "<Title>" [--author NAME] [--dest DIR] [--force]

- <id>     lower-case identifier (letters, digits, hyphens); becomes the folder name
- --dest   parent folder (default: the Foundry user-data systems folder, if found)

Placeholders replaced in file contents and names:
    __ID__ (id) · __IDU__ (UPPER id, i18n/CONFIG namespace) · __CLASS__ (PascalCase class prefix)
    __TITLE__ (title) · __AUTHOR__ (author)
"""
import argparse
import re
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from find_foundry import locate  # noqa: E402

TEMPLATE = Path(__file__).resolve().parent.parent / "assets" / "system-template"
DEFAULT_DATA = locate()["systems"] or "."
TEXT_EXT = {".json", ".mjs", ".js", ".hbs", ".html", ".css", ".md", ".txt"}


def pascal(s: str) -> str:
    return "".join(p[:1].upper() + p[1:] for p in re.split(r"[-_\s]+", s) if p)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("id")
    ap.add_argument("title")
    ap.add_argument("--author", default="Unknown")
    ap.add_argument("--dest", default=str(DEFAULT_DATA))
    ap.add_argument("--force", action="store_true", help="overwrite an existing folder")
    a = ap.parse_args()

    if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", a.id):
        print("error: id must be lower-case letters, digits and hyphens", file=sys.stderr)
        return 2
    dest = Path(a.dest) / a.id
    if dest.exists():
        if not a.force:
            print(f"error: {dest} already exists (use --force to overwrite)", file=sys.stderr)
            return 2
        shutil.rmtree(dest)

    repl = {
        "__IDU__": re.sub(r"[^A-Z0-9]", "", a.id.upper()),
        "__ID__": a.id,
        "__CLASS__": pascal(a.id),
        "__TITLE__": a.title,
        "__AUTHOR__": a.author,
    }

    def sub(text: str) -> str:
        for k, v in repl.items():  # __IDU__ before __ID__ (dict order)
            text = text.replace(k, v)
        return text

    for src in TEMPLATE.rglob("*"):
        rel = Path(sub(str(src.relative_to(TEMPLATE))))
        out = dest / rel
        if src.is_dir():
            out.mkdir(parents=True, exist_ok=True)
            continue
        out.parent.mkdir(parents=True, exist_ok=True)
        if src.suffix in TEXT_EXT:
            out.write_text(sub(src.read_text(encoding="utf-8")), encoding="utf-8", newline="\n")
        else:
            shutil.copy2(src, out)

    print(f"Created {dest}")
    print("Next: restart Foundry (or return to Setup), create a world with this system, open the console (F12).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
