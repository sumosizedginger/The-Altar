/**
 * data/symbols/celtic.js — 7 of 40 v1 symbols (spec §4).
 * Celtic tradition. Attestation dates are stated honestly; popular
 * "ancient meaning" claims are flagged as later readings.
 */
import { symbol, rule } from "./_common.js";

export const CELTIC_SYMBOLS = [
  symbol({
    id: "triskelion",
    name: "Triskelion (Triple Spiral)",
    traditions: ["celtic"],
    lineage: "Neolithic megalithic carving → insular Celtic art → modern Celtic revival",
    region: "Ireland, Isle of Man, Brittany",
    era: "Carved from c. 3200 BCE (Newgrange kerbstone K1); symbolic readings are much later",
    intent: ["movement", "cycles", "perseverance"],
    meaning:
      "Three interlocking spirals turning around a shared center. Commonly read today as motion, continuity and cyclical renewal — land, sea and sky in some modern tellings.",
    history:
      "The triple spiral is one of the oldest carved motifs in Atlantic Europe, most famously on kerbstone K1 at Newgrange (c. 3200 BCE), and it reappears in insular Christian art. Its meaning in prehistory is not recorded; the popular symbolic readings are modern, built on the motif's documented survival.",
    whenUsed:
      "Modern Celtic spirituality and jewelry; decorative carving referencing megalithic heritage.",
    whereUsed: "Pendants and brooches; shrine stones; manuscript-inspired artwork.",
    orientation: { default: "rotatable", notes: "Threefold rotational symmetry; any orientation is aligned with convention." },
    strokeOrder: [
      "First spiral: unwind outward from the center",
      "Second spiral: rotate 120°, unwind outward",
      "Third spiral: rotate 240°, unwind outward",
    ],
    animationType: "draw",
    animationParams: { speed: 0.85, direction: "outward", gap: 0.15 },
    contested: true,
    competingInterpretations: [
      "Popular modern reading: three realms (land/sea/sky) or perpetual motion of the seasons.",
      "Archaeological position: the motif is well attested as decoration, but no recorded prehistoric meaning survives; symbolic readings are honest modern constructions.",
    ],
    sources: [
      { id: "newgrange-site" },
      { id: "aldhouse-green-2004" },
      { id: "cooper-1978" },
    ],
    zoneRules: {
      pendant: rule("allowed", "Small spiral pendants are a documented form of modern Celtic jewelry."),
    },
    accessibilityLabel: "three interlocking spirals turning around one center",
    confidence: "medium",
  }),

  symbol({
    id: "triquetra",
    name: "Triquetra",
    traditions: ["celtic"],
    lineage: "Insular manuscript ornament (Book of Kells, c. 800 CE) → later Christian and modern Celtic use",
    region: "Ireland and Britain",
    era: "Attested in insular art from c. 800 CE; widespread symbolic use is modern",
    intent: ["unity", "continuity", "threefold mysteries"],
    meaning:
      "A single strand woven through three interlaced arcs with no beginning and no end. Read today as continuity and threefold unity.",
    history:
      "The triquetra appears as interlace ornament in insular manuscripts such as the Book of Kells. Its identification as a deliberate symbol with fixed meaning post-dates the manuscripts; Christian trinity readings and modern Celtic readings both came later.",
    whenUsed: "Celtic-Christian and modern Celtic jewelry; wedding and vow rings; manuscript-inspired art.",
    whereUsed: "Rings and pendants; carved stones; altar plaques in Celtic-inspired practice.",
    orientation: { default: "upright", notes: "Typically shown with one lobe uppermost." },
    strokeOrder: [
      "Single continuous strand: enter at the top lobe",
      "Pass over-under through the right lobe",
      "Pass under-over through the left lobe, closing the weave",
    ],
    animationType: "weave",
    animationParams: { overUnder: true, strandWidth: 0.045, passes: 1 },
    contested: true,
    competingInterpretations: [
      "Popular reading: an ancient Celtic trinity or eternity knot.",
      "Documented position: attested as insular interlace ornament; fixed symbolic meanings are later attributions that honest sources date plainly.",
    ],
    sources: [{ id: "henry-1974" }, { id: "book-of-kells-ms" }, { id: "aldhouse-green-2004" }],
    zoneRules: {
      pendant: rule("allowed", "One of the most common forms of Celtic jewelry."),
    },
    accessibilityLabel: "a three-lobed knot drawn with one unbroken strand",
    confidence: "medium",
  }),

  symbol({
    id: "dara-knot",
    name: "Dara Knot",
    traditions: ["celtic"],
    lineage: "Modern design (20th century) inspired by the root system of the oak (Irish: dair)",
    region: "Ireland (concept); worldwide modern use",
    era: "Modern; no pre-modern exemplar identified",
    intent: ["strength", "roots", "endurance"],
    meaning:
      "Interwoven lines evoking the root system of an oak. Read as inner strength and deep-rootedness, after the oak's standing in Irish tradition.",
    history:
      "The Dara Knot is a modern knotwork design whose imagery is drawn from oak roots; the oak itself is genuinely significant in Irish language and lore (dair). No ancient artifact of this specific knot is documented, and entries in this codex say so rather than implying antiquity.",
    whenUsed: "Modern Celtic jewelry and devotional art; strength-focused personal dedications.",
    whereUsed: "Pendants, plaques and carved keepsakes.",
    orientation: { default: "upright" },
    strokeOrder: [
      "Central root column, drawn downward",
      "First root pair branching outward and interlacing",
      "Second root pair crossing beneath, closing the knot",
    ],
    animationType: "weave",
    animationParams: { overUnder: true, strandWidth: 0.05, passes: 2 },
    contested: true,
    competingInterpretations: [
      "Folk claim encountered in commerce: that the knot is an ancient druidic design.",
      "Documented position: a 20th-century design inspired by oak-root imagery; meaningful to users, but not ancient.",
    ],
    sources: [{ id: "aldhouse-green-2004" }],
    zoneRules: {},
    accessibilityLabel: "an interlaced knot resembling oak roots",
    confidence: "low",
  }),

  symbol({
    id: "brigids-cross",
    name: "Brigid's Cross",
    traditions: ["celtic"],
    lineage: "Irish rush-weaving folk custom, documented early modern period; continues today",
    region: "Ireland",
    era: "Documented folk practice from the early modern period onward; practiced every 1 February",
    intent: ["protection", "household blessing", "seasonal renewal"],
    meaning:
      "A four-armed equal-armed cross woven from rushes or straw, made on St Brigid's Day (1 February, the old feast of Imbolc) and hung in the home for the year's protection.",
    history:
      "Making Brigid's crosses from rushes is a documented Irish household custom recorded by folk-life scholars such as E. Estyn Evans. Whether it descends from pre-Christian practice is discussed by historians and not settled; the custom itself is well attested either way.",
    whenUsed: "Woven afresh each 1 February; the previous year's cross is traditionally removed.",
    whereUsed: "Hung above doors, in rafters, or kept in the home's central room.",
    orientation: { default: "upright", notes: "Woven flat; hung with arms square to the doorway." },
    strokeOrder: [
      "Fold the first rush over the center",
      "Rotate 90°, add and fold the second rush",
      "Continue rotating and folding until four arms stand even",
      "Bind the four arm-tips to finish",
    ],
    animationType: "weave",
    animationParams: { overUnder: true, strandWidth: 0.06, passes: 4, weavePattern: "radial-fold" },
    contested: true,
    competingInterpretations: [
      "Christian reading: a cross of St Brigid of Kildare blessing the household.",
      "Folk-historical reading: a seasonal craft with possible pre-Christian roots; historians (e.g. Hutton) note the evidence does not settle the descent.",
    ],
    sources: [{ id: "evans-1957" }, { id: "hutton-1996" }],
    zoneRules: {
      "above-door": rule(
        "allowed",
        "Hanging the rush cross above the door or in the rafters is the documented folk placement.",
        { heightRule: "lintel height, arms square" }
      ),
      hearth: rule(
        "allowed",
        "The hearth side is a traditional spot for the cross in some counties.",
      ),
    },
    accessibilityLabel: "a four-armed cross woven from rushes",
    confidence: "high",
  }),

  symbol({
    id: "celtic-cross",
    name: "Celtic (High) Cross",
    traditions: ["celtic", "christian"],
    lineage: "Irish and British stone high crosses, 9th–11th centuries CE",
    region: "Ireland, Scotland, northern England",
    era: "Great high crosses c. 800–1000 CE; revival from the 19th century",
    intent: ["faith", "memorial", "threshold between worlds"],
    meaning:
      "A Latin cross with a ring at the crossing. The great carved high crosses stood as scripture in stone; the ring is popularly read as halo or sun, and possibly as structural engineering.",
    history:
      "The monumental high crosses of Ireland and Britain rank among the masterworks of early medieval Christian art, studied since Françoise Henry. Modern revivals use the form for memorials and jewelry; the ring's origin is genuinely debated between symbolic and structural explanations.",
    whenUsed: "Memorial and churchyard monuments; personal devotion in Celtic Christian revival.",
    whereUsed: "Churchyards, roadside sites, homes and graves in the revival period.",
    orientation: { default: "upright" },
    strokeOrder: [
      "Vertical shaft, bottom to top",
      "Crossbar, left to right",
      "Ring around the crossing, clockwise",
      "Optional interlace panel revealed last",
    ],
    animationType: "weave",
    animationParams: { overUnder: true, strandWidth: 0.05, passes: 2 },
    contested: true,
    competingInterpretations: [
      "Popular reading: the ring represents the sun or a halo, uniting old and new faith.",
      "Structural reading: the ring may primarily brace long stone arms; the symbolic reading is not documented from the period itself.",
    ],
    caution:
      "The Celtic cross is a Christian monument first. It has occasionally been misappropriated by white-nationalist groups; the symbol itself carries no such meaning, and this codex presents the documented monument tradition.",
    sources: [{ id: "henry-1940" }, { id: "koch-1923" }],
    zoneRules: {
      "high-wall": rule(
        "allowed",
        "High crosses preside over space; a wall placement echoes the monument tradition.",
        { heightRule: "above eye level" }
      ),
      floor: rule(
        "forbidden",
        "Setting the cross on the floor is outside convention in the traditions that honor it.",
      ),
      pendant: rule("allowed", "Small Celtic-cross pendants are a documented revival form."),
    },
    accessibilityLabel: "a tall cross with a ring around its crossing, carved with knotwork",
    confidence: "high",
  }),

  symbol({
    id: "awen",
    name: "Awen (/|\\)",
    traditions: ["celtic"],
    lineage: "Documented from the writings of Iolo Morganwg (18th century); standard in modern Druidry",
    region: "Wales (origin of the glyph as documented)",
    era: "Documented 18th century; presented by its author as ancient",
    intent: ["inspiration", "poetic fire", "illumination"],
    meaning:
      "Three straight rays converging inside a circle or between two outer rays: /|\\. 'Awen' is Welsh for inspiration, understood in Druid revival as the descending spark of illumination.",
    history:
      "The glyph's documented origin is the bardic material of Edward Williams (Iolo Morganwg), published as Barddas in 1862. Iolo presented his material as ancient; modern scholarship treats the awen glyph as his 18th-century creation, which has since become genuinely central to Druid practice.",
    whenUsed: "Druid ritual openings and closings; poetry and music dedications.",
    whereUsed: "Grove altars, bardic circles, jewelry.",
    orientation: { default: "upright", notes: "The three rays point upward; inverting is outside convention." },
    strokeOrder: [
      "Left outer ray, top to bottom",
      "Right outer ray, top to bottom",
      "Center ray, top to bottom",
      "Enclosing circle (if present), from the top",
    ],
    animationType: "draw",
    animationParams: { speed: 1.0, direction: "top-down", gap: 0.2 },
    contested: true,
    competingInterpretations: [
      "Revival tradition: a recovered sign of ancient bardic illumination.",
      "Historical scholarship: documented as an 18th-century composition by Iolo Morganwg; its meaning within modern Druidry is real but modern.",
    ],
    sources: [{ id: "barddas-1862" }, { id: "hutton-2007" }],
    zoneRules: {
      pendant: rule("allowed", "Common as a bardic/Druid identity pendant."),
    },
    accessibilityLabel: "three converging rays of light inside a circle",
    confidence: "medium",
  }),

  symbol({
    id: "spiral-tree-of-life",
    name: "Spiral Tree of Life",
    traditions: ["celtic"],
    lineage: "Modern Celtic revival design drawing on megalithic spiral and insular tree vocabulary",
    region: "Ireland and Britain (modern revival)",
    era: "Modern; no pre-modern exemplar of the combined form identified",
    intent: ["growth", "ancestry", "connection of worlds"],
    meaning:
      "A tree whose trunk or branches unwind as spirals: roots below, crown above, turning growth between them. Read as the link between underworld, middle world and sky.",
    history:
      "Trees are genuinely significant in Irish tradition (the oak among the sacred trees), and spirals are genuinely ancient; the specific combined 'spiral tree' form is a modern revival design. This codex presents it as such, without implying an ancient exemplar.",
    whenUsed: "Ancestor and seasonal veneration in Celtic-inspired practice; household art.",
    whereUsed: "Wall plaques and altar backdrops; carved wood panels.",
    orientation: { default: "upright" },
    strokeOrder: [
      "Root spiral, unwinding downward",
      "Trunk drawn upward through the center",
      "Crown spirals, three branches unfurling outward",
    ],
    animationType: "draw",
    animationParams: { speed: 0.7, direction: "root-to-crown", gap: 0.1 },
    openStatus: "unverified",
    statusSource:
      "No pre-modern exemplar of the combined spiral-tree form identified; attested only in modern revival work.",
    contested: true,
    competingInterpretations: [
      "Revival reading: an ancient Celtic cosmogram of the world tree.",
      "Documented position: a modern design built from genuinely ancient motif families.",
    ],
    sources: [{ id: "newgrange-site" }, { id: "aldhouse-green-2004" }],
    zoneRules: {
      "high-wall": rule(
        "allowed",
        "A wall placement suits the form's function as a room's presiding image.",
        { heightRule: "above eye level" }
      ),
    },
    accessibilityLabel: "a tree whose branches and roots curl into spirals",
    confidence: "low",
  }),
];
