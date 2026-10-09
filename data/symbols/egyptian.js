/**
 * data/symbols/egyptian.js — 6 of 40 v1 symbols (spec §4).
 * Egyptian tradition. Meanings follow standard Egyptological references
 * (Wilkinson, Pinch, Andrews); modern overlays are labeled as such.
 */
import { symbol, rule } from "./_common.js";

export const EGYPTIAN_SYMBOLS = [
  symbol({
    id: "ankh",
    name: "Ankh",
    traditions: ["egyptian"],
    lineage: "Pharaonic hieroglyphic sign, attested from the Early Dynastic period",
    region: "Egypt",
    era: "c. 3000 BCE onward",
    intent: ["life", "endurance", "offering"],
    meaning:
      "The looped cross: the hieroglyph for 'life' and 'living'. Gods extend it to the nostrils of kings as the breath of life; it stands for life given, sustained and eternal.",
    history:
      "Among the most continuously attested signs of Egyptian religion, the ankh appears in tomb painting, temple relief, mirrors, jewelry and amulets across three millennia. Coptic Christians later adopted a related cross form. Its popularity in modern culture rests on solid ancient attestation.",
    whenUsed: "Offering scenes and protective amulets in antiquity; devotional and heritage jewelry today.",
    whereUsed: "Temples and tombs in antiquity; pendants and shrine objects in modern use.",
    orientation: { default: "upright" },
    strokeOrder: [
      "Loop, drawn from the top, closing at the neck",
      "Vertical shaft, top to bottom",
      "Crossbar, left to right",
    ],
    animationType: "draw",
    animationParams: { speed: 1.0, direction: "top-down" },
    sources: [{ id: "wilkinson-1992" }, { id: "cooper-1978" }],
    zoneRules: {
      pendant: rule(
        "allowed",
        "The ankh is one of the most common amulet forms in the ancient record itself.",
      ),
    },
    accessibilityLabel: "a cross with a loop at its top, the Egyptian sign of life",
    confidence: "high",
  }),

  symbol({
    id: "eye-of-horus",
    name: "Eye of Horus (Wedjat)",
    traditions: ["egyptian"],
    lineage: "Pharaonic protective sign; among the most common Egyptian amulets",
    region: "Egypt",
    era: "Attested from the Old Kingdom onward",
    intent: ["protection", "healing", "restoration"],
    meaning:
      "The restored eye of Horus, offered to his father Osiris: wholeness after injury. As the wedjat ('the sound one') it protected the living and the dead alike.",
    history:
      "The wedjat is exhaustively attested on amulets, coffins and boat prows. The popular claim that its parts encode the fractions 1/2…1/64 and the five senses is a modern overlay found in contemporary literature, not in ancient sources; the codex keeps the two layers separate.",
    whenUsed: "Protective amulet in antiquity; protection jewelry and tattoos in modern use.",
    whereUsed: "Mummy wrappings, jewelry, boat prows; pendants today.",
    orientation: { default: "upright", notes: "The brow-and-cheek markings distinguish it from a generic eye." },
    strokeOrder: [
      "Brow line, left to right",
      "Upper eyelid arc",
      "Lower eyelid arc, closing the eye outline",
      "Pupil, centered",
      "Cheek marking: the descending curl",
      "Tail marking: the angled extension",
    ],
    animationType: "eye",
    animationParams: { trackCursor: true, blink: true, blinkEvery: [6, 14], disableUnderReducedMotion: true },
    contested: true,
    competingInterpretations: [
      "Modern popular reading: each part of the eye encodes a sense and a binary fraction (the 'sacred geometry' account).",
      "Egyptological position: the wedjat is a protection and restoration amulet; the fraction/sense mapping is not attested in ancient texts.",
    ],
    sources: [{ id: "wilkinson-1992" }, { id: "pinch-1994" }],
    zoneRules: {
      pendant: rule("allowed", "The wedjat was classically worn as a protective amulet."),
      "above-door": rule(
        "allowed",
        "A watching protective sign at a threshold aligns with the amulet's function.",
      ),
    },
    accessibilityLabel: "a stylized falcon eye with marked brow and cheek, the protective wedjat",
    confidence: "high",
  }),

  symbol({
    id: "djed",
    name: "Djed Pillar",
    traditions: ["egyptian"],
    lineage: "Pharaonic stability sign, later read as the backbone of Osiris",
    region: "Egypt",
    era: "Attested from the Early Dynastic period; Osirian reading by the New Kingdom",
    intent: ["stability", "endurance", "support"],
    meaning:
      "A broad pillar with four horizontal crossbars: 'stability' and 'endurance'. Later tradition identified it with the backbone of Osiris, so it also carries resurrection.",
    history:
      "The djed appears as an amulet and architectural motif across Egyptian history, and the 'raising of the djed' was a documented ritual act associated with Osiris festivals. Its combination of structural steadiness and resurrection made it a favorite for amulets placed on mummies.",
    whenUsed: "Foundation and stability rites in antiquity; steadiness dedications in modern Kemetic practice.",
    whereUsed: "Temple walls and amulets in antiquity; altar anchors today.",
    orientation: { default: "upright" },
    strokeOrder: [
      "Central pillar, bottom to top",
      "Lowest crossbar, left to right",
      "Second crossbar",
      "Third crossbar",
      "Top crossbar, widest",
    ],
    animationType: "draw",
    animationParams: { speed: 0.9, direction: "bottom-up" },
    sources: [{ id: "wilkinson-1992" }],
    zoneRules: {
      "altar-north": rule(
        "allowed",
        "A stability sign at the back of the altar reads as the altar's spine — aligned with convention.",
        { adjacencyRule: "near:stone" }
      ),
    },
    accessibilityLabel: "a pillar with four stacked crossbars, the sign of stability",
    confidence: "high",
  }),

  symbol({
    id: "was-scepter",
    name: "Was Scepter",
    traditions: ["egyptian"],
    lineage: "Pharaonic power sign carried by gods, kings and officials",
    region: "Egypt",
    era: "Attested from the Early Dynastic period",
    intent: ["power", "dominion", "well-being"],
    meaning:
      "A staff with an angled animal head and a forked base: the hieroglyph for dominion and well-being, carried by deities as the instrument of their authority.",
    history:
      "The was scepter appears in the hands of nearly every major deity in temple relief, and paired djed-and-was motifs frame scenes of cosmic order. As an amulet it conveyed power and prosperity.",
    whenUsed: "Regalia imagery in antiquity; authority and guardianship dedications in modern use.",
    whereUsed: "Temple relief and tomb painting in antiquity; flanking positions on modern altars.",
    orientation: { default: "upright" },
    strokeOrder: [
      "Shaft, bottom to top",
      "Scepter head: the angled beast head at the top",
      "Forked base, two short strokes",
    ],
    animationType: "draw",
    animationParams: { speed: 0.95, direction: "bottom-up" },
    sources: [{ id: "wilkinson-1992" }],
    zoneRules: {
      "altar-east": rule(
        "allowed",
        "A power sign suits a flanking position at the altar's edge.",
        { adjacencyRule: "near:djed" }
      ),
    },
    accessibilityLabel: "a tall staff with an angled animal head and forked foot",
    confidence: "high",
  }),

  symbol({
    id: "shen-ring",
    name: "Shen Ring",
    traditions: ["egyptian"],
    lineage: "Pharaonic eternity sign; ancestor of the cartouche",
    region: "Egypt",
    era: "Attested from the Old Kingdom",
    intent: ["eternity", "enclosure", "protection"],
    meaning:
      "A loop of rope with no end: 'to encircle'. It signifies eternity and protective encirclement; the royal cartouche is a shen stretched around a name.",
    history:
      "The shen is grasped by gods and shown in the talons of protective deities above kings. As an amulet it meant unending protection. Its loop form makes it a natural candidate for the codex's rotating-loop animation.",
    whenUsed: "Protective encirclement in antiquity; eternity dedications today.",
    whereUsed: "Amulets and relief in antiquity; pendants and plaques today.",
    orientation: { default: "rotatable", notes: "A closed loop; orientation-neutral." },
    strokeOrder: [
      "The loop, drawn as one continuous circle starting at the base knot",
      "The knot at the base, a short crossing stroke",
    ],
    animationType: "particles",
    animationParams: { mode: "rotating-loop", rpm: 4, particles: 24, trail: 0.35 },
    sources: [{ id: "wilkinson-1992" }],
    zoneRules: {
      pendant: rule("allowed", "The shen was worn as a protective amulet in the ancient record."),
    },
    accessibilityLabel: "a knotted rope ring, the Egyptian sign of eternity",
    confidence: "high",
  }),

  symbol({
    id: "scarab",
    name: "Scarab",
    traditions: ["egyptian"],
    lineage: "Pharaonic solar and regeneration sign; the single most numerous Egyptian amulet class",
    region: "Egypt",
    era: "Attested from the First Intermediate Period onward",
    intent: ["transformation", "dawn", "self-creation"],
    meaning:
      "The dung beetle rolling its ball, read as Khepri rolling the dawn sun: becoming, transformation and self-raised life.",
    history:
      "Scarab amulets survive in enormous numbers, from simple steatite seals to the great heart scarabs placed in mummy wrappings with spell 30B of the Book of the Dead. Carol Andrews' British Museum catalogue remains the standard typology.",
    whenUsed: "Seals and protective amulets in antiquity; transformation dedications today.",
    whereUsed: "Rings, pectorals and mummy wrappings in antiquity; pendants today.",
    orientation: { default: "upright", notes: "Head upward; the beetle's ball, when shown, is pushed ahead." },
    strokeOrder: [
      "Body outline: head, then wing cases in two strokes",
      "Legs: three strokes each side",
      "Optional sun-ball in front, a single arc",
    ],
    animationType: "draw",
    animationParams: { speed: 0.8, direction: "head-to-tail", flourish: "sun-roll" },
    sources: [{ id: "andrews-1994" }, { id: "wilkinson-1992" }],
    zoneRules: {
      pendant: rule("allowed", "The scarab is the classic Egyptian amulet form."),
    },
    accessibilityLabel: "a dung beetle pushing the sun, carved as an amulet",
    confidence: "high",
  }),
];
