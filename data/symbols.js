/**
 * data/symbols.js — the v1 roster of 40 symbols, aggregated from
 * tradition-grouped files (spec §4). Import order is display order.
 *
 * Counts: celtic 7 + egyptian 6 + wicca/pagan 5 + christian 4 +
 * jewish 3 + islamic 3 + hindu 4 + buddhist 4 + taoist 2 +
 * left-hand-path 2 = 40.
 */
import { CELTIC_SYMBOLS } from "./symbols/celtic.js";
import { EGYPTIAN_SYMBOLS } from "./symbols/egyptian.js";
import { PAGAN_SYMBOLS } from "./symbols/pagan.js";
import { CHRISTIAN_SYMBOLS } from "./symbols/christian.js";
import { JEWISH_SYMBOLS } from "./symbols/jewish.js";
import { ISLAMIC_SYMBOLS } from "./symbols/islamic.js";
import { HINDU_SYMBOLS, BUDDHIST_SYMBOLS } from "./symbols/dharmic.js";
import { TAOIST_SYMBOLS, LEFT_HAND_PATH_SYMBOLS } from "./symbols/taoic-lhp.js";

import { attachGeometry } from "./geometry/index.js";

export const SYMBOLS = attachGeometry([
  ...CELTIC_SYMBOLS,
  ...EGYPTIAN_SYMBOLS,
  ...PAGAN_SYMBOLS,
  ...CHRISTIAN_SYMBOLS,
  ...JEWISH_SYMBOLS,
  ...ISLAMIC_SYMBOLS,
  ...HINDU_SYMBOLS,
  ...BUDDHIST_SYMBOLS,
  ...TAOIST_SYMBOLS,
  ...LEFT_HAND_PATH_SYMBOLS,
]);

export const SYMBOL_COUNT = SYMBOLS.length;

export const SYMBOLS_BY_ID = Object.fromEntries(SYMBOLS.map((s) => [s.id, s]));
