/**
 * data/symbols/dharmic.js — 8 of 40 v1 symbols (spec §4).
 * Hindu (4) + Buddhist (4). Respect conventions (elevation, floor
 * avoidance) are recorded as convention, not enforced as moral judgment.
 */
import { symbol, rule } from "./_common.js";

export const HINDU_SYMBOLS = [
  symbol({
    id: "om",
    name: "Om (Aum)",
    traditions: ["hindu"],
    lineage: "Vedic sacred syllable; Upanishadic analysis (Mandukya) central to its theology",
    region: "South Asia, then global",
    era: "Vedic antiquity; continuous use to the present",
    intent: ["primordial sound", "beginning", "the whole of consciousness"],
    meaning:
      "The syllable AUM: three sounds plus silence, mapped by the Mandukya Upanishad onto waking, dreaming, deep sleep and what lies beyond. It opens and closes prayer across Hindu traditions and appears in Buddhist and Jain practice too.",
    history:
      "Om is among the best-attested sacred syllables on earth, analyzed textually since the Upanishads and studied comparatively by Eliade. It is simultaneously a phonetic fact, a theological argument and a devotional practice; the codex treats it as text, not decoration.",
    whenUsed: "Opening and closing mantras, meditation, consecration, written at the head of documents.",
    whereUsed: "Shrines, thresholds, manuscripts, worn as reminders.",
    orientation: { default: "upright", notes: "The Devanagari glyph has a fixed upright orientation." },
    strokeOrder: [
      "Lower bowl of the 'a' curve",
      "Upper bowl flowing into the 'u' curve",
      "The tail sweeping right",
      "The crescent of the 'm' above",
      "The dot (bindu) placed last",
    ],
    animationType: "brush",
    animationParams: { speed: 0.75, pressure: "calligraphic", direction: "ltr", flourish: "bindu-last" },
    caution:
      "A sacred syllable shared by Hindu, Buddhist and Jain communities. Treat it as you would scripture: kept elevated and clean, not placed underfoot.",
    sources: [{ id: "mandukya-upanishad" }, { id: "eliade-1958" }],
    zoneRules: {
      floor: rule(
        "forbidden",
        "Sacred syllables are kept off the floor and away from feet and shoes in the conventions of the traditions that honor them.",
      ),
      "high-wall": rule(
        "allowed",
        "Elevated placement follows the convention of keeping sacred signs above ordinary reach.",
        { heightRule: "above eye level" }
      ),
      pendant: rule("allowed", "Om pendants are common devotional jewelry; the respect conventions travel with the object."),
    },
    accessibilityLabel: "the Devanagari syllable Om with its crescent and dot",
    confidence: "high",
  }),

  symbol({
    id: "sri-yantra",
    name: "Sri Yantra",
    traditions: ["hindu"],
    lineage: "Sri Vidya tradition; the hymn Saundarya Lahari is closely associated with its worship",
    region: "South Asia",
    era: "Textual attestation in the first millennium CE; living practice since",
    intent: ["contemplation", "the goddess as geometry", "center"],
    meaning:
      "Nine interlocking triangles — four pointing up (Shiva), five down (Shakti) — radiating from a central point (bindu) through lotus petals and gates: a machine for contemplation in which the geometry itself is the teaching.",
    history:
      "The Sri Yantra is the central diagram of Sri Vidya, discussed in texts such as the Saundarya Lahari (attributed to Shankaracharya; attribution and dating debated among scholars). Constructing the nine-triangle interlock precisely is a documented practice in itself.",
    whenUsed: "Meditation and puja in Sri Vidya lineages; contemplative focus on shrines.",
    whereUsed: "Shrine centers, meditation halls, temple floors in documented cases.",
    orientation: { default: "upright", notes: "One triangle in the set points precisely upward; orientation matters to the construction." },
    strokeOrder: [
      "Outer square gates, drawn from the outside in",
      "Lotus petal rings, petal by petal",
      "The nine triangles, drawn outermost first",
      "The bindu: a single point placed last",
    ],
    animationType: "draw",
    animationParams: { speed: 0.6, direction: "outer-to-bindu", gap: 0.05 },
    sources: [{ id: "saundarya-lahari" }, { id: "zimmer-1946" }],
    zoneRules: {
      "altar-center": rule(
        "allowed",
        "The yantra is designed to be the contemplative center of a shrine.",
        { heightRule: "on the altar surface" }
      ),
      floor: rule(
        "warned",
        "While some temple floors bear yantra diagrams, household convention in most lineages keeps the worship yantra elevated.",
      ),
    },
    accessibilityLabel: "nine interlocking triangles radiating from a central point through lotus rings",
    confidence: "medium",
  }),

  symbol({
    id: "swastika",
    name: "Swastika",
    traditions: ["hindu", "buddhist"],
    lineage: "Pan-Asian well-being sign of several millennia; documented across Eurasia long before the 20th century",
    region: "India and across Eurasia",
    era: "Attested for at least four millennia across Eurasia",
    intent: ["well-being", "auspiciousness", "the turning sun"],
    meaning:
      "The Sanskrit svastika means 'conducive to well-being'. A right-facing hooked cross marking thresholds, accounts and ceremonies across Hindu, Buddhist and Jain life: one of the most widely used auspicious signs in human history.",
    history:
      "Thomas Wilson's Smithsonian study (1894) documented the swastika's ancient, worldwide life as a well-being sign. In the 20th century the Nazi movement appropriated a rotated, usually 45°-tilted form (the Hakenkreuz) and attached to it an ideology of hatred. Dharmic communities have repeatedly and publicly distinguished their swastika from the Hakenkreuz; the two differ in orientation, context and meaning, and this codex presents the Dharmic sign in its own documented life.",
    whenUsed: "Thresholds at festivals, ledgers at new years, wedding and ceremony markings.",
    whereUsed: "Doorways, floors at rites, calendars, temples and home shrines.",
    orientation: { default: "upright", notes: "Conventionally right-facing and level in Hindu use; the Nazi Hakenkreuz is the tilted, black-on-white form, and is a different sign in practice." },
    strokeOrder: [
      "Horizontal arm, left to right",
      "Vertical arm, top to bottom",
      "Upper-right hook",
      "Lower-right hook",
      "Lower-left hook",
      "Upper-left hook",
      "Optional four dots, one in each quadrant",
    ],
    animationType: "draw",
    animationParams: { speed: 1.0, direction: "arms-then-hooks", flourish: "dots-last" },
    contested: true,
    competingInterpretations: [
      "Dharmic reading (the majority of the sign's history): well-being, auspiciousness, the sun's turning.",
      "20th-century European appropriation: the Nazi Hakenkreuz — a different orientation and context, rejected by Dharmic communities and recorded here only to keep the two signs distinct.",
    ],
    caution:
      "This entry deliberately distinguishes the swastika from the Nazi Hakenkreuz. In Western public display the conflation risk is real; the placement notes below describe that consequence without moralizing, and without conceding the sign's Dharmic meaning.",
    sources: [{ id: "wilson-1894" }, { id: "zimmer-1946" }],
    zoneRules: {
      "above-door": rule(
        "allowed",
        "Marking thresholds is the sign's documented home function in Hindu household practice.",
        { traditionScope: "hindu" }
      ),
      "high-wall": rule(
        "warned",
        "In Western public-facing spaces, non-Dharmic viewers commonly misread this sign as the Nazi Hakenkreuz; the note describes that consequence so placement is informed, not forbidden.",
      ),
      pendant: rule(
        "warned",
        "Worn publicly outside Dharmic contexts, the conflation risk described above travels with the wearer.",
      ),
      floor: rule(
        "allowed",
        "Threshold and floor markings at rites are documented practice in the traditions that use the sign.",
        { traditionScope: "hindu" }
      ),
    },
    accessibilityLabel: "a right-facing hooked cross, the auspicious swastika",
    confidence: "high",
  }),

  symbol({
    id: "trishula",
    name: "Trishula",
    traditions: ["hindu"],
    lineage: "Attribute of Shiva, documented in Shaiva iconography across South and Southeast Asia",
    region: "South and Southeast Asia",
    era: "Attested across the first millennium CE and living today",
    intent: ["the threefold", "transformation", "Shiva's sovereignty"],
    meaning:
      "Shiva's trident: the three prongs read variously as creation-preservation-dissolution, the three gunas, or past-present-future — a threefold totality held in one hand.",
    history:
      "The trishula is among Shiva's defining attributes in documented iconography, studied by Zimmer among others. Temples plant it as a standard; Shaiva marks draw it as a sectarian sign.",
    whenUsed: "Shaiva worship, temple standards, sectarian marks.",
    whereUsed: "Temples, shrine images, processional standards.",
    orientation: { default: "upright" },
    strokeOrder: [
      "Central shaft, bottom to top",
      "Center prong, straight up",
      "Left prong curving outward and up",
      "Right prong curving outward and up",
    ],
    animationType: "draw",
    animationParams: { speed: 0.95, direction: "bottom-up" },
    sources: [{ id: "zimmer-1946" }],
    zoneRules: {
      "altar-center": rule("allowed", "A deity's attribute may hold the altar's center in Shaiva practice.", {
        traditionScope: "hindu",
      }),
    },
    accessibilityLabel: "a trident, the attribute of Shiva",
    confidence: "high",
  }),
];

export const BUDDHIST_SYMBOLS = [
  symbol({
    id: "dharma-wheel",
    name: "Dharma Wheel (Dharmachakra)",
    traditions: ["buddhist"],
    lineage: "Early Buddhist emblem; the wheel of teaching set turning at Sarnath",
    region: "Across the Buddhist world",
    era: "Attested from early Buddhist art (Ashokan pillars, c. 3rd century BCE)",
    intent: ["the teaching", "the eightfold path", "turning"],
    meaning:
      "An eight-spoked wheel: the eight spokes for the Noble Eightfold Path, the rim for mindfulness, the hub for discipline. 'Turning the wheel' is to teach the Dharma.",
    history:
      "The dharmachakra appears on the capitals of Ashoka's pillars and has remained a pan-Buddhist emblem since; Beer documents its Tibetan readings among the eight auspicious signs.",
    whenUsed: "Teaching occasions, shrine ornament, the Dharmachakra mudra in images.",
    whereUsed: "Stupas, temple roofs, shrine rooms, flags.",
    orientation: { default: "rotatable", notes: "Conventionally shown spoke-up; the form is rotationally symmetric." },
    strokeOrder: [
      "Rim, drawn as one circle from the top",
      "Hub, drawn second",
      "Eight spokes, drawn clockwise from the top",
    ],
    animationType: "particles",
    animationParams: { mode: "rotating-loop", rpm: 2, particles: 16, trail: 0.25, spokes: 8 },
    sources: [{ id: "beer-2003" }],
    zoneRules: {
      "high-wall": rule(
        "allowed",
        "The wheel presides over many shrine and temple spaces from a raised position.",
        { heightRule: "above eye level" }
      ),
    },
    accessibilityLabel: "an eight-spoked wheel, emblem of the Buddhist teaching",
    confidence: "high",
  }),

  symbol({
    id: "endless-knot",
    name: "Endless Knot",
    traditions: ["buddhist"],
    lineage: "One of the eight auspicious signs (ashtamangala), documented across Buddhist Asia",
    region: "Tibet, China, Mongolia and beyond",
    era: "Attested across many centuries of Buddhist art",
    intent: ["interdependence", "longevity", "the mind unbroken"],
    meaning:
      "A closed lattice knot with no beginning and no end: the interdependence of all things, the endless cycle of cause and effect, and the wisdom that sees through it.",
    history:
      "The endless knot is among the eight auspicious signs documented by Beer and appears on monastery doors, textiles and offerings across Buddhist Asia.",
    whenUsed: "Auspicious occasions, gifts, monastery doors and throne ornament.",
    whereUsed: "Textiles, door panels, shrine offerings.",
    orientation: { default: "upright" },
    strokeOrder: [
      "The knot's outer frame, drawn as one continuous strand",
      "The strand crosses itself: over at the corners",
      "Under at the center crossings",
      "Closing where it began",
    ],
    animationType: "weave",
    animationParams: { overUnder: true, strandWidth: 0.045, passes: 1 },
    sources: [{ id: "beer-2003" }],
    zoneRules: {
      pendant: rule("allowed", "Endless-knot pendants and protection cords are common."),
    },
    accessibilityLabel: "a closed lattice knot with no beginning or end",
    confidence: "high",
  }),

  symbol({
    id: "lotus",
    name: "Lotus (Padma)",
    traditions: ["buddhist", "hindu"],
    lineage: "Pan-Asian sacred flower; among the eight auspicious signs in Buddhism",
    region: "South, Southeast and East Asia",
    era: "Attested across millennia of Asian art",
    intent: ["purity", "emergence", "unsoiled by the mud it rises from"],
    meaning:
      "The lotus rises through mud and water to open clean above the surface: the classic emblem of awakening — Buddha-nature unsoiled by what it grows through.",
    history:
      "The lotus appears as seat, offering and emblem across Buddhist and Hindu art; Beer documents its colors and petal counts among the eight auspicious signs. Buddhas and bodhisattvas are conventionally seated or standing on lotus thrones.",
    whenUsed: "Offerings, shrine seating imagery, contemplation of emergence.",
    whereUsed: "Shrines, temple pools, thangka painting.",
    orientation: { default: "upright", notes: "Blooms upward; the open flower is the convention." },
    strokeOrder: [
      "Center petal, drawn upward",
      "Inner petal pair, left then right",
      "Outer petal pair, left then right",
      "The base leaves: two strokes cradling the flower",
    ],
    animationType: "draw",
    animationParams: { speed: 0.7, direction: "bloom", flourish: "petals-staged" },
    sources: [{ id: "beer-2003" }, { id: "zimmer-1946" }],
    zoneRules: {
      floor: rule(
        "warned",
        "Lotus pedestals seat images of the Buddha; a loose lotus sign on the floor sits oddly against that convention, though floor lotus carpets are documented in temples.",
      ),
    },
    accessibilityLabel: "an open lotus flower above two leaves",
    confidence: "high",
  }),

  symbol({
    id: "unalome",
    name: "Unalome",
    traditions: ["buddhist"],
    lineage: "Thai Buddhist temple and sak yant tattoo tradition; claimed earlier origins",
    region: "Thailand and Southeast Asia",
    era: "Attested in Thai art and tattoo practice; deeper antiquity claimed but not securely documented",
    intent: ["the path to awakening", "from wandering to stillness"],
    meaning:
      "A line that begins in spirals or zigzags, straightens, and ends in a dot: the path from wandering toward straightening insight and final stillness.",
    history:
      "The unalome is genuinely present in Thai temple ornament and sak yant tattoo practice, and its popularity in global tattoo culture now outruns documentation of its earlier history. Claims of ancient canonical origin circulate widely but are not securely sourced; the codex marks this honestly rather than settling the question.",
    whenUsed: "Tattoo practice and personal reminders of the path; temple ornament.",
    whereUsed: "Body, temple art, small plaques.",
    orientation: { default: "upright", notes: "The straightening line rises toward the dot." },
    strokeOrder: [
      "The base spiral, unwinding",
      "The zigzag ascent, three bends",
      "The straightening line rising",
      "The point at the summit, placed last",
    ],
    animationType: "draw",
    animationParams: { speed: 0.8, direction: "base-to-summit" },
    openStatus: "unverified",
    statusSource:
      "Attested in Thai temple art and sak yant practice; claims of deeper antiquity circulate but are not securely documented.",
    contested: true,
    competingInterpretations: [
      "Devotional reading: an ancient Buddhist path symbol.",
      "Documented position: attested in Thai temple and tattoo tradition; its deeper antiquity is claimed but not securely sourced, and its global tattoo popularity is recent.",
    ],
    sources: [{ id: "thai-temple-tradition" }],
    zoneRules: {
      pendant: rule("allowed", "Common as a small path-reminder pendant and tattoo."),
    },
    accessibilityLabel: "a winding line that straightens and ends in a single dot",
    confidence: "low",
  }),
];
