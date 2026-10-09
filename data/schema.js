/**
 * data/schema.js
 * Symbols & Sigils — The Living Altar (v3)
 *
 * Central data schema, registry and validator.
 *
 * Phase 1 scope: this module defines the shape of ALL dataset records
 * (symbols, tools, zones, rituals, sources, traditions) and validates them.
 * It contains no 3D code. The geometry sub-validator exists now so Phase 2
 * can author geometry against a fixed contract.
 *
 * Language rules enforced here (spec §5):
 *  - Rule language is "aligned with convention" / "outside convention",
 *    never "correct/wrong".
 *  - Where traditions disagree, entries carry competingInterpretations;
 *    the dataset must not resolve disagreement for comfort.
 *  - No invented citations: every symbol.source[].id must resolve to a
 *    real entry in sources.js; uncertain material must carry
 *    confidence:"low" and openStatus:"unverified".
 */

import { analyzeGeometry } from "../src/engine/sampler.js";

export const SCHEMA_VERSION = "1.0.0";
export const DATA_SCHEMA_VERSION = 1;

/* ------------------------------------------------------------------ */
/* Enums & controlled vocabularies                                     */
/* ------------------------------------------------------------------ */

export const TRADITION_IDS = Object.freeze([
  "celtic",
  "egyptian",
  "wicca-pagan",
  "christian",
  "jewish",
  "islamic",
  "hindu",
  "buddhist",
  "taoist",
  "left-hand-path",
]);

export const ENUMS = Object.freeze({
  confidence: ["high", "medium", "low"],
  openStatus: ["open", "contextual", "closed", "unverified"],
  verdict: ["allowed", "warned", "forbidden"],
  severity: ["block", "warn", "note"],
  animationType: ["draw", "weave", "eye", "phase", "particles", "brush"],
  action: ["click", "trace", "ring", "pour", "wait"],
  orientationDefault: ["upright", "rotatable", "locked"],
  missingObject: ["prompt-place", "skip-with-note", "suggest-substitute"],
  heightBand: ["floor", "surface", "wall", "worn"],
  primitive: ["line", "polyline", "arc", "cubic", "polar"],
});

/* v1 content minimums (spec §5) */
export const MINIMUMS = Object.freeze({
  symbols: 40,
  tools: 12,
  zones: 9,
  rituals: 2,
});

/* Zone id contract — every zoneRule key must be one of these or a zone
 * declared in zones.js. Listed here for quick reference; the registry
 * check below is authoritative. */
export const ZONE_HEIGHT_CLASS = Object.freeze(["floor", "surface", "wall", "worn"]);

/* ------------------------------------------------------------------ */
/* Report helpers                                                      */
/* ------------------------------------------------------------------ */

function makeReport() {
  return {
    ok: true,
    errors: [],
    warnings: [],
    info: [],
    counts: {},
  };
}

function err(report, code, where, message) {
  report.errors.push(`[ERROR ${code}] ${where}: ${message}`);
  report.ok = false;
}
function warn(report, code, where, message) {
  report.warnings.push(`[warn ${code}] ${where}: ${message}`);
}
function note(report, code, where, message) {
  report.info.push(`[note ${code}] ${where}: ${message}`);
}

/* ------------------------------------------------------------------ */
/* Primitive field checks                                              */
/* ------------------------------------------------------------------ */

const isStr = (v) => typeof v === "string" && v.length > 0;
const isArr = (v) => Array.isArray(v);
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isBool = (v) => typeof v === "boolean";
const inRange = (v, lo, hi) => typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi;

function requireString(obj, field, where, report, { optional = false } = {}) {
  if (optional && (obj[field] === null || obj[field] === undefined)) return true;
  if (!isStr(obj[field])) {
    err(report, "S001", where, `field "${field}" must be a non-empty string`);
    return false;
  }
  return true;
}

function requireStringArray(obj, field, where, report, { min = 1 } = {}) {
  const v = obj[field];
  if (!isArr(v) || v.length < min || !v.every(isStr)) {
    err(report, "S002", where, `field "${field}" must be an array of ≥${min} non-empty strings`);
    return false;
  }
  return true;
}

function requireEnum(obj, field, enumName, where, report) {
  const v = obj[field];
  if (!ENUMS[enumName].includes(v)) {
    err(report, "S003", where, `field "${field}" must be one of ${ENUMS[enumName].join("|")} (got ${JSON.stringify(v)})`);
    return false;
  }
  return true;
}

function requireIdFormat(id, where, report) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
    err(report, "S004", where, `id "${id}" must be kebab-case [a-z0-9-]`);
    return false;
  }
  return true;
}

/* ------------------------------------------------------------------ */
/* Geometry sub-validator (used from Phase 2 onward)                   */
/* ------------------------------------------------------------------ */

/**
 * Geometry contract (normalized 0–1 space, Y up):
 *   {
 *     format: "altar-symbol/1",
 *     primitives: [
 *       { type: "line",     id?, x1,y1,x2,y2 },
 *       { type: "polyline", id?, points: [[x,y],...] },
 *       { type: "arc",      id?, cx,cy,r,a0,a1, ccw? },
 *       { type: "cubic",    id?, x1,y1,cx1,cy1,cx2,cy2,x2,y2 },
 *       { type: "polar",    id?, cx,cy, rFn: "expr", samples? }
 *     ],
 *     strokeOrder: [primitiveIds...]   // matches symbol.strokeOrder
 *     closed: boolean | "mixed",       // open/closed intent of the glyph
 *     symmetry: "none"|"horizontal"|"vertical"|"rotational-N",
 *     anchor: [x,y],                   // default placement anchor 0..1
 *     orientation: "upright"|"rotatable"|"locked",
 *     bounds: {minX,minY,maxX,maxY}
 *   }
 */
export function validateGeometry(geometry, where, report) {
  if (geometry === null || geometry === undefined) {
    warn(report, "G000", where, "geometry not yet authored (scheduled for Phase 2)");
    return false;
  }
  if (!isObj(geometry)) return err(report, "G001", where, "geometry must be an object"), false;
  if (geometry.format !== "altar-symbol/1")
    err(report, "G002", where, `geometry.format must be "altar-symbol/1"`);
  if (!isArr(geometry.primitives) || geometry.primitives.length === 0) {
    return err(report, "G003", where, "geometry.primitives must be a non-empty array"), false;
  }
  const ids = new Set();
  geometry.primitives.forEach((p, i) => {
    const pw = `${where}.geometry.primitives[${i}]`;
    if (!ENUMS.primitive.includes(p.type))
      return err(report, "G004", pw, `unknown primitive type "${p.type}"`);
    if (p.id !== undefined) {
      if (!isStr(p.id)) err(report, "G005", pw, "primitive id must be a string");
      else if (ids.has(p.id)) err(report, "G006", pw, `duplicate primitive id "${p.id}"`);
      ids.add(p.id);
    }
    const nums = {
      line: ["x1", "y1", "x2", "y2"],
      polyline: [],
      arc: ["cx", "cy", "r", "a0", "a1"],
      cubic: ["x1", "y1", "cx1", "cy1", "cx2", "cy2", "x2", "y2"],
      polar: ["cx", "cy"],
    }[p.type];
    for (const k of nums) {
      if (!Number.isFinite(p[k])) err(report, "G007", pw, `numeric field "${k}" missing`);
    }
    if (p.type === "polyline" && (!isArr(p.points) || p.points.length < 2))
      err(report, "G008", pw, "polyline needs ≥2 points");
    if (p.type === "polar" && !isStr(p.rFn))
      err(report, "G009", pw, "polar needs rFn expression string");
    // All coordinates must sit in normalized space with small tolerance.
    const TOL = 0.12;
    for (const [k, v] of Object.entries(p)) {
      if (["id", "type", "points", "rFn", "samples", "ccw"].includes(k)) continue;
      if (typeof v === "number" && !["a0", "a1", "r"].includes(k) && !inRange(v, -TOL, 1 + TOL))
        err(report, "G010", pw, `coordinate "${k}"=${v} outside normalized 0..1 (±${TOL})`);
      if (k === "r" && v <= 0) err(report, "G011", pw, "arc radius must be > 0");
    }
  });
  if (geometry.strokeOrder !== undefined) {
    if (!isArr(geometry.strokeOrder) || geometry.strokeOrder.some((s) => !ids.has(s)))
      err(report, "G012", where, "geometry.strokeOrder must list existing primitive ids in order");
  }
  if (![true, false, "mixed"].includes(geometry.closed))
    err(report, "G013", where, `geometry.closed must be true|false|"mixed"`);
  if (!isStr(geometry.symmetry) || !/^(none|horizontal|vertical|rotational-\d+)$/.test(geometry.symmetry))
    err(report, "G014", where, `geometry.symmetry invalid ("${geometry.symmetry}")`);
  return true;
}

/* ------------------------------------------------------------------ */
/* Zone-rule records                                                   */
/* ------------------------------------------------------------------ */

function validateZoneRule(zoneId, rule, where, report) {
  if (!isObj(rule)) return err(report, "Z001", where, `zone rule for "${zoneId}" must be an object`);
  requireEnum(rule, "verdict", "verdict", where, report);
  requireEnum(rule, "severity", "severity", where, report);
  requireString(rule, "rationale", where, report);
  // Severity/verdict coherence: forbidden blocks, warned warns, allowed notes.
  const expectedSeverity = { forbidden: "block", warned: "warn", allowed: "note" }[rule.verdict];
  if (rule.severity !== expectedSeverity)
    err(report, "Z002", where, `verdict "${rule.verdict}" must pair with severity "${expectedSeverity}"`);
  for (const opt of ["heightRule", "orientationRule", "adjacencyRule", "traditionScope", "ruleScope"]) {
    if (rule[opt] !== undefined && rule[opt] !== null && !isStr(rule[opt]))
      err(report, "Z004", where, `rule field "${opt}" must be a string when present`);
  }
  if (rule.adjacencyRule && typeof rule.adjacencyRule === "string") {
    // adjacency references use "near:<id>" / "away:<id>" tokens; ids are
    // cross-checked against the registry in validateDataset.
    for (const m of rule.adjacencyRule.matchAll(/(?:near|away):([a-z0-9-]+)/g)) {
      if (!m[1]) err(report, "Z005", where, "malformed adjacency token");
    }
  }
  if (rule.confidence !== undefined) requireEnum(rule, "confidence", "confidence", where, report);
  // Language rule: never "correct/wrong"
  const text = JSON.stringify(rule);
  if (/\b(correct|wrong|incorrect)\b/i.test(text))
    err(report, "Z006", where, `rule language must be "aligned with / outside convention", never correct/wrong`);
}

/* ------------------------------------------------------------------ */
/* Symbol records                                                      */
/* ------------------------------------------------------------------ */

export function validateSymbol(sym, ctx, report) {
  const where = `symbol "${sym && sym.id}"`;
  if (!isObj(sym)) return err(report, "Y000", where, "symbol must be an object");
  requireIdFormat(sym.id, where, report);
  if (ctx.symbolIds.has(sym.id)) err(report, "Y001", where, "duplicate symbol id");
  ctx.symbolIds.add(sym.id);

  requireString(sym, "name", where, report);
  requireStringArray(sym, "traditions", where, report);
  for (const t of sym.traditions || []) {
    if (!TRADITION_IDS.includes(t))
      err(report, "Y002", where, `unknown tradition "${t}" (allowed: ${TRADITION_IDS.join(", ")})`);
  }
  requireString(sym, "lineage", where, report);
  requireString(sym, "region", where, report);
  requireString(sym, "era", where, report);
  requireStringArray(sym, "intent", where, report);
  requireString(sym, "meaning", where, report);
  requireString(sym, "history", where, report);
  requireString(sym, "whenUsed", where, report);
  requireString(sym, "whereUsed", where, report);
  requireString(sym, "accessibilityLabel", where, report);

  if (!isObj(sym.orientation)) {
    err(report, "Y003", where, "orientation must be an object {default, notes?}");
  } else {
    requireEnum(sym.orientation, "default", "orientationDefault", where, report);
  }

  if (sym.caution !== null && sym.caution !== undefined && !isStr(sym.caution))
    err(report, "Y004", where, "caution must be a string or null");

  requireEnum(sym, "openStatus", "openStatus", where, report);
  if (sym.openStatus === "closed" && !isStr(sym.statusSource))
    err(report, "Y005", where, `openStatus "closed" requires statusSource naming the basis`);
  if (sym.openStatus === "unverified") requireString(sym, "statusSource", where, report);

  if (!isBool(sym.contested)) err(report, "Y006", where, "contested must be boolean");
  if (sym.contested && (!isArr(sym.competingInterpretations) || sym.competingInterpretations.length < 2))
    err(report, "Y007", where, "contested symbols must list ≥2 competingInterpretations");

  requireEnum(sym, "confidence", "confidence", where, report);

  // Sources: every id must resolve; unverified material must say so.
  if (!isArr(sym.sources) || sym.sources.length === 0) {
    err(report, "Y008", where, "sources must list ≥1 source reference");
  } else {
    for (const s of sym.sources) {
      if (!isObj(s) || !isStr(s.id)) err(report, "Y009", where, "source entries need an id");
      else if (!ctx.sourceIds.has(s.id))
        err(report, "Y010", where, `source "${s.id}" not found in sources.js (never invent citations)`);
      if (s && s.verified === false && sym.confidence !== "low")
        warn(report, "Y011", where, `source "${s.id}" flagged unverified but symbol confidence is ${sym.confidence}`);
    }
  }

  // Zone rules
  if (!isObj(sym.zoneRules)) {
    err(report, "Y012", where, "zoneRules must be an object keyed by zone id");
  } else {
    for (const [zoneId, rule] of Object.entries(sym.zoneRules)) {
      if (!ctx.zoneIds.has(zoneId))
        err(report, "Y013", where, `zoneRules references unknown zone "${zoneId}"`);
      else validateZoneRule(zoneId, rule, `${where}.zoneRules["${zoneId}"]`, report);
    }
  }

  // Animation contract (6 reusable behaviors, spec §3)
  requireEnum(sym, "animationType", "animationType", where, report);
  if (!isObj(sym.animationParams))
    err(report, "Y014", where, "animationParams must be an object");

  // Stroke order & replay ("remember how they were made")
  if (!isArr(sym.strokeOrder) || sym.strokeOrder.length === 0 || !sym.strokeOrder.every(isStr))
    err(report, "Y015", where, "strokeOrder must be a non-empty array of step descriptions");

  // Geometry: authored in Phase 2; null is a tracked warning, not an error.
  validateGeometry(sym.geometry, where, report);

  // Language rule across free text
  const prose = [sym.meaning, sym.history, sym.caution || ""].join(" ");
  if (/\b(correct|wrong|incorrect)\b/i.test(prose))
    err(report, "Y016", where, `prose must avoid correct/wrong framing; use "aligned with / outside convention"`);
}

/* ------------------------------------------------------------------ */
/* Tool / zone / ritual / source records                               */
/* ------------------------------------------------------------------ */

export function validateTool(tool, ctx, report) {
  const where = `tool "${tool && tool.id}"`;
  if (!isObj(tool)) return err(report, "T000", where, "tool must be an object");
  requireIdFormat(tool.id, where, report);
  requireString(tool, "name", where, report);
  requireString(tool, "category", where, report);
  requireString(tool, "description", where, report);
  requireString(tool, "whenUsed", where, report);
  requireStringArray(tool, "traditions", where, { min: 0 });
  requireString(tool, "accessibilityLabel", where, report);
  if (tool.caution !== undefined && tool.caution !== null && !isStr(tool.caution))
    err(report, "T002", where, "caution must be string or null");
  if (!isObj(tool.sound)) err(report, "T003", where, "sound must describe the synthesized cue {type, synth}");
  else {
    requireString(tool.sound, "type", where, report);
    requireString(tool.sound, "synth", where, report);
  }
  if (tool.heightClass !== undefined && !ZONE_HEIGHT_CLASS.includes(tool.heightClass))
    err(report, "T004", where, `heightClass must be one of ${ZONE_HEIGHT_CLASS.join("|")}`);
}

export function validateZone(zone, ctx, report) {
  const where = `zone "${zone && zone.id}"`;
  if (!isObj(zone)) return err(report, "Z000", where, "zone must be an object");
  requireIdFormat(zone.id, where, report);
  requireString(zone, "name", where, report);
  requireString(zone, "description", where, report);
  requireEnum(zone, "heightBand", "heightBand", where, report);
  // Coordinate contract: -Z = North. Bearings are degrees clockwise from North.
  if (!inRange(zone.compassBearing, 0, 360))
    err(report, "Z011", where, "compassBearing must be 0..360 (scene -Z = North)");
  if (zone.capacity !== undefined && (!Number.isInteger(zone.capacity) || zone.capacity < 0))
    err(report, "Z012", where, "capacity must be a non-negative integer");
}

export function validateRitual(ritual, ctx, report) {
  const where = `ritual "${ritual && ritual.id}"`;
  if (!isObj(ritual)) return err(report, "R000", where, "ritual must be an object");
  requireIdFormat(ritual.id, where, report);
  requireString(ritual, "name", where, report);
  requireString(ritual, "description", where, report);
  requireString(ritual, "disclaimer", where, report);
  if (!isArr(ritual.steps) || ritual.steps.length < 2)
    return err(report, "R001", where, "rituals need ≥2 steps");
  const stepIds = new Set();
  ritual.steps.forEach((st, i) => {
    const sw = `${where}.steps[${i}]`;
    if (!isObj(st)) return err(report, "R002", sw, "step must be an object");
    if (!isStr(st.id) || stepIds.has(st.id)) err(report, "R003", sw, `step id missing/duplicate ("${st.id}")`);
    stepIds.add(st.id);
    requireString(st, "instruction", sw, report);
    requireEnum(st, "action", "action", sw, report);
    if (!isArr(st.requiredObjects)) err(report, "R004", sw, "requiredObjects must be an array (may be empty)");
    else
      for (const o of st.requiredObjects) {
        if (!ctx.toolIds.has(o) && !ctx.symbolIds.has(o))
          err(report, "R005", sw, `requiredObjects references unknown tool/symbol "${o}"`);
      }
    if (st.action === "trace" && !inRange(st.tolerance, 0, 1))
      err(report, "R006", sw, `trace steps need a stated tolerance in 0..1`);
    if (!isObj(st.hint) || !isStr(st.hint.text) || !Number.isFinite(st.hint.afterSec))
      err(report, "R007", sw, "step.hint must be {text, afterSec}");
    if (!isBool(st.skipAllowed)) err(report, "R008", sw, "skipAllowed must be boolean");
    if (!ENUMS.missingObject.includes(st.missingObject))
      err(report, "R009", sw, `missingObject must be one of ${ENUMS.missingObject.join("|")}`);
    if (st.stateChanges !== undefined && !isArr(st.stateChanges))
      err(report, "R010", sw, "stateChanges must be an array");
  });
}

export function validateSource(src, ctx, report) {
  const where = `source "${src && src.id}"`;
  if (!isObj(src)) return err(report, "C000", where, "source must be an object");
  requireIdFormat(src.id, where, report);
  requireString(src, "title", where, report);
  requireString(src, "author", where, report);
  requireString(src, "type", where, report);
  if (!isBool(src.exists)) err(report, "C002", where, `"exists" must be boolean — never invent citations`);
  if (src.exists === false)
    err(report, "C003", where, `source marked as not known to exist — remove or replace with a real reference`);
  if (src.year !== undefined && src.year !== null && !Number.isFinite(src.year))
    err(report, "C004", where, "year must be numeric");
}

/* ------------------------------------------------------------------ */
/* Dataset-level validation                                            */
/* ------------------------------------------------------------------ */

/**
 * @param {object} data { symbols[], tools[], zones[], rituals[], sources[], traditions{} }
 * @returns report { ok, errors[], warnings[], info[], counts{} }
 */
export function validateDataset(data) {
  const report = makeReport();
  const ctx = {
    symbolIds: new Set(),
    toolIds: new Set(),
    zoneIds: new Set(),
    sourceIds: new Set(),
    traditionIds: new Set(),
  };

  const { symbols = [], tools = [], zones = [], rituals = [], sources = [], traditions = {} } = data || {};

  // Pass 0 — build registries so cross-references resolve, and detect
  // duplicate ids once here (not inside the per-item validators).
  const buildRegistry = (list, key, code, label) => {
    const seen = new Set();
    for (const item of list) {
      if (!isObj(item) || !isStr(item.id)) continue;
      if (seen.has(item.id)) err(report, code, `${label} "${item.id}"`, `duplicate ${label} id`);
      seen.add(item.id);
    }
    ctx[key] = seen;
  };
  buildRegistry(zones, "zoneIds", "Z010", "zone");
  buildRegistry(sources, "sourceIds", "C001", "source");
  buildRegistry(tools, "toolIds", "T001", "tool");

  // Sources
  for (const s of sources) validateSource(s, ctx, report);

  // Zones
  for (const z of zones) validateZone(z, ctx, report);

  // Tools
  for (const t of tools) validateTool(t, ctx, report);

  // Symbols
  for (const sym of symbols) {
    validateSymbol(sym, ctx, report);
    (sym.traditions || []).forEach((t) => ctx.traditionIds.add(t));
  }

  // Geometry analysis (Phase 2 onward): bounds, closed/open intent and the
  // declared symmetry are re-computed from sampled points and compared.
  for (const sym of symbols) {
    if (!isObj(sym) || !sym.geometry) continue;
    const { issues } = analyzeGeometry(sym.geometry);
    for (const issue of issues) err(report, "G100", `symbol "${sym.id}"`, issue);
  }

  // Adjacency cross-check: "near:<id>" / "away:<id>" must name known tools or symbols.
  for (const sym of symbols) {
    if (!isObj(sym) || !isObj(sym.zoneRules)) continue;
    for (const [zoneId, rule] of Object.entries(sym.zoneRules)) {
      if (!isObj(rule) || !isStr(rule.adjacencyRule)) continue;
      for (const m of rule.adjacencyRule.matchAll(/(?:near|away):([a-z0-9-]+)/g)) {
        const ref = m[1];
        if (!ctx.toolIds.has(ref) && !ctx.symbolIds.has(ref))
          err(report, "Y017", `symbol "${sym.id}".zoneRules["${zoneId}"]`, `adjacency references unknown id "${ref}"`);
      }
    }
  }

  // Rituals
  for (const r of rituals) validateRitual(r, ctx, report);

  // Traditions: every tradition in use needs a context box (parity rule —
  // no tradition policed harder than another, spec §5).
  for (const t of ctx.traditionIds) {
    const meta = traditions[t];
    if (!meta) {
      err(report, "TR01", `tradition "${t}"`, "missing traditions.js entry");
      continue;
    }
    if (!isObj(meta.contextBox) || !isStr(meta.contextBox.howUsed) || !isStr(meta.contextBox.commonConcerns))
      err(report, "TR02", `tradition "${t}"`, "contextBox must include howUsed and commonConcerns");
  }

  // Honesty spot-checks (spec §4/§5)
  const sw = symbols.find((s) => s.id === "swastika");
  if (sw) {
    if (!sw.contested || !(sw.competingInterpretations || []).length >= 2)
      err(report, "H001", `symbol "swastika"`, "must be contested with competing interpretations");
    if (!isStr(sw.caution) || !/nazi|hakenkreuz/i.test(sw.caution))
      err(report, "H002", `symbol "swastika"`, "caution must explicitly distinguish it from the Nazi Hakenkreuz");
  } else {
    err(report, "H000", "dataset", "required symbol 'swastika' missing from v1 roster");
  }
  const pentacle = symbols.find((s) => s.id === "pentacle");
  if (pentacle) {
    const text = JSON.stringify(pentacle.competingInterpretations || []) + (pentacle.caution || "");
    if (!/invert/i.test(text))
      err(report, "H003", `symbol "pentacle"`, "must document the inverted variant and its competing readings");
  }
  const lhp = traditions["left-hand-path"];
  if (lhp && !/historical|modern symbolic use/i.test(lhp.scope || "") )
    err(report, "H004", `tradition "left-hand-path"`, "must state scope: historical & modern symbolic use, not endorsement or ritual instruction");

  // Counts
  report.counts = {
    symbols: symbols.length,
    tools: tools.length,
    zones: zones.length,
    rituals: rituals.length,
    sources: sources.length,
    traditions: ctx.traditionIds.size,
  };
  if (symbols.length < MINIMUMS.symbols)
    err(report, "N001", "dataset", `need ≥${MINIMUMS.symbols} symbols, found ${symbols.length}`);
  if (tools.length < MINIMUMS.tools)
    err(report, "N002", "dataset", `need ≥${MINIMUMS.tools} tools, found ${tools.length}`);
  if (zones.length < MINIMUMS.zones)
    err(report, "N003", "dataset", `need ≥${MINIMUMS.zones} zones, found ${zones.length}`);
  if (rituals.length < MINIMUMS.rituals)
    err(report, "N004", "dataset", `need ≥${MINIMUMS.rituals} rituals, found ${rituals.length}`);

  // Roster audit
  const byTradition = {};
  for (const s of symbols)
    (s.traditions || []).forEach((t) => (byTradition[t] = (byTradition[t] || 0) + 1));
  note(report, "N100", "roster", JSON.stringify(byTradition));

  return report;
}

/* ------------------------------------------------------------------ */
/* Central registry (single entry point for the app)                   */
/* ------------------------------------------------------------------ */

const registry = {
  symbols: [],
  tools: [],
  zones: [],
  rituals: [],
  sources: [],
  traditions: {},
  loaded: false,
};

export function registerDataset(partial) {
  Object.assign(registry, partial);
  return registry;
}

export function getRegistry() {
  return registry;
}

/**
 * Load + validate everything. Used by the CLI validator, the index.html
 * data browser, and (later) the app boot sequence.
 */
export async function loadAndValidate(base = "./") {
  const [symbolsMod, toolsMod, zonesMod, ritualsMod, sourcesMod, traditionsMod] = await Promise.all([
    import(`${base}symbols.js`),
    import(`${base}tools.js`),
    import(`${base}zones.js`),
    import(`${base}rituals.js`),
    import(`${base}sources.js`),
    import(`${base}traditions.js`),
  ]);
  const data = {
    symbols: symbolsMod.SYMBOLS,
    tools: toolsMod.TOOLS,
    zones: zonesMod.ZONES,
    rituals: ritualsMod.RITUALS,
    sources: sourcesMod.SOURCES,
    traditions: traditionsMod.TRADITIONS,
  };
  registerDataset(data);
  registry.loaded = true;
  return validateDataset(data);
}
