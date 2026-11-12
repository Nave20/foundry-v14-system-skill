# Modules: 3D windows and external local services (verified in 14.369)

Lessons from a module that shows a three.js scene in an ApplicationV2 window and syncs data with a small server running
on the GM's computer. Everything below was exercised in Foundry 14.369.

## 1. A module that depends on an external service

- **Say it everywhere**: in the `title` ("… (requires a local mini-server)"), in the `description`, and in the README
  with the exact command to start the service. Ship a double-click launcher (`start-server.cmd`) for Windows users.
- **Lock cleanly when the service is missing**: never throw. Wrap every call (`fetch(url, { signal: AbortSignal.timeout(2500) })`
  inside `try/catch`), keep a state (`unknown` / `connected` / `offline`), show one permanent warning at startup
  (`ui.notifications.warn(msg, { permanent: true })`, keep the returned notification and `ui.notifications.remove(id)` when the
  service comes back), render a "locked" panel with a Retry button, and write nothing while offline. Retry quietly
  (every 15 s) so the module unlocks by itself.
- **Only the active GM talks to the service** (`game.users.activeGM?.isSelf`). Players' browsers cannot reach
  `localhost` on the GM's machine anyway. The GM copies each change into a world setting (`scope: "world"`,
  `type: Object`, `onChange` re-renders the windows): Foundry then delivers it to every client. Write the setting only
  when the data version changed.
- **CORS**: the Foundry page (`http://localhost:30000`) calling `http://127.0.0.1:<port>` is cross-origin. The service
  must answer `OPTIONS` and send `Access-Control-Allow-Origin` for local origins only; bind it to `127.0.0.1`, refuse
  other origins, validate every field, cap request sizes.
- **The browser still logs `net::ERR_CONNECTION_REFUSED`** for each failed retry. That line comes from the browser, not
  from the module; it cannot be silenced from JavaScript.

## 2. Renaming a module (id, folder)

The id is the folder name, the settings namespace and the path prefix (`modules/<id>/…`). After a rename:
enable the new id and drop the old one in `core.moduleConfiguration`, then **return to setup and relaunch the world**
(`game.shutDown()`, then `launchWorld`): packages are scanned at launch, a reload is not enough. World settings of the old
id are not carried over (re-create them, or migrate them in a `ready` hook).

## 3. A three.js scene in an ApplicationV2 window

- **Loading three.js**: `await import("https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js")` works from a
  module script (pin the version). For a module meant to run offline, vendor the file in the module instead.
- **Do not run long async work inside `_onFirstRender`**: `render()` awaits it, so the window keeps a tiny default size
  until the work ends. Start the work apart (`setTimeout(() => this.#load(), 0)`) and show a loading screen.
- **Never wait on `requestAnimationFrame` to let the UI breathe** during loading: a background or hidden tab does not fire
  it and the code stalls. Use `await new Promise(r => setTimeout(r, 30))`.
- **Render loop**: own `requestAnimationFrame` loop; stop and `renderer.dispose()` when `!this.rendered`; skip rendering
  when `this.minimized` or `document.hidden`; resize the canvas when the element size changes
  (`renderer.setSize(w, h, false)` + camera aspect).
- **Progress bars during heavy main-thread work**: animate `transform: scaleX()` with a CSS transition (composited on the
  GPU) instead of `width`, or the bar freezes while JavaScript builds the geometry. Give each step a minimum on-screen time
  (≈ 0.45 s): on a fast PC an instant boot sequence looks like a glitch.
- **HTML labels over the scene**: absolutely positioned elements inside the scene container, placed each frame with
  `vector.project(camera)`; hide those behind the camera or off-screen.

## 4. Drawing a whole city fast (hundreds of thousands of objects)

- **One geometry per layer**: merge every building into a single `BufferGeometry` (`LineSegments` for edges, one indexed
  `Mesh` for faces). Draw calls stay at a handful; 400 000 buildings run at 60 fps on an entry-level laptop GPU
  (RTX 2050). One object per building collapses at a few thousand.
- **Glowing wireframe without white-out**: additive blending (`THREE.AdditiveBlending`, `depthWrite: false`) saturates to
  white at grazing angles. Add opaque faces in the background colour (`MeshBasicMaterial`, `polygonOffset: true`,
  factor/units 1, drawn first with `renderOrder`) so hidden lines disappear, and `scene.fog` (`fog: true` on materials)
  with near/far tied to the camera distance.
- **Terrain**: when objects carry their own ground altitude and the terrain is a coarse smoothed grid, they disagree on
  slopes. Sit each object on the terrain itself (roof from the terrain at its centre, wall feet sampled under each vertex,
  slightly sunk).
- **Fine stripes in a shader moiré** when the view turns. Randomise position, width and length per stripe, layer several
  densities, and widen stripes thinner than a pixel with `fwidth()` (`extensions: { derivatives: true }` for WebGL1),
  fading their intensity in proportion.
- **Exaggeration**: scale relief and building heights separately (e.g. relief ×4, buildings ×2); a single large factor
  turns landmarks into needles.

## 5. Sharing the same data with a Claude artifact (optional)

The same Python script can also run as a local MCP server (stdio JSON-RPC: `initialize`, `tools/list`, `tools/call`)
declared in the Claude desktop app configuration; an artifact owned by the GM then calls it as `host:<name>`. The HTTP
side (Foundry) and the MCP side (artifact) read and write one JSON file with atomic writes (`tempfile` + `os.replace`).
