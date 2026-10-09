/**
 * data/symbols/_common.js
 * Shared factory for symbol records. Keeps the 40 entries uniform and the
 * default contract in one place (spec §3, §5).
 *
 * Phase 1 note: `geometry` is authored in Phase 2 batches against the
 * contract validated by schema.validateGeometry. The validator reports
 * null geometry as a tracked warning until then.
 */

export function symbol(def) {
  return {
    // defaults (entries override as needed)
    orientation: { default: "upright" },
    caution: null,
    contested: false,
    competingInterpretations: [],
    openStatus: "open",
    statusSource: null,
    zoneRules: {},
    confidence: "medium",
    geometry: null, // Phase 2
    animationParams: {},
    ...def,
  };
}

/** Zone-rule shorthand. verdict -> severity mapping is fixed by the schema. */
export function rule(verdict, rationale, extra = {}) {
  const severity = { allowed: "note", warned: "warn", forbidden: "block" }[verdict];
  return { verdict, severity, rationale, ...extra };
}
