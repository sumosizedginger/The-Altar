/**
 * data/symbols/taoic-lhp.js — 4 of 40 v1 symbols (spec §4).
 * Taoist (2) + Left-hand-path / Satanic (2).
 *
 * Scope statement for the LHP entries (also in traditions.js):
 * these entries cover historical and modern SYMBOLIC use — the iconography
 * of 19th-century occultism and organized Satanism (Church of Satan, 1966;
 * The Satanic Temple, 2013) and its documented history. They are not
 * endorsement, and this project gives no ritual instruction for these
 * traditions. Same neutral, sourced format as every other entry.
 */
import { symbol, rule } from "./_common.js";

export const TAOIST_SYMBOLS = [
  symbol({
    id: "taijitu",
    name: "Taijitu (Yin–Yang)",
    traditions: ["taoist"],
    lineage: "Song-dynasty cosmology (Zhou Dunyi's diagram and essay) → the two-fish circle consolidated later",
    region: "China, then global",
    era: "Diagram tradition from the 11th century CE; the familiar circle from later centuries",
    intent: ["balance", "mutual arising", "change"],
    meaning:
      "Two comma-shapes interlocked in a circle, each carrying a dot of the other: yin and yang mutually containing each other's seed — opposites as phases of one movement, not enemies.",
    history:
      "Zhou Dunyi's 11th-century 'Explanation of the Diagram of the Supreme Ultimate' anchors the taiji in documented cosmology; the specific two-fish circle familiar today consolidated later. The codex presents both facts: the idea is Song-era documented, the glyph's current form younger.",
    whenUsed: "Philosophy and martial arts, temples, meditation, feng shui.",
    whereUsed: "Temple roofs, martial arts halls, clothing and jewelry worldwide.",
    orientation: { default: "rotatable", notes: "Conventionally shown with the dividing curve vertical; rotationally balanced either way." },
    strokeOrder: [
      "The enclosing circle, from the top",
      "The S-curve dividing line, top to bottom",
      "Left dot (eye of the light fish)",
      "Right dot (eye of the dark fish)",
    ],
    animationType: "phase",
    animationParams: { mode: "taiji-wax-wane", periodSec: 16, glowOnFull: false },
    contested: true,
    competingInterpretations: [
      "Popular reading: the yin-yang as an eternal, fixed emblem of Taoism.",
      "Documented history: the taiji cosmology is Song-era (Zhou Dunyi), and the specific two-fish circle consolidated later — the meaning is older than the familiar drawing.",
    ],
    sources: [{ id: "zhou-dunyi-1070" }, { id: "wilhelm-1950" }],
    zoneRules: {
      pendant: rule("allowed", "Taijitu pendants are common worldwide."),
    },
    accessibilityLabel: "the yin-yang circle: two interlocked comma shapes, each with a dot",
    confidence: "high",
  }),

  symbol({
    id: "bagua",
    name: "Bagua (Eight Trigrams)",
    traditions: ["taoist"],
    lineage: "Yijing trigram tradition → Taoist cosmology, divination and feng shui",
    region: "China",
    era: "Trigram tradition from the Yijing (compiled over many centuries); diagrammatic use medieval onward",
    intent: ["the eight directions", "change", "divination"],
    meaning:
      "Eight trigrams — three-line figures of broken (yin) and unbroken (yang) lines — arranged around a center (often a taijitu): heaven, earth, thunder, wind, water, fire, mountain, lake.",
    history:
      "The trigrams are the Yijing's vocabulary, translated and studied worldwide (Wilhelm/Baynes the standard Western translation). Two documented arrangements exist — Earlier Heaven and Later Heaven — and the choice between them changes the reading; this codex's default is the Later Heaven order used in feng shui.",
    whenUsed: "Divination, feng shui, temple architecture, talismanic plaques.",
    whereUsed: "Above doorways in feng shui practice, temple roofs, divination tools.",
    orientation: { default: "upright", notes: "Arrangement order matters; default is Later Heaven with Li (fire) uppermost." },
    strokeOrder: [
      "The eight trigrams drawn in Later Heaven order, each as three line-strokes",
      "Beginning at the top (Li) and moving clockwise",
      "Central circle drawn last",
    ],
    animationType: "draw",
    animationParams: { speed: 0.8, direction: "clockwise-from-top", gap: 0.12 },
    contested: true,
    competingInterpretations: [
      "Earlier Heaven (Fuxi) arrangement: the trigrams in ideal cosmological order.",
      "Later Heaven (King Wen) arrangement: the trigrams in seasonal/directional order, used in feng shui. Both are documented; the codex defaults to Later Heaven and says so.",
    ],
    sources: [{ id: "wilhelm-1950" }],
    zoneRules: {
      "above-door": rule(
        "allowed",
        "Bagua plaques above doorways are documented feng shui practice.",
        { traditionScope: "taoist" }
      ),
    },
    accessibilityLabel: "eight three-line trigrams arranged around a central circle",
    confidence: "high",
  }),
];

export const LEFT_HAND_PATH_SYMBOLS = [
  symbol({
    id: "sigil-of-baphomet",
    name: "Sigil of Baphomet",
    traditions: ["left-hand-path"],
    lineage:
      "Lévi's Baphomet figure (1856) → distinct sigil (goat within an inverted pentagram) adopted by the Church of Satan, 1966",
    region: "United States (modern movement); global circulation",
    era: "The figure attested 1856; the sigil as an organizational emblem from 1966",
    intent: ["identity", "adversarial confession", "the movement's emblem"],
    meaning:
      "A goat's head set within an inverted pentagram, ringed with lettering: the official emblem of the Church of Satan since 1966. It functions as identity and deliberate provocation, not as a devotional image of a deity its own movement treats as symbol.",
    history:
      "Éliphas Lévi drew the allegorical Baphomet figure in 1856; that figure is NOT this sigil. The specific goat-in-inverted-pentagram emblem was adopted by Anton LaVey's Church of Satan at its founding (documented in The Satanic Bible, 1969). The Satanic Temple, a separate movement founded 2013, uses different iconography. This entry documents that history in the same sourced format used throughout this codex; it is not endorsement, and this project offers no ritual instruction for these movements.",
    whenUsed: "Organizational identity: insignia, publications, public displays by members.",
    whereUsed: "Movement publications and private display by adherents.",
    orientation: { default: "upright", notes: "The inverted pentagram orientation is intrinsic to this sigil." },
    strokeOrder: [
      "Inverted pentagram star, drawn apex-down",
      "The encircling ring",
      "The goat head within: horns, face, beard in sequence",
      "The ring lettering, drawn last",
    ],
    animationType: "draw",
    animationParams: { speed: 0.9, direction: "star-first", circle: "second" },
    contested: true,
    competingInterpretations: [
      "Church of Satan usage: an identity emblem since 1966, representing their reading of carnal nature.",
      "History-of-religions position: Lévi's 1856 Baphomet is a distinct allegorical figure, not this sigil; the two are commonly conflated.",
      "The Satanic Temple (founded 2013) uses different iconography; the sigil is not a universal 'satanic' sign even within that sphere.",
    ],
    caution:
      "Deliberately adversarial toward mainstream religious sensibilities, and widely read as such. Placement in shared or multi-faith spaces is consequential; the codex describes that consequence neutrally.",
    openStatus: "contextual",
    statusSource:
      "Documented identity mark of the Church of Satan (1966–present); outside that movement it is conventionally read as adversarial.",
    sources: [{ id: "lavey-1969" }, { id: "levi-1856" }],
    zoneRules: {
      "high-wall": rule(
        "warned",
        "Publicly visible placement of an identity mark designed to read as adversarial carries real social consequences; informed only.",
      ),
      "above-door": rule(
        "warned",
        "A threshold display invites every visitor to read the household as confessional in this movement.",
      ),
      floor: rule(
        "warned",
        "Even within movements that use it, the emblem is conventionally displayed, not placed underfoot.",
      ),
    },
    accessibilityLabel: "a goat's head inside an inverted five-pointed star, ringed with lettering",
    confidence: "high",
  }),

  symbol({
    id: "leviathan-cross",
    name: "Leviathan Cross",
    traditions: ["left-hand-path"],
    lineage: "Alchemical sulfur sign (early modern period) → reused as a Satanic identity sign in the 20th century",
    region: "Europe (alchemy); United States (modern reuse)",
    era: "Sulfur sign documented in early modern alchemy; modern reuse from the 20th century",
    intent: ["the alchemical sulfur", "identity", "the eternal above the cross"],
    meaning:
      "An infinity-like loop above a cross: originally the alchemical sign for sulfur (one of the 'principles' of metals). Modern Satanic movements reused it as an identity mark, reading the loop as the eternal and the cross as the four adversarial crowns in their own iconographic system.",
    history:
      "The sulfur sign is a standard entry in early modern alchemical tables. Its reuse as a Satanic sign is a documented 20th-century adoption (LaVeyan context). The two lives of the same glyph — alchemical then polemical — are both recorded here.",
    whenUsed: "Alchemical illustration in its first life; identity display in its second.",
    whereUsed: "Alchemical tables in antiquity of the sign's first use; movement insignia in its second.",
    orientation: { default: "upright" },
    strokeOrder: [
      "The loop: drawn as a lemniscate from the left",
      "Vertical stroke of the cross below",
      "Horizontal stroke of the cross",
    ],
    animationType: "draw",
    animationParams: { speed: 1.0, direction: "loop-then-cross" },
    contested: true,
    competingInterpretations: [
      "Alchemical reading: the sign denotes sulfur, a principle of metals, in early modern alchemy.",
      "Modern reading: reused as a Satanic identity sign since the 20th century, with its own assigned symbolism.",
    ],
    sources: [{ id: "alchemical-sulfur" }, { id: "lavey-1969" }],
    zoneRules: {
      "high-wall": rule(
        "warned",
        "Public visibility of a movement identity sign carries the same consequence notes as the sigil entry.",
      ),
    },
    accessibilityLabel: "a loop above a cross, the alchemical sulfur sign reused as an identity mark",
    confidence: "high",
  }),
];
