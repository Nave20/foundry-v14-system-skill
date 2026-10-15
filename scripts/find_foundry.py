"""Locate the Foundry VTT installation (core source) and user-data folder on this machine.

Usage:  python find_foundry.py            → prints JSON {install, app, build, data, systems}
Override with environment variables FOUNDRY_INSTALL (folder containing resources/app or the app folder itself)
and FOUNDRY_DATA (the user-data folder that contains Data/).
"""
import json
import os
import sys
from pathlib import Path

HOME = Path.home()
INSTALL_CANDIDATES = [
    Path(os.environ.get("PROGRAMFILES", r"C:\Program Files")) / "Foundry Virtual Tabletop",
    Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "Foundry Virtual Tabletop",
    Path("/Applications/Foundry Virtual Tabletop.app/Contents/Resources"),
    Path("/opt/foundryvtt"),
    HOME / "foundryvtt",
    HOME / "FoundryVTT-Node",
]
DATA_CANDIDATES = [
    Path(os.environ.get("LOCALAPPDATA", "")) / "FoundryVTT",                 # Windows
    HOME / "Library" / "Application Support" / "FoundryVTT",                  # macOS
    HOME / ".local" / "share" / "FoundryVTT",                                 # Linux
    HOME / "foundrydata",
]


def app_dir(p: Path):
    """Return the folder that contains client/ and common/ for a candidate install path."""
    for cand in (p / "resources" / "app", p / "app", p):
        if (cand / "client").is_dir() and (cand / "common").is_dir():
            return cand
    return None


def locate() -> dict:
    env_install = os.environ.get("FOUNDRY_INSTALL")
    installs = [Path(env_install)] if env_install else INSTALL_CANDIDATES
    app = next((a for a in (app_dir(p) for p in installs if str(p)) if a), None)

    build = None
    if app and (app / "package.json").exists():
        try:
            rel = json.loads((app / "package.json").read_text(encoding="utf-8")).get("release", {})
            build = f"{rel.get('generation')}.{rel.get('build')}"
        except (OSError, ValueError):
            pass

    data = None
    env_data = os.environ.get("FOUNDRY_DATA")
    datas = [Path(env_data)] if env_data else DATA_CANDIDATES
    for d in datas:
        if str(d) and (d / "Data").is_dir():
            data = d
            opts = d / "Config" / "options.json"
            if opts.exists():
                try:
                    dp = json.loads(opts.read_text(encoding="utf-8")).get("dataPath")
                    if dp and (Path(dp) / "Data").is_dir():
                        data = Path(dp)
                except (OSError, ValueError):
                    pass
            break

    return {
        "app": str(app) if app else None,
        "build": build,
        "data": str(data) if data else None,
        "systems": str(data / "Data" / "systems") if data else None,
    }


def main() -> int:
    info = locate()
    print(json.dumps(info, indent=2))
    return 0 if info["app"] or info["data"] else 1


if __name__ == "__main__":
    sys.exit(main())
