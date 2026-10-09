/**
 * data/traditions.js
 * Symbols & Sigils — The Living Altar (v3)
 *
 * One entry per tradition. Every tradition carries the SAME context-box
 * shape ("how practitioners use this" + "common concerns") so no tradition
 * is policed harder than another (spec §5).
 */

export const TRADITIONS = {
  "celtic": {
    id: "celtic",
    name: "Celtic",
    palette: { accent: "#2D4A3E", name: "oak green" },
    blurb:
      "Motifs from Iron Age, early medieval insular art, and living folk custom — knotwork, spirals, and seasonal craft. Much popular 'Celtic' meaning is modern reconstruction; entries say so where it applies.",
    scope: "Historical artifacts, documented folk custom, and clearly-labeled modern revival forms.",
    contextBox: {
      howUsed:
        "Knotwork and spiral motifs appear on early medieval manuscripts, stone crosses and metalwork. Living customs such as weaving Brigid's crosses from rushes continue in Ireland. Modern Druidry and Celtic-inspired Paganism adopt several of these forms as devotional signs.",
      commonConcerns:
        "Popular claims of unbroken ancient meaning often outrun the evidence: several motifs are attested as decoration long before their symbolic readings appear, and some 'ancient' forms are documented modern creations. We label attestation dates plainly.",
    },
  },
  "egyptian": {
    id: "egyptian",
    name: "Egyptian",
    palette: { accent: "#C5A059", name: "gold foil" },
    blurb:
      "Signs from pharaonic Egypt's 3,000-year visual language: life, stability, power, protection. Well attested in tombs, temples and amulets.",
    scope: "Pharaonic and Greco-Roman Egyptian material as documented by Egyptology.",
    contextBox: {
      howUsed:
        "These signs functioned in temple relief, tomb painting, jewelry and amulets — protection in life and the afterlife. Modern Kemetic reconstructionist religion uses them devotionally; many others wear them as heritage or decorative symbols.",
      commonConcerns:
        "Modern 'sacred geometry' and numerology claims (for example, sense-fraction readings of the Eye of Horus) are contemporary overlays not found in ancient sources. We present attested meanings first and label overlays as such.",
    },
  },
  "wicca-pagan": {
    id: "wicca-pagan",
    name: "Wicca & Modern Pagan",
    palette: { accent: "#2D4A3E", name: "oak green" },
    blurb:
      "Symbols of modern Pagan and Wiccan practice, a 20th-century religious movement with medieval and folk antecedents. Entries follow historians of the movement.",
    scope: "Wicca, ceremonial magic inheritance, and modern Pagan iconography, with formation dates stated.",
    contextBox: {
      howUsed:
        "Used on altars, in casting circles, on tools and jewelry. Directional/elemental attributions (pentacle–earth, wand–air, candle–fire, chalice–water) are standard in most Wiccan and ceremonial lineages. Some forms are initiatory within specific traditions.",
      commonConcerns:
        "Claims of survival from prehistoric witch-cults were disproven by 20th-century scholarship; symbols are no less meaningful to practitioners for being modern. A few signs (notably the pentagram) carry divergent public readings depending on orientation and context.",
    },
  },
  "christian": {
    id: "christian",
    name: "Christian",
    palette: { accent: "#C5A059", name: "gold foil" },
    blurb:
      "Early and medieval signs of Christian confession and devotion, from catacomb monograms to parish crosses.",
    scope: "Historic Christian symbols across major branches; denominational differences noted per entry.",
    contextBox: {
      howUsed:
        "Worn as jewelry, set in churches and homes, marked on graves, used in prayer. Practice varies by denomination — for example, plain crosses versus crucifixes — and entries note variation rather than assuming one norm.",
      commonConcerns:
        "These signs can be treated with levity in secular decoration; many Christians regard that as disrespectful. A few forms have also been misappropriated by political movements; we flag misuse without attributing it to the symbol itself.",
    },
  },
  "jewish": {
    id: "jewish",
    name: "Jewish",
    palette: { accent: "#C5A059", name: "gold foil" },
    blurb:
      "Signs with roots in biblical text, rabbinic tradition and Jewish communal history — some ancient, some adopted surprisingly late.",
    scope: "Biblical, rabbinic and modern Jewish usage, with adoption dates stated where they matter.",
    contextBox: {
      howUsed:
        "The menorah anchors Hanukkah observance and appears in synagogue art; the Star of David marks communal identity and, with 'Chai', is worn as jewelry or given as gifts. Practice differs across Orthodox, Conservative, Reform and secular Jewish communities.",
      commonConcerns:
        "Using specifically Jewish symbols as generic decoration can read as appropriation, especially in spaces implying worship. Placement above or below other objects is read as meaningful by some practitioners; the placement notes here reflect recorded sensitivities, not rulings.",
    },
  },
  "islamic": {
    id: "islamic",
    name: "Islamic",
    palette: { accent: "#C5A059", name: "gold foil" },
    blurb:
      "Calligraphic and geometric signs from Qur'anic manuscript tradition and Islamic sacred art. Figural depiction is avoided by design.",
    scope: "Qur'anic orthography and geometric ornament across the Islamic world.",
    contextBox: {
      howUsed:
        "The rub el hizb marks recitation divisions in Qur'ans; geometric stars organize mosque ornament and calligraphic composition. The crescent-and-star appears on flags and architecture and is used ornamentally by many Muslims, though it is not a universal religious sign.",
      commonConcerns:
        "Qur'anic text itself must never be treated as decoration or placed where it would be dishonored (near the floor, in bathrooms). Geometric ornament is generally viewed differently from text; entries keep that distinction explicit.",
    },
  },
  "hindu": {
    id: "hindu",
    name: "Hindu",
    palette: { accent: "#C5A059", name: "gold foil" },
    blurb:
      "Sacred syllables, yantras and emblems from a diverse, multi-millennial family of traditions. Entries favor widely shared readings and note regional variance.",
    scope: "Vedic, Shaiva, Shakta and popular pan-Indian usage.",
    contextBox: {
      howUsed:
        "Om opens and closes prayer and mantra; yantras are supports for meditation and worship; the swastika marks thresholds, ledgers and ceremonies as a well-being sign. Placement on home shrines follows household custom.",
      commonConcerns:
        "Sacred syllables and yantras are commonly kept off the floor and away from feet, shoes and waste areas. The swastika is a revered sign across Dharmic religions and must be read in its own context — entries state this explicitly to prevent conflation with 20th-century European misuse.",
    },
  },
  "buddhist": {
    id: "buddhist",
    name: "Buddhist",
    palette: { accent: "#C5A059", name: "gold foil" },
    blurb:
      "Signs of the Dharma across Indian, Tibetan, East Asian and Southeast Asian Buddhism — the eight auspicious signs among them.",
    scope: "Pan-Buddhist symbols with lineage notes where Tibetan usage is the best-documented.",
    contextBox: {
      howUsed:
        "The wheel, knot and lotus appear in shrine rooms, thangka painting, stupas and monastic seals; they are contemplated as teachings in visual form. Many practitioners keep them elevated and clean.",
      commonConcerns:
        "Commercial and tattoo use of Buddhist signs (unalome in particular) has outpaced understanding of their meaning; entries note where modern popularity differs from documented tradition. Images of the Buddha and sacred signs are commonly not placed below eye level.",
    },
  },
  "taoist": {
    id: "taoist",
    name: "Taoist & Chinese cosmological",
    palette: { accent: "#2D4A3E", name: "oak green" },
    blurb:
      "Diagrams of change and balance from the Yijing tradition and Taoist cosmology — trigrams, and the taiji in its documented forms.",
    scope: "Yijing trigram tradition and Taoist cosmological diagrams.",
    contextBox: {
      howUsed:
        "The bagua is used in divination, on temple architecture, and (in feng shui) at doorways; the taijitu appears in martial arts, temples and philosophy. Usage ranges from strictly ritual to purely philosophical.",
      commonConcerns:
        "The taijitu is frequently used without its cosmological context; trigram arrangements differ between the Earlier Heaven and Later Heaven orders and mixing them changes meaning — entries specify which order is used.",
    },
  },
  "left-hand-path": {
    id: "left-hand-path",
    name: "Left-hand-path / Satanic",
    palette: { accent: "#2D4A3E", name: "oak green" },
    blurb:
      "Historical and modern symbolic use from 19th-century occultism and organized Satanism (Church of Satan 1966, The Satanic Temple 2013). Presented in the same neutral, sourced format as every other tradition.",
    scope:
      "Covers historical and modern SYMBOLIC use — iconography and its documented history. It is not endorsement, and this project gives no ritual instruction for these traditions.",
    contextBox: {
      howUsed:
        "These sigils function as identity markers and polemical signs within their movements: the Sigil of Baphomet since 1966 as the Church of Satan's emblem, the Leviathan cross reused from alchemical sulfur. The Satanic Temple uses different, often non-occult iconography.",
      commonConcerns:
        "These signs are deliberately adversarial to mainstream religious sensibilities and are widely read as such. Displaying them in shared or multi-faith spaces is consequential; the placement notes here describe that consequence neutrally, without moralizing.",
    },
  },
};
