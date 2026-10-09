/**
 * src/engine/placement.js — the placement rules engine (Phase 5).
 *
 * Pure logic: given an item (symbol or tool) and a zone, return the
 * recorded verdict — or the default policy (absence of record is never a
 * prohibition). The UI speaks the verdict's own language: "aligned with
 * convention" / "with care" / "outside convention". Nothing here is
 * correct/wrong language; nothing here scolds.
 *
 * Zone rules come from the symbol data (zoneRules), tools carry structural
 * rules (tools rest on surfaces; rugs belong on the floor; textiles near
 * the hearth get the heat caution the zone itself documents).
 */

import { ZONES, DEFAULT_ZONE_RULE } from "../../data/zones.js";

export const ZONES_BY_ID = Object.fromEntries(ZONES.map((z) => [z.id, z]));

/** Zones whose heightBand is a placeable surface for tools. */
const SURFACE_ZONES = Object.freeze(
  ZONES.filter((z) => z.heightBand === "surface").map((z) => z.id),
);
const FLOOR_ZONES = Object.freeze(ZONES.filter((z) => z.heightBand === "floor").map((z) => z.id));

/** Generic verdict chips, in the spec's convention language. */
export const VERDICT_COPY = Object.freeze({
  allowed: "aligned with convention",
  warned: "place with care",
  forbidden: "outside convention here",
});

/**
 * Structural (non-symbol) rules: tools.
 * @returns {{verdict:"allowed"|"warned"|"forbidden", severity:string, rationale:string}|null}
 */
function toolRule(tool, zoneId) {
  const zone = ZONES_BY_ID[zoneId];
  if (!zone) return null;
  if (tool.heightClass === "floor") {
    if (FLOOR_ZONES.includes(zoneId)) {
      return {
        verdict: "allowed",
        severity: "note",
        rationale: `${tool.name} belongs at ground level; ${zone.name} is that space.`,
      };
    }
    return {
      verdict: "forbidden",
      severity: "block",
      rationale: `${tool.name} is used at floor level — ${zone.name} is not its place.`,
    };
  }
  // surface tool
  if (SURFACE_ZONES.includes(zoneId)) {
    if (tool.category === "textile" && zoneId === "hearth") {
      return {
        verdict: "warned",
        severity: "warn",
        rationale:
          "The hearth's own note: flame lives here, and cloth or paper beside it earns a heat caution. Mind the distance.",
      };
    }
    if (tool.category === "flame" && zoneId === "hearth") {
      return {
        verdict: "allowed",
        severity: "note",
        rationale: "Flame is at home at the hearth — the oldest home altar.",
      };
    }
    return {
      verdict: "allowed",
      severity: "note",
      rationale: `${tool.name} rests on ${zone.name}. No recorded restriction.`,
    };
  }
  return {
    verdict: "forbidden",
    severity: "block",
    rationale: `Tools rest on surfaces — ${zone.name} is a place for signs, not standing tools.`,
  };
}

/**
 * Evaluate a placement.
 * @param {{kind:"symbol"|"tool", data:object}} item
 * @param {string} zoneId
 * @returns {{zoneId:string, zoneName:string, verdict:"allowed"|"warned"|"forbidden",
 *            severity:string, rationale:string, confidence?:string}}
 */
export function evaluatePlacement(item, zoneId) {
  const zone = ZONES_BY_ID[zoneId];
  if (!zone) {
    return {
      zoneId,
      zoneName: zoneId,
      verdict: "forbidden",
      severity: "block",
      rationale: "That position isn't one of the room's places.",
    };
  }
  let rule;
  if (item.kind === "symbol") {
    rule = item.data.zoneRules?.[zoneId] ?? DEFAULT_ZONE_RULE;
  } else {
    rule = toolRule(item.data, zoneId) ?? DEFAULT_ZONE_RULE;
  }
  return {
    zoneId,
    zoneName: zone.name,
    verdict: rule.verdict,
    severity: rule.severity,
    rationale: rule.rationale,
    ...(rule.confidence ? { confidence: rule.confidence } : {}),
  };
}

/** True when a verdict permits placement at all (forbidden does not). */
export function verdictPermits(verdict) {
  return verdict !== "forbidden";
}

/** Human sentence for a verdict, used by HUD chips and notices. */
export function verdictSentence(evaluation) {
  return `${evaluation.zoneName}: ${VERDICT_COPY[evaluation.verdict]} — ${evaluation.rationale}`;
}
