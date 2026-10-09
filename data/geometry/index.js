/**
 * data/geometry/index.js — merges all geometry batches into one registry.
 * Batches correspond to the Phase 2 delivery order (10 symbols each).
 */
import { BATCH1 } from "./batch1.js";
import { BATCH2 } from "./batch2.js";
import { BATCH3 } from "./batch3.js";
import { BATCH4 } from "./batch4.js";

export const GEOMETRY = {
  ...BATCH1,
  ...BATCH2,
  ...BATCH3,
  ...BATCH4,
};

/** Attach geometry records onto symbol objects (id match). */
export function attachGeometry(symbols) {
  for (const s of symbols) {
    if (GEOMETRY[s.id]) s.geometry = GEOMETRY[s.id];
  }
  return symbols;
}
