/**
 * data/symbols/islamic.js — 3 of 40 v1 symbols (spec §4).
 * Note: no figural imagery. Qur'anic text itself is treated with the
 * respect conventions recorded in the context box for this tradition.
 */
import { symbol, rule } from "./_common.js";

export const ISLAMIC_SYMBOLS = [
  symbol({
    id: "rub-el-hizb",
    name: "Rub el Hizb (۞)",
    traditions: ["islamic"],
    lineage: "Qur'anic manuscript orthography: marker for one quarter of a hizb",
    region: "Islamic world",
    era: "Attested in Qur'an manuscripts across many centuries",
    intent: ["recitation", "structure", "the word honored"],
    meaning:
      "Two overlapping squares (often around a central motif): the marker dividing the Qur'an into recitation units. The Qur'an is conventionally divided into 60 hizb; each rub el hizb marks a quarter of one.",
    history:
      "The glyph belongs to the manuscript tradition of Qur'an copying, where it helps reciters navigate the text. As Qur'an-adjacent script, it inherits the respect conventions applied to Qur'anic text: kept clean, kept elevated, never placed where it would be dishonored.",
    whenUsed: "Navigating recitation; decorative use derived from manuscript ornament.",
    whereUsed: "Qur'an margins; mosque ornament; modern Islamic design.",
    orientation: { default: "rotatable", notes: "Conventionally set with a square point-up (diamond) and one square level." },
    strokeOrder: [
      "First square, drawn level, closed",
      "Second square, rotated 45°, drawn over the first",
      "Central motif (circle or word), drawn last",
    ],
    animationType: "weave",
    animationParams: { overUnder: true, strandWidth: 0.04, passes: 2, sequence: "square-diamond-center" },
    sources: [{ id: "quran-orthography" }],
    zoneRules: {
      floor: rule(
        "forbidden",
        "A sign from Qur'anic manuscript tradition is kept off the floor and away from impure places, in line with recorded respect conventions for Qur'anic text.",
      ),
      "high-wall": rule(
        "allowed",
        "Elevated placement honors the glyph's manuscript lineage.",
        { heightRule: "above eye level" }
      ),
      pendant: rule(
        "allowed",
        "Rub el hizb pendants are common; the respect conventions travel with the object.",
      ),
    },
    accessibilityLabel: "two overlapping squares forming an eight-pointed star with a center",
    confidence: "high",
  }),

  symbol({
    id: "crescent-and-star",
    name: "Crescent and Star",
    traditions: ["islamic"],
    lineage: "Pre-Islamic Anatolian use → Ottoman imperial standards → flags of many Muslim-majority states",
    region: "Anatolia, the Ottoman world, then global",
    era: "Ottoman state association documented 18th–19th century; earlier crescents predate Islam",
    intent: ["community", "sovereignty", "night and guidance"],
    meaning:
      "A crescent moon cradling a star: strongly associated with the Ottoman state and, through it, with many Muslim-majority nations. Widely used decoratively by Muslims, though scholars note it is not a universal religious sign the way the cross or star-of-David is for their communities.",
    history:
      "Crescent imagery predates Islam in Anatolia; the crescent-and-star pairing consolidates on Ottoman standards and later national flags (documented tradition). Many Muslims embrace it as communal identity; some scholars and practitioners prefer purely calligraphic signs. The codex records both attitudes.",
    whenUsed: "Flags, architecture (minaret finials, mosque domes), Ramadan decoration.",
    whereUsed: "State and communal spaces; festive decoration; jewelry.",
    orientation: { default: "upright", notes: "Crescent opening upward, star within the arms." },
    strokeOrder: [
      "Crescent: outer arc",
      "Crescent: inner arc completing the lune",
      "The star: five points, drawn in one continuous pass",
    ],
    animationType: "draw",
    animationParams: { speed: 1.0, direction: "crescent-then-star" },
    contested: true,
    competingInterpretations: [
      "Popular reading: a universal Islamic symbol.",
      "Scholarly position: the association is late and Ottoman-mediated; not all Muslims accept it as a religious sign, and some prefer calligraphic emblems.",
    ],
    sources: [{ id: "ottoman-flag-tradition" }],
    zoneRules: {
      "above-door": rule(
        "allowed",
        "Crescent finials crown gates and minarets across the Ottoman architectural tradition.",
      ),
    },
    accessibilityLabel: "a crescent moon cradling a five-pointed star",
    confidence: "medium",
  }),

  symbol({
    id: "khatam",
    name: "Khatam (Eight-Pointed Star)",
    traditions: ["islamic"],
    lineage: "Islamic geometric tradition; the two-square star polygon of mosque ornament and tilework",
    region: "Islamic world",
    era: "Attested across many centuries of Islamic art",
    intent: ["order", "infinity", "sacred geometry"],
    meaning:
      "The eight-pointed star built from two overlapping squares: one of the master motifs of Islamic sacred geometry, organizing tilework, woodwork and manuscript borders.",
    history:
      "Islamic geometric design develops star polygons by compass-and-straightedge construction; Burckhardt's study documents their symbolic readings as signs of unity within multiplicity. The khatam family appears from al-Andalus to Central Asia.",
    whenUsed: "Mosque and madrasa ornament; manuscript borders; modern Islamic design.",
    whereUsed: "Tilework, ceilings, mihrab surrounds, screens.",
    orientation: { default: "rotatable", notes: "Eightfold symmetry; orientation-neutral." },
    strokeOrder: [
      "First square, level, closed",
      "Second square, rotated 45°, closed",
      "Central rosette, drawn from the center outward",
    ],
    animationType: "weave",
    animationParams: { overUnder: true, strandWidth: 0.035, passes: 2, sequence: "squares-rosette" },
    sources: [{ id: "burckhardt-1976" }],
    zoneRules: {
      floor: rule(
        "warned",
        "Pure geometric ornament has more latitude than text, but pieces carrying Qur'anic association are commonly kept above floor level.",
      ),
      "high-wall": rule(
        "allowed",
        "Wall and ceiling placement is where this motif lives in the documented tradition.",
        { heightRule: "above eye level" }
      ),
    },
    accessibilityLabel: "an eight-pointed star made of two overlapping squares",
    confidence: "high",
  }),
];
