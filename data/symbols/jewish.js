/**
 * data/symbols/jewish.js — 3 of 40 v1 symbols (spec §4).
 */
import { symbol, rule } from "./_common.js";

export const JEWISH_SYMBOLS = [
  symbol({
    id: "star-of-david",
    name: "Star of David (Magen David)",
    traditions: ["jewish"],
    lineage: "Late-medieval Prague Jewish community → 19th-century communal standard → universal Jewish sign",
    region: "Global",
    era: "Hexagram attested ornamentally in antiquity; specifically Jewish communal use documented from the 14th–17th centuries, standard by the 19th",
    intent: ["identity", "protection", "communal memory"],
    meaning:
      "Two interlocked triangles forming a six-pointed star: the shield of David, today the most widely recognized sign of Jewish communal identity.",
    history:
      "Gershom Scholem's history of the star traces its surprisingly late rise: hexagrams circulated as general ornament and magic signs for centuries before Prague's Jewish community adopted the emblem, and before it became a communal standard in the 1800s. Its adoption as universal Jewish sign — and its forced wearing under Nazi rule, then its place on Israel's flag — are 19th- and 20th-century facts.",
    whenUsed: "Synagogue ornament, communal identity, memorial and mourning (on gravestones), worn with pride.",
    whereUsed: "Synagogues, homes, jewelry, communal flags.",
    orientation: { default: "rotatable", notes: "Sixfold symmetry; conventionally shown with a point upward." },
    strokeOrder: [
      "First triangle: apex up, drawn as three sides",
      "Second triangle: apex down, drawn as three sides over the first",
    ],
    animationType: "weave",
    animationParams: { overUnder: true, strandWidth: 0.04, passes: 2 },
    contested: true,
    competingInterpretations: [
      "Popular assumption: that the star is an ancient, biblical Jewish sign.",
      "Documented history: specifically Jewish communal use is late-medieval and early-modern; Scholem's study is the standard account.",
    ],
    sources: [{ id: "scholem-1949" }],
    zoneRules: {
      "high-wall": rule(
        "allowed",
        "A raised star in a home or synagogue follows documented communal placement.",
        { heightRule: "above eye level" }
      ),
      floor: rule(
        "warned",
        "Placing a communal identity sign on the floor is outside convention for many practitioners.",
      ),
      pendant: rule("allowed", "Star pendants are widely worn as identity jewelry."),
    },
    accessibilityLabel: "a six-pointed star formed of two interlocked triangles",
    confidence: "high",
  }),

  symbol({
    id: "menorah",
    name: "Menorah",
    traditions: ["jewish"],
    lineage: "Biblical specification (Exodus 25) → Temple cult → synagogue and state emblem",
    region: "Judea/Israel, then global",
    era: "Biblical specification; Temple-period attestation; continuous use since",
    intent: ["light", "continuity", "temple memory"],
    meaning:
      "The seven-branched lampstand specified in Exodus: the oldest continuously used sign associated with the Jewish people, and the emblem on the modern state's coat of arms.",
    history:
      "Exodus 25:31–40 specifies the seven-branched golden lampstand; it stood in the Tabernacle and later Temples, and appears on the Arch of Titus relief. The nine-branched Hanukkah lamp (hanukkiah, discussed in Talmud Shabbat) is a related but distinct object; popular speech often calls both 'menorah', and the codex records both usages.",
    whenUsed: "Temple service in antiquity; Hanukkah lights for eight nights; synagogue ornament year-round.",
    whereUsed: "Temples ancient and synagogues modern; the hanukkiah in home windows.",
    orientation: { default: "upright" },
    strokeOrder: [
      "Central shaft, bottom to top",
      "Three arms curving up on the left, drawn outward",
      "Three arms curving up on the right, drawn outward",
      "Seven flames: short strokes atop each shaft, left to right",
      "The base, one stroke",
    ],
    animationType: "draw",
    animationParams: { speed: 0.85, direction: "shaft-then-arms", flourish: "flames-last" },
    contested: true,
    competingInterpretations: [
      "Popular usage: 'menorah' commonly means the nine-branched Hanukkah lamp.",
      "Documented distinction: the Temple menorah has seven branches; the hanukkiah has nine (eight lights plus the shamash). Both usages are recorded here.",
    ],
    sources: [{ id: "exodus-25" }, { id: "talmud-shabbat" }],
    zoneRules: {
      "high-wall": rule(
        "allowed",
        "The menorah presides in synagogues from a raised position.",
        { heightRule: "above eye level" }
      ),
      "above-door": rule(
        "allowed",
        "Hanukkah lights are traditionally displayed at a doorway or window to publicize the miracle.",
        { traditionScope: "jewish" }
      ),
    },
    accessibilityLabel: "a seven-branched lampstand with seven small flames",
    confidence: "high",
  }),

  symbol({
    id: "chai",
    name: "Chai (חַי)",
    traditions: ["jewish"],
    lineage: "Hebrew word 'living'; gematria value 18; widely used in modern Jewish life",
    region: "Global",
    era: "Word ancient; jewelry and gift usage prominent in modern centuries",
    intent: ["life", "blessing", "l'chaim"],
    meaning:
      "The Hebrew letters chet and yud spelling חַי, 'alive' or 'living'. Its letters sum to 18 in gematria, making 18 a number of life — gifts and toasts multiply it.",
    history:
      "Chai appears across modern Jewish material culture: pendants, rings, donations in multiples of 18, and the toast l'chaim ('to life'). The codex presents it as a living word-sign rather than an ancient artifact, which is what the evidence supports.",
    whenUsed: "Gifts and toasts; worn as affirmation of life; charitable giving in multiples of 18.",
    whereUsed: "Jewelry, gift cards, home decoration.",
    orientation: { default: "upright", notes: "Hebrew reads right to left: chet (ח) then yud (י)." },
    strokeOrder: [
      "Chet: right vertical stroke, top to bottom",
      "Chet: roof stroke crossing to the left",
      "Chet: left vertical stroke",
      "Yud: single suspended stroke",
    ],
    animationType: "brush",
    animationParams: { speed: 0.9, pressure: "calligraphic", direction: "rtl" },
    sources: [{ id: "kolatch-1981" }],
    zoneRules: {
      pendant: rule("allowed", "Chai pendants are among the most common pieces of Jewish jewelry."),
    },
    accessibilityLabel: "the Hebrew word chai, meaning life",
    confidence: "medium",
  }),
];
