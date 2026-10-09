# Symbols & Sigils — The Living Altar

A desktop-first, museum-grade WebGL experience. You build a 3D home altar, place symbols
and ritual tools, then perform guided rituals at it. **Symbols draw themselves in 3D. The
altar teaches by reacting — never by scolding.**

> Status: **Phase 3 of 7 complete** (data layer + symbol engine + state machine, event bus, Codex UI).
> See the roadmap below. Nothing is pushed or merged until the work is approved.

---

## What this is

- Build a 3D altar in one of four rooms (Home shrine, Hearth altar, Stone circle, Prayer corner).
- Place from a codex of **40 symbols** across 10 traditions, plus **13 ritual tools**.
- Placement follows recorded conventions, expressed as *aligned with convention* /
  *outside convention* — never as correct/wrong. Where traditions disagree, both views are shown.
- **Ritual Mode**: guided, restorable sequences with hints only. There is no fail screen.
- Everything is **procedural**: geometry in code, textures painted on canvases (parchment,
  wood, linen, stone), all sound synthesized with Web Audio. No external models, textures,
  or audio files. No human-authored art assets.

## Running it

The app uses ES modules and (from Phase 2) an import map pinned to a local copy of
Three.js, with **no bundler**. It therefore **requires a local static server** — opening
`index.html` directly via `file://` will not work.

```bash
# recommended — repo dev server (sends Cache-Control: no-store so the
# browser can never serve stale modules after a code change)
npm start

# any other static server works too, but clear the browser cache after
# code changes if it sends caching headers
python3 -m http.server 8000
```

Then open http://localhost:8000.

- `/index.html` — parchment data preview + in-browser dataset validation
- `/debug.html` — the symbol engine debug grid: all 40 symbols drawn live in
  one WebGL context, with per-symbol replay of their recorded stroke order
- `/altar.html` — **the workshop**: the 3D room (procedural textures, three
  lighting presets, quality tiers, bloom + vignette post pass) and the
  Altar Builder — raycast placement with live zone rules, drag/rotate/remove,
  undo/redo, sandbox summary with screenshot + JSON export — and **Ritual
  Mode**: three guided sequences with positional synthesized sound
- `/codex.html` — the Codex: browse the dataset with live symbol previews

### Ritual Mode (Phase 6)

Three guided contemplative sequences (composed for this experience, honestly
labeled — no lineage reconstruction): *Opening a Quiet Space*, *Evening
Flame*, and *Facing the Four Quarters*. There is no fail state: steps give
hints after a delay, skips are recorded as notes, and substitutes count
(a singing bowl may stand in for a bell). Tracing a placed symbol replays
its recorded stroke order under your pointer.

All sound is **synthesized** (Web Audio — the repo contains no audio files)
and **positional**: every sound plays from the item's place in the room
through a panner node, with the listener driven by the camera. The bell at
the altar is quieter from the door, as it should be.

### Post pass (Phase 7)

A small hand-rolled pipeline (no composer dependency): scene → bright-pass
→ separable blur → composite with bloom, a gentle vignette, and a faint
static grain (so gradients never band). Bloom is tier-gated (museum and
gallery); plate renders direct. Applied to the 3D pass only.

### Why there is no service worker

The spec lists it as optional, and it was consciously omitted: the dev
server deliberately sends `Cache-Control: no-store` so the browser can
never serve stale modules after a code change — an offline cache would
quietly reintroduce exactly that failure class. If you deploy a built
distribution with hashed filenames, a cache-first worker is the right tool.

### Validating the dataset (Phase 1 gate)

```bash
node data/validate.js        # or: npm run validate
```

Loads every data module, runs the schema validator, prints a pass/fail report.

## Repository layout

```
index.html              Phase 1: parchment-styled data preview + in-browser validation
data/
  schema.js             central registry, enums, full validator (incl. geometry contract)
  validate.js           CLI validation runner (node)
  symbols.js            the 40-symbol roster (aggregates data/symbols/*.js)
  symbols/
    celtic.js           7   egyptian.js 6   pagan.js 5   christian.js 4
    jewish.js           3   islamic.js  3   dharmic.js 8 (hindu 4 + buddhist 4)
    taoic-lhp.js        4   (taoist 2 + left-hand-path 2)
  tools.js              13 ritual tools with synthesized-sound cue descriptions
  zones.js              10 placement zones (coordinate contract: scene -Z = North)
  rituals.js            3 guided ritual sequences (step state-machine schema)
  sources.js            citation registry — real references only, never invented
  traditions.js         per-tradition metadata + parity context boxes
```

## Design

Candlelit study: dark timber, stone, linen, brass. UI is parchment in the DOM (never
dragged into WebGL): cream `#F8F4EA`, ink `#111`, gold foil `#C5A059` (Egyptian),
oak green `#2D4A3E` (Celtic). No red/black shock aesthetics anywhere. Gold appears on
parchment only as accent; body text is ink, sized to pass WCAG AA.

## Architecture notes

- Central event bus + state machine:
  `THRESHOLD → CODEX → PLACING → BUILDING → RITUAL → SUMMARY` (+ `SANDBOX` flag).
- One normalized symbol format, one generic renderer (Phase 2): primitives
  (`line`, `polyline`, `arc`, `cubic`, `polar`) in 0–1 space with stroke order,
  anchor, orientation and scale. Six reusable animation behaviors: single-stroke draw,
  weave/over-under, eye-with-tracking, phase math, particle loop, brush pressure.
- Codex card click emits `place:start {symbolId}`; the 3D layer then owns pointer events.
- Post-processing (bloom, vignette, grain) applies to the 3D pass only.
- Screenshots force a render before `toBlob`. WebGL context loss/restore is handled.
- Performance tiers Low/Medium/High (pixel ratio, bloom, particles, shadows, real-light
  count) with auto-downgrade from measured frame time; rendering pauses when hidden.
- Audio starts only after the first user gesture; every cue is captioned. Sacred text is
  captioned, never auto-voiced.

## Honesty policy (load-bearing)

- **No invented citations.** `sources.js` lists only references known to exist. When a
  claim can't be pinned to a real source, the *symbol* carries `confidence: "low"` /
  `openStatus: "unverified"` instead.
- **No tradition is policed harder than another.** Every tradition carries the same
  context box ("how practitioners use this" + "common concerns"), enforced by the validator.
- Rule language is *aligned with convention* / *outside convention*, never correct/wrong
  — the validator greps for it.
- Contested symbols carry `competingInterpretations` (≥2) and the dataset does not
  resolve disagreement for comfort.
- The swastika entry exists in its Dharmic context and **explicitly distinguishes it from
  the Nazi Hakenkreuz**; the inverted pentacle variant is documented with its competing
  readings; the left-hand-path category states plainly that it covers **historical and
  modern symbolic use — not endorsement, and no ritual instruction.**

## Browser support

Current Chrome, Edge, Firefox; **WebGL2 minimum**. Safari is best-effort.
Reduced motion, full keyboard placement (arrows cycle zones, Enter places, Esc cancels),
colorblind-safe feedback, captions and an ARIA live region are scheduled accessibility
requirements, not nice-to-haves.

## Build roadmap

| Phase | Deliverable | Status |
|---|---|---|
| 1 | Schema + validator + all data (40 symbols, 13 tools, 10 zones, 3 rituals, sources). No 3D. | ✅ complete |
| 2 | Symbol engine + `/debug` grid; all 40 render and animate; validation script passes. Delivered in 4 batches of 10. | ✅ complete |
| 3 | State machine (THRESHOLD→CODEX→PLACING→BUILDING→RITUAL→SUMMARY + sandbox flag), central event bus, parchment Codex UI. | ✅ complete |
| 4 | 3D room, props, lighting, atmosphere, procedural textures, quality tiers. | ✅ complete |
| 5 | Altar Builder: raycast placement, rules engine, undo/redo, sandbox, summary, screenshot. | ✅ complete |
| 6 | Ritual Mode with positional synthesized audio and step sequencing. | ✅ complete |
| 7 | Polish: post-FX, accessibility pass, error handling, optional service worker. | ✅ complete (service worker consciously omitted — see below) |

Each phase ends with a pass/fail checklist; we do not advance until it passes.

## License

All content is produced for this project. No external art, models, textures, or audio.
