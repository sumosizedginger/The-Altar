/**
 * data/tools.js
 * Symbols & Sigils — The Living Altar (v3)
 *
 * The 13 ritual tools of v1 (spec minimum: 12). Each carries a
 * synthesized-sound cue description used later by the Web Audio engine —
 * every sound is generated in code; no audio files are shipped.
 */

export const TOOLS = [
  {
    id: "candle",
    name: "Candle",
    aka: ["votive", "taper"],
    category: "flame",
    traditions: ["wicca-pagan", "christian", "jewish", "hindu", "buddhist", "celtic"],
    description:
      "A single flame: focus, presence, offering. The most universal altar object across the traditions represented here.",
    whenUsed:
      "Lit to open almost any working; the Shabbat and Hanukkah lights, Advent candles, vigil lights and diya all have their own calendrical logic.",
    caution: "Open flame. Never leave unattended; keep clear of cloth and incense smoke paths.",
    heightClass: "surface",
    sound: {
      type: "flame",
      synth: "filtered noise with slow amplitude LFO; crackle transients from sparse noise bursts",
    },
    accessibilityLabel: "a lit candle, small flame, softly flickering",
  },
  {
    id: "chalice",
    name: "Chalice",
    aka: ["cup", "communion cup"],
    category: "vessel",
    traditions: ["wicca-pagan", "christian"],
    description:
      "A drinking vessel for water, wine or milk. In Wicca it commonly stands for the water element and the receptive principle.",
    whenUsed: "Libations, shared toasts at sabbats, eucharistic memory in Christian context.",
    caution: null,
    heightClass: "surface",
    sound: {
      type: "pour",
      synth: "band-passed noise with descending center frequency envelope (liquid)",
    },
    accessibilityLabel: "a standing chalice, open cup on a stem",
  },
  {
    id: "water-bowl",
    name: "Water Bowl",
    aka: ["ablution bowl"],
    category: "vessel",
    traditions: ["islamic", "hindu", "buddhist", "wicca-pagan"],
    description:
      "A shallow bowl of clean water for purification, reflection or offering.",
    whenUsed: "Before prayer in many Muslim and Hindu household customs; as a daily offering bowl in Buddhist homes.",
    caution: "Refresh water regularly; standing water is read as neglect in several traditions.",
    heightClass: "surface",
    sound: {
      type: "pour",
      synth: "soft filtered noise swell with a droplet click (short sine blip)",
    },
    accessibilityLabel: "a shallow bowl of still water",
  },
  {
    id: "salt-dish",
    name: "Salt Dish",
    aka: ["salt cellar"],
    category: "vessel",
    traditions: ["wicca-pagan", "christian"],
    description:
      "A small dish of salt: preservation, earth, covenant. In Wiccan directional work it anchors the north quarter.",
    whenUsed: "Circle casting in Wicca; historically blessed salt in Christian practice.",
    caution: null,
    heightClass: "surface",
    sound: {
      type: "granular",
      synth: "very short filtered noise grains, randomized spacing (salt falling)",
    },
    accessibilityLabel: "a small dish of white salt",
  },
  {
    id: "incense-burner",
    name: "Incense Burner",
    aka: ["censer", "koro"],
    category: "censer",
    traditions: ["buddhist", "hindu", "christian", "wicca-pagan"],
    description:
      "Smoke offering: resin, stick or cone incense carried upward. Central to Buddhist and Hindu household shrines.",
    whenUsed: "Daily shrine offerings, processions, opening of formal practice.",
    caution: "Ventilate; embers remain hot long after visible flame is gone.",
    heightClass: "surface",
    sound: {
      type: "smoke",
      synth: "long-release filtered noise, very quiet, slow high-frequency shimmer",
    },
    accessibilityLabel: "a censer with a thin ribbon of smoke rising",
  },
  {
    id: "bell",
    name: "Bell",
    aka: ["altar bell"],
    category: "sound",
    traditions: ["wicca-pagan", "christian", "buddhist", "hindu"],
    description:
      "A hand bell marking openings, closings and transitions. Its strike defines the edge between ordinary and ritual time.",
    whenUsed: "To open and close workings; at consecration moments; before mantra in some Hindu practice.",
    caution: null,
    heightClass: "surface",
    sound: {
      type: "bell",
      synth: "inharmonic partials (1, 2.4, 3.0, 4.2 ratios) with exponential decay",
    },
    accessibilityLabel: "a small hand bell with a wooden handle",
  },
  {
    id: "singing-bowl",
    name: "Singing Bowl",
    aka: ["standing bell"],
    category: "sound",
    traditions: ["buddhist", "hindu"],
    description:
      "A rim-struck or rim-rubbed bowl sustaining a long tone. Used for meditation timing and as shrine sound.",
    whenUsed: "Beginning seated meditation; marking intervals of silence.",
    caution: "Commercial 'Tibetan' bowls vary widely; documented liturgical use is narrower than retail marketing suggests.",
    heightClass: "surface",
    sound: {
      type: "bowl",
      synth: "two close detuned partials beating slowly, long exponential release",
    },
    accessibilityLabel: "a bronze bowl, mallet resting beside it",
  },
  {
    id: "wand",
    name: "Wand",
    aka: ["rod"],
    category: "wand",
    traditions: ["wicca-pagan"],
    description:
      "A directing tool for intention and invocation. In most Wiccan lineages it corresponds to air (some to fire) and to the east (or south) quarter.",
    whenUsed: "Casting circles, invoking quarters, directing energy in ceremonial work.",
    caution: null,
    heightClass: "surface",
    sound: {
      type: "swish",
      synth: "brief band-passed noise sweep, rising then falling center frequency",
    },
    accessibilityLabel: "a slender wooden wand",
  },
  {
    id: "feather",
    name: "Feather",
    aka: ["smudge feather", "air wand"],
    category: "wand",
    traditions: ["wicca-pagan", "celtic"],
    description:
      "A feather for moving air and smoke — fanning incense or guiding cleansing smoke. Treated as a gift object in many lineages.",
    whenUsed: "Smoke cleansing; air-element work; feathering flame.",
    caution:
      "Feather practice is shared across many cultures; entries avoid prescribing styles that belong to specific Indigenous nations.",
    heightClass: "surface",
    sound: {
      type: "swish",
      synth: "soft high-passed noise puff with slow attack",
    },
    accessibilityLabel: "a single long feather",
  },
  {
    id: "stone",
    name: "Stone",
    aka: ["standing stone", "altar stone"],
    category: "natural",
    traditions: ["celtic", "wicca-pagan"],
    description:
      "An unhewn or lightly shaped stone: earth, memory, standing. Echoes the megalithic landscape without imitating it.",
    whenUsed: "Grounding anchor for an altar; quarter stones in some Wiccan practice.",
    caution: null,
    heightClass: "surface",
    sound: {
      type: "stone",
      synth: "low thump: short sine at 60–90 Hz with fast decay plus a noise click",
    },
    accessibilityLabel: "a smooth grey stone",
  },
  {
    id: "cloth",
    name: "Altar Cloth",
    aka: ["fair linen"],
    category: "textile",
    traditions: ["christian", "wicca-pagan", "islamic", "jewish"],
    description:
      "The linen that defines the altar surface. In Christian usage the fair linen; in other traditions any clean, dedicated cloth.",
    whenUsed: "Laid first when opening an altar; removed and stored with care.",
    caution: null,
    heightClass: "surface",
    sound: {
      type: "cloth",
      synth: "brief filtered noise with a soft attack and flutter decay (fabric settling)",
    },
    accessibilityLabel: "a folded cream linen cloth",
  },
  {
    id: "prayer-rug",
    name: "Prayer Rug",
    aka: ["sajjada"],
    category: "textile",
    traditions: ["islamic"],
    description:
      "A dedicated clean space for prayer, oriented by the worshipper toward the qibla. It is placed in the Floor zone, never on the altar surface.",
    whenUsed: "The five daily prayers; rolled or covered when not in use.",
    caution: "Must stay clean and is conventionally not stepped on or sat upon.",
    heightClass: "floor",
    sound: {
      type: "cloth",
      synth: "soft fabric unfold: two-step filtered noise",
    },
    accessibilityLabel: "a woven prayer rug with an arch pattern pointing into the distance",
  },
  {
    id: "oil-lamp",
    name: "Oil Lamp (Diya)",
    aka: ["diya", "deepa"],
    category: "flame",
    traditions: ["hindu", "buddhist"],
    description:
      "A clay or brass oil lamp with cotton wick: the diya. Light offered at the shrine; central to Diwali and daily puja.",
    whenUsed: "Morning and evening puja; festivals of light.",
    caution: "Open flame; use on a heat-safe plate.",
    heightClass: "surface",
    sound: {
      type: "flame",
      synth: "filtered noise with slower, steadier LFO than the candle (heavier wick)",
    },
    accessibilityLabel: "a small clay oil lamp with a single wick flame",
  },
];

export const TOOL_IDS = TOOLS.map((t) => t.id);
