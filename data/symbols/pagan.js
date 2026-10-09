/**
 * data/symbols/pagan.js — 5 of 40 v1 symbols (spec §4).
 * Wicca & modern Pagan tradition. Formation dates follow Hutton;
 * practice descriptions follow Buckland/Regardie as documentation,
 * not prescription.
 */
import { symbol, rule } from "./_common.js";

export const PAGAN_SYMBOLS = [
  symbol({
    id: "pentacle",
    name: "Pentacle (with inverted variant)",
    traditions: ["wicca-pagan"],
    lineage:
      "Medieval protective pentagram → ceremonial magic → modern Wiccan altar tool (20th c.); inversion reading from Lévi (1856)",
    region: "Europe (medieval roots); global modern use",
    era: "Pentagram attested since antiquity; modern altar pentacle from the 20th century",
    intent: ["protection", "elements in balance", "consecration"],
    meaning:
      "A five-pointed star within a circle. In Wicca it commonly maps spirit above earth, water, fire and air and is the tool of the north quarter and of consecration. Upright and inverted orientations carry distinct documented histories.",
    history:
      "The pentagram has been a protective sign since antiquity and appears in medieval grimoires. Modern Wicca adopted the circled pentacle as an altar tool. Éliphas Lévi (1856) assigned the inverted form a deliberate 'matter above spirit' reading, which 20th-century Satanic movements then made their own. All of this is documented; the orientations are different conventions, not a hierarchy of propriety.",
    whenUsed: "Casting circles, consecrating objects, the north/earth quarter in directional work.",
    whereUsed: "Altar discs in Wiccan practice; protective signs in ceremonial temples.",
    orientation: { default: "upright", notes: "Both orientations are documented; the codex treats them as distinct signs with distinct histories." },
    strokeOrder: [
      "Star: apex to lower-left point",
      "Star: across to upper-right point",
      "Star: to lower-right point",
      "Star: to upper-left point, closing at the apex",
      "Circle, clockwise from the top",
    ],
    animationType: "draw",
    animationParams: { speed: 1.0, direction: "apex-first", circle: "last" },
    contested: true,
    competingInterpretations: [
      "Wiccan and ceremonial reading: upright pentacle as spirit ruling the four elements, a sign of protection and consecration.",
      "Lévi-derived reading (1856): the inverted form as matter above spirit, adopted as an identity sign by 20th-century Satanic movements.",
      "Historical reading: the pentagram itself served as a Christian protective sign in the medieval period, before any of these mappings.",
    ],
    caution:
      "The inverted orientation is publicly read as adversarial by many outside modern Paganism. Both orientations are presented here with their documented histories; choose placement aware of how each reads.",
    openStatus: "contextual",
    statusSource:
      "Orientation carries lineage-specific meaning since Lévi (1856) and is an identity mark of the Church of Satan since 1966; placement guidance varies by lineage.",
    sources: [{ id: "levi-1856" }, { id: "regardie-1937" }, { id: "hutton-1999" }, { id: "buckland-1986" }],
    zoneRules: {
      "altar-north": rule(
        "allowed",
        "In directional systems the pentacle holds the north quarter; this placement is aligned with that convention.",
        { heightRule: "on the altar surface", traditionScope: "wicca-pagan" }
      ),
      "above-door": rule(
        "warned",
        "A visible pentacle at a threshold reads as confessional or adversarial depending on audience and orientation; outside convention for shared spaces.",
      ),
      "high-wall": rule(
        "warned",
        "Highly visible placement invites public readings of both orientations; consider the household audience.",
      ),
      floor: rule(
        "warned",
        "Consecrated tools and signs are commonly kept off the floor in the traditions that use them.",
      ),
    },
    accessibilityLabel: "a five-pointed star inside a circle",
    confidence: "medium",
  }),

  symbol({
    id: "triple-moon",
    name: "Triple Moon",
    traditions: ["wicca-pagan"],
    lineage: "Triple-goddess motif in antiquity → Graves' poetic schema (1948) → consolidated glyph in modern Wicca (20th c.)",
    region: "Global modern use",
    era: "Glyph consolidated in the 20th century; antecedents ancient",
    intent: ["cycles", "feminine mystery", "waxing-full-waning"],
    meaning:
      "Waxing crescent, full disc, waning crescent on one line: Maiden, Mother, Crone; the moon's three visible states as one life.",
    history:
      "Triple goddesses are genuinely attested in antiquity, but the consolidated maiden/mother/crone schema owes much to Robert Graves' The White Goddess (1948) — a poetic work historians treat as imaginative rather than historical — and the single-line glyph consolidated within 20th-century Wicca. Practitioners use it devotionally regardless of its recent consolidation.",
    whenUsed: "Goddess devotions, esbat workings, marking the moon's phases on the altar.",
    whereUsed: "Altar backdrops, goddess shrines, jewelry.",
    orientation: { default: "upright", notes: "Reads left to right: waxing, full, waning." },
    strokeOrder: [
      "Waxing crescent: open arc on the left",
      "Full moon: complete circle at center",
      "Waning crescent: mirrored open arc on the right",
    ],
    animationType: "phase",
    animationParams: { mode: "lunar-cycle", periodSec: 24, glowOnFull: true },
    contested: true,
    competingInterpretations: [
      "Devotional reading: the eternal triple goddess of prehistory, surviving into modern practice.",
      "Historical reading: triple lunar goddesses are attested in antiquity, but the maiden/mother/crone package and this glyph are documented modern consolidations (Graves 1948 onward).",
    ],
    sources: [{ id: "graves-1948" }, { id: "hutton-1999" }, { id: "starhawk-1979" }],
    zoneRules: {
      "high-wall": rule(
        "allowed",
        "The triple moon commonly presides over goddess shrines from a raised position.",
        { heightRule: "above eye level" }
      ),
    },
    accessibilityLabel: "a full moon flanked by two crescents on one line",
    confidence: "medium",
  }),

  symbol({
    id: "hecates-wheel",
    name: "Hecate's Wheel",
    traditions: ["wicca-pagan"],
    lineage: "Attested in the Greek Magical Papyri (PGM); revived in modern Hellenic and Pagan practice",
    region: "Greco-Roman Egypt (attestation); global modern revival",
    era: "Attested in late antique papyri; modern revival from the late 20th century",
    intent: ["liminality", "guidance at crossroads", "the unseen"],
    meaning:
      "A wheel with a serpentine figure within, associated with Hecate in the Greek Magical Papyri. Modern practitioners use it for crossroads, thresholds and the dark of the moon.",
    history:
      "The PGM contain ritual material associated with Hecate, and the wheel-and-serpent diagram appears in that corpus as documented by its standard translation (Betz). The modern name 'strophalos of Hecate' and some reconstructed details are contemporary; the codex shows the attested core and marks reconstruction as reconstruction.",
    whenUsed: "Crossroad and threshold rites; dark-moon devotions in revival practice.",
    whereUsed: "Shrines to Hecate, crossroad offerings, plaques.",
    orientation: { default: "upright" },
    strokeOrder: [
      "Outer ring, from the top",
      "Six-spoked wheel within, drawn as three diameters",
      "The serpent: a single S-curve woven through the spokes",
    ],
    animationType: "draw",
    animationParams: { speed: 0.85, direction: "rim-inward", flourish: "serpent-weave" },
    contested: true,
    competingInterpretations: [
      "Attested position: a Hecate-related diagram survives in the PGM ritual corpus.",
      "Reconstruction note: the exact modern rendering and the name 'strophalos' involve contemporary reconstruction choices; practitioners differ on details.",
    ],
    sources: [{ id: "betz-1986" }],
    zoneRules: {
      "above-door": rule(
        "allowed",
        "Hecate's traditional domain is the threshold; a door placement aligns with the attested association.",
      ),
    },
    accessibilityLabel: "a wheel enclosing a coiled serpent",
    confidence: "medium",
  }),

  symbol({
    id: "horned-god",
    name: "Horned God",
    traditions: ["wicca-pagan"],
    lineage:
      "Wiccan deity figure (20th c.) drawing on antlered iconography (Gundestrup cauldron, c. 100 BCE) and classical Pan",
    region: "Global modern use; iconographic roots in Iron Age Europe and the classical world",
    era: "Theology formed in the 20th century; iconographic antecedents ancient",
    intent: ["wilderness", "the animal soul", "sun and sacrifice"],
    meaning:
      "The horned masculine divine of Wiccan theology: lord of animals, wilderness and the hunt, consort to the goddess, dying and renewing with the year.",
    history:
      "Antlered figures are genuinely attested — the Gundestrup cauldron's seated figure is usually (not uncontroversially) read as the Celtic god Cernunnos, and Pan is classical. The unified 'Horned God' of Wicca was assembled in the 20th century. Margaret Murray's witch-cult thesis, once offered as its historical warrant, has not survived scholarly scrutiny (Hutton).",
    whenUsed: "Sabbat cycles, wilderness dedications, the god-half of paired devotion.",
    whereUsed: "Statues or plaques on Wiccan altars, often paired with a goddess figure.",
    orientation: { default: "upright" },
    strokeOrder: [
      "The two horns: left arc, then right arc",
      "Head outline beneath the horns",
      "Shoulders, one continuous stroke",
      "Optional sun-disc between the horns, drawn last",
    ],
    animationType: "draw",
    animationParams: { speed: 0.9, direction: "horns-first" },
    contested: true,
    competingInterpretations: [
      "Wiccan theology: an ancient horned god surviving behind many regional names.",
      "Historical scholarship: antlered figures are attested separately (Cernunnos, Pan); the unified Horned God is a 20th-century synthesis, and the witch-cult thesis once used to claim continuity is discredited (Murray 1921; Hutton 1999).",
    ],
    caution:
      "Distinct ancient horned figures are not interchangeable with each other or with the Wiccan god; the codex keeps their contexts separate.",
    sources: [{ id: "gundestrup-cauldron" }, { id: "hutton-1999" }, { id: "murray-1921" }],
    zoneRules: {
      "altar-west": rule(
        "allowed",
        "Paired god/goddess placements conventionally divide the altar's sides.",
      ),
    },
    accessibilityLabel: "a horned male figure with a sun-disc between his antlers",
    confidence: "medium",
  }),

  symbol({
    id: "elemental-triangles",
    name: "Elemental Triangles",
    traditions: ["wicca-pagan"],
    lineage: "Renaissance elemental tables (Agrippa 1533) → ceremonial magic grades (Golden Dawn, 1888+)",
    region: "Europe",
    era: "Codified in the 16th century; standardized in the 19th",
    intent: ["elements", "balance", "grade signs"],
    meaning:
      "Four triangles: fire (apex up), water (apex down), air (up with bar), earth (down with bar). The horizontal bar distinguishes the volatile from the fixed.",
    history:
      "Triangle-based elemental signs were codified in Renaissance occult philosophy (Agrippa) and standardized by the Hermetic Order of the Golden Dawn, whose material was published by Regardie. They remain the working vocabulary of much modern ceremonial magic.",
    whenUsed: "Quarter calls, banishings, and elemental workings in ceremonial practice.",
    whereUsed: "Ritual tools, lamens, and altar cards.",
    orientation: { default: "upright", notes: "Each triangle has a fixed orientation within the set; the bar marks air and earth." },
    strokeOrder: [
      "Fire: triangle, apex up, closed",
      "Water: triangle, apex down, closed",
      "Air: triangle apex up, then the horizontal bar",
      "Earth: triangle apex down, then the horizontal bar",
    ],
    animationType: "weave",
    animationParams: { overUnder: true, strandWidth: 0.04, passes: 4, sequence: "fire-water-air-earth" },
    sources: [{ id: "agrippa-1533" }, { id: "regardie-1937" }],
    zoneRules: {
      "altar-north": rule(
        "allowed",
        "The earth triangle belongs to the north quarter in directional systems.",
        { traditionScope: "wicca-pagan", adjacencyRule: "near:pentacle" }
      ),
      "altar-east": rule(
        "allowed",
        "The air triangle belongs to the east quarter in directional systems.",
        { traditionScope: "wicca-pagan", adjacencyRule: "near:wand" }
      ),
      "altar-south": rule(
        "allowed",
        "The fire triangle belongs to the south quarter in directional systems.",
        { traditionScope: "wicca-pagan", adjacencyRule: "near:candle" }
      ),
      "altar-west": rule(
        "allowed",
        "The water triangle belongs to the west quarter in directional systems.",
        { traditionScope: "wicca-pagan", adjacencyRule: "near:chalice" }
      ),
    },
    accessibilityLabel: "four triangles marking fire, water, air and earth",
    confidence: "high",
  }),
];
