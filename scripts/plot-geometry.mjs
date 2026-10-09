#!/usr/bin/env node
/**
 * scripts/plot-geometry.mjs — ASCII preview of symbol geometry.
 * Developer eyes for the Phase 2 authoring loop (no browser needed):
 *
 *   node scripts/plot-geometry.mjs            # every symbol with geometry
 *   node scripts/plot-geometry.mjs ankh djed  # specific ids
 */
import { SYMBOLS } from "../data/symbols.js";
import { plotGeometry, analyzeGeometry } from "../src/engine/sampler.js";

const wanted = new Set(process.argv.slice(2));
let shown = 0;

for (const s of SYMBOLS) {
  if (wanted.size && !wanted.has(s.id)) continue;
  if (!s.geometry) {
    if (wanted.size) console.log(`${s.id}: no geometry yet`);
    continue;
  }
  const { issues } = analyzeGeometry(s.geometry);
  console.log(`── ${s.id} (${s.animationType}) ${issues.length ? "⚠ " + issues.join("; ") : "✓"} ──`);
  console.log(plotGeometry(s.geometry, 64, 34));
  console.log("");
  shown++;
}
if (!shown) console.log("(no symbols matched)");
