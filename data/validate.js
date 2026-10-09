#!/usr/bin/env node
/**
 * data/validate.js — CLI dataset validator (Phase 1 gate).
 *
 *   node data/validate.js
 *
 * Loads every data module, runs schema.validateDataset, prints a
 * pass/fail report, and exits non-zero on any error. Warnings are
 * tolerated but counted (geometry is scheduled for Phase 2 and appears
 * as tracked warnings until then).
 */
import { loadAndValidate, SCHEMA_VERSION, DATA_SCHEMA_VERSION, MINIMUMS } from "./schema.js";

const report = await loadAndValidate("./");

const { errors, warnings, info, counts } = report;

console.log(`Symbols & Sigils — dataset validation`);
console.log(`schema ${SCHEMA_VERSION} · data schema v${DATA_SCHEMA_VERSION}`);
console.log("");
console.log(`counts:`);
console.log(`  symbols   ${counts.symbols}  (minimum ${MINIMUMS.symbols})`);
console.log(`  tools     ${counts.tools}  (minimum ${MINIMUMS.tools})`);
console.log(`  zones     ${counts.zones}  (minimum ${MINIMUMS.zones})`);
console.log(`  rituals   ${counts.rituals}  (minimum ${MINIMUMS.rituals})`);
console.log(`  sources   ${counts.sources}`);
console.log(`  traditions ${counts.traditions}`);
console.log("");

const geometryPending = warnings.filter((w) => w.includes("G000")).length;
const otherWarnings = warnings.filter((w) => !w.includes("G000"));

if (counts.symbols) {
  const withGeometry = counts.symbols - geometryPending;
  console.log(`geometry: ${withGeometry}/${counts.symbols} symbols authored (bounds/closed/symmetry re-checked by sampler)`);
  console.log("");
}

if (info.length) {
  console.log(`info:`);
  info.forEach((m) => console.log(`  ${m}`));
  console.log("");
}

if (errors.length) {
  console.log(`ERRORS (${errors.length}):`);
  errors.forEach((m) => console.log(`  ${m}`));
  console.log("");
}

if (geometryPending) {
  console.log(`tracked: ${geometryPending} symbols awaiting Phase 2 geometry (G000)`);
}
if (otherWarnings.length) {
  console.log(`WARNINGS (${otherWarnings.length}):`);
  otherWarnings.forEach((m) => console.log(`  ${m}`));
  console.log("");
}

if (report.ok) {
  console.log(`RESULT: PASS — dataset satisfies the Phase 1 schema.`);
  process.exit(0);
} else {
  console.log(`RESULT: FAIL — ${errors.length} error(s) must be fixed.`);
  process.exit(1);
}
