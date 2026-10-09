/**
 * data/symbols/christian.js — 4 of 40 v1 symbols (spec §4).
 */
import { symbol, rule } from "./_common.js";

export const CHRISTIAN_SYMBOLS = [
  symbol({
    id: "latin-cross",
    name: "Latin Cross",
    traditions: ["christian"],
    lineage: "Late antique Christian confession sign; universal in Western Christendom",
    region: "Global",
    era: "Attested from the 4th century onward as a public sign",
    intent: ["faith", "sacrifice", "hope"],
    meaning:
      "The vertical-plus-horizontal cross: Christianity's central sign, referencing the crucifixion and, for most traditions, the resurrection that follows it.",
    history:
      "After Constantine, the cross moved from a shameful instrument to a public sign of faith, documented in literature and art from the 4th century. Koch's catalogue traces its hundreds of historical variants. Denominational practice differs: many Western churches prefer the plain cross; Catholic, Orthodox and some Anglican usage favors the crucifix with the corpus.",
    whenUsed: "Worship, veneration (notably Good Friday), personal devotion, graves and memorials.",
    whereUsed: "Churches, homes, worn as jewelry, marked on foreheads at Ash Wednesday.",
    orientation: { default: "upright" },
    strokeOrder: [
      "Vertical beam, top to bottom",
      "Horizontal beam, left to right",
    ],
    animationType: "draw",
    animationParams: { speed: 1.0, direction: "top-down", radius: 0.02 },
    contested: true,
    competingInterpretations: [
      "Most Western Protestant usage: the plain cross, emphasizing resurrection and the finished work.",
      "Catholic and Orthodox usage: the crucifix with corpus, emphasizing the passion itself. Neither is presented as the standard; the codex records both.",
    ],
    sources: [{ id: "koch-1923" }, { id: "cirlot-1962" }],
    zoneRules: {
      "high-wall": rule(
        "allowed",
        "A raised cross presiding over a room follows centuries of church and household practice.",
        { heightRule: "above eye level" }
      ),
      floor: rule(
        "forbidden",
        "Placing the cross on the floor is outside convention across Christian traditions.",
      ),
      pendant: rule("allowed", "Cross pendants are among the most widely worn religious jewelry."),
    },
    accessibilityLabel: "a plain Latin cross",
    confidence: "high",
  }),

  symbol({
    id: "chi-rho",
    name: "Chi-Rho",
    traditions: ["christian"],
    lineage: "Early 4th-century Christogram; imperial use from Constantine",
    region: "Roman Empire, then global",
    era: "Attested from the early 4th century",
    intent: ["confession", "victory", "Christ present"],
    meaning:
      "The monogram ☩-like overlay of the Greek letters chi (Χ) and rho (Ρ), the first letters of ΧΡΙΣΤΟΣ (Christ): a name-sign rather than an image.",
    history:
      "Lactantius records that Constantine's soldiers marked their shields with the sign before the Battle of the Milvian Bridge (312 CE); the labarum standard made it imperial. It remains one of the oldest Christian signs with a firm literary attestation.",
    whenUsed: "Confessional marking, church dedications, vestments and books.",
    whereUsed: "Shields and standards in antiquity; church fronts, books and jewelry since.",
    orientation: { default: "upright" },
    strokeOrder: [
      "Rho: vertical stroke, top to bottom",
      "Rho: the bowl, drawn from the top of the stroke",
      "Chi: first diagonal, upper-left to lower-right",
      "Chi: second diagonal, upper-right to lower-left",
    ],
    animationType: "draw",
    animationParams: { speed: 1.05, direction: "monogram" },
    sources: [{ id: "lactantius-315" }],
    zoneRules: {
      pendant: rule("allowed", "Chi-rho pendants are documented from late antiquity onward."),
    },
    accessibilityLabel: "the chi-rho monogram, two Greek letters overlaid",
    confidence: "high",
  }),

  symbol({
    id: "ichthys",
    name: "Ichthys (Fish)",
    traditions: ["christian"],
    lineage: "Early Christian acrostic sign, attested in catacomb art and literature",
    region: "Roman Empire",
    era: "Attested 2nd–3rd century",
    intent: ["confession", "recognition", "baptism"],
    meaning:
      "A fish drawn in two arcs. The Greek word for fish (ΙΧΘΥΣ) doubles as an acrostic of 'Jesus Christ, God's Son, Savior' — a confession compressed into a sign.",
    history:
      "The fish appears in catacomb art and Clement of Alexandria (c. 200) recommends it among signs Christians may use. Its role as a covert recognition mark is traditional; the acrostic is documented.",
    whenUsed: "Confession and identity; historically also baptismal imagery ('little fish' born in water).",
    whereUsed: "Catacomb frescoes, seals and rings in antiquity; bumper stickers and jewelry in modernity.",
    orientation: { default: "upright", notes: "Conventionally drawn facing the viewer's right." },
    strokeOrder: [
      "Upper arc from nose to tail, one stroke",
      "Lower arc returning to the nose, completing the body and tail in one continuous line",
    ],
    animationType: "draw",
    animationParams: { speed: 1.1, direction: "one-stroke" },
    sources: [{ id: "clement-200" }],
    zoneRules: {
      pendant: rule("allowed", "Fish rings and pendants are attested from antiquity."),
    },
    accessibilityLabel: "a simple fish outline drawn in two arcs",
    confidence: "high",
  }),

  symbol({
    id: "shield-of-the-trinity",
    name: "Shield of the Trinity (Scutum Fidei)",
    traditions: ["christian"],
    lineage: "13th-century didactic diagram in manuscripts and heraldry",
    region: "Western Europe",
    era: "Attested from the 13th century",
    intent: ["doctrine", "teaching", "the triune name"],
    meaning:
      "A triangular arrangement of three circles — Father, Son, Spirit — each connected to a central 'God' circle by links reading 'is', while the outer circles connect to each other by links reading 'is not': a geometry of trinitarian doctrine.",
    history:
      "The scutum fidei survives in 13th-century manuscripts and English and French heraldry as a teaching diagram. It is a model, not a liturgical object, and theologians have long noted that any diagram of the Trinity simplifies the doctrine it serves.",
    whenUsed: "Teaching, catechesis, heraldic decoration.",
    whereUsed: "Manuscript margins, stained glass, sermons and study.",
    orientation: { default: "upright" },
    strokeOrder: [
      "Three outer circles: top, then lower-left, then lower-right",
      "The three connecting links between outer circles",
      "The central circle ('Deus')",
      "The three links from center to each outer circle",
    ],
    animationType: "weave",
    animationParams: { overUnder: true, strandWidth: 0.035, passes: 3 },
    contested: true,
    competingInterpretations: [
      "Medieval use: a faithful didactic summary of the Athanasian creed's logic.",
      "Theological caution: the diagram is a human model that tends toward modalism if read too literally; it is presented here as teaching art, not doctrine itself.",
    ],
    sources: [{ id: "scutum-tradition" }],
    zoneRules: {},
    accessibilityLabel:
      "three circles joined around a central circle by labeled links, a diagram of the Trinity",
    confidence: "medium",
  }),
];
