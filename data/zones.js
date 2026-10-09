/**
 * data/zones.js
 * Symbols & Sigils — The Living Altar (v3)
 *
 * Coordinate contract (spec §6): scene -Z = North.
 * compassBearing is degrees CLOCKWISE from North: N=0, E=90, S=180, W=270.
 * Compass UI, zone placement and qibla all derive from this contract.
 */

export const ZONES = [
  {
    id: "altar-center",
    name: "Altar Center",
    description:
      "The heart of the altar surface: the place of primary focus. Most traditions give the center to the single most important object of the working.",
    heightBand: "surface",
    compassBearing: 0,
    capacity: 2,
    adjacencyNote: "Objects placed here face the viewer by default.",
  },
  {
    id: "altar-north",
    name: "Altar North",
    description:
      "North edge of the altar. In Wiccan and ceremonial directional systems the north quarter is associated with earth and stability; other traditions may simply read it as the back of the altar.",
    heightBand: "surface",
    compassBearing: 0,
    capacity: 3,
    adjacencyNote: "Conventionally paired with earth-associated objects in directional systems.",
  },
  {
    id: "altar-east",
    name: "Altar East",
    description:
      "East edge of the altar, the direction of sunrise. Directional systems associate it with air and beginnings; sunrise-oriented practice places flame here.",
    heightBand: "surface",
    compassBearing: 90,
    capacity: 3,
    adjacencyNote: null,
  },
  {
    id: "altar-south",
    name: "Altar South",
    description:
      "South edge of the altar. Directional systems associate the south quarter with fire and noon sun.",
    heightBand: "surface",
    compassBearing: 180,
    capacity: 3,
    adjacencyNote: null,
  },
  {
    id: "altar-west",
    name: "Altar West",
    description:
      "West edge of the altar, the direction of sunset. Directional systems associate it with water and dusk.",
    heightBand: "surface",
    compassBearing: 270,
    capacity: 3,
    adjacencyNote: null,
  },
  {
    id: "hearth",
    name: "Hearth",
    description:
      "The household fire-place or stove-side shelf: the oldest home altar. Suited to flame, warmth and family-facing practice.",
    heightBand: "surface",
    compassBearing: 180,
    capacity: 4,
    adjacencyNote: "Flame objects are at home here; paper and cloth placements get a heat caution.",
  },
  {
    id: "above-door",
    name: "Above Door",
    description:
      "The lintel zone: threshold guardianship and blessing. Many folk traditions hang protective signs here; in the Jewish home this is also where the mezuzah sits (the mezuzah itself is outside v1 scope).",
    heightBand: "wall",
    compassBearing: 0,
    capacity: 2,
    adjacencyNote: "High placement — reserved for signs meant to be seen from a distance.",
  },
  {
    id: "high-wall",
    name: "High Wall",
    description:
      "An elevated wall position in the room. Suited to images and signs that preside over a space rather than sit within working reach.",
    heightBand: "wall",
    compassBearing: 0,
    capacity: 3,
    adjacencyNote: "Publicly visible — entries with display sensitivities speak to this zone.",
  },
  {
    id: "floor",
    name: "Floor",
    description:
      "Ground-level space before the altar: kneeling, prostration, floor cushions and prayer rugs. Some signs are honored by low placement; many are not.",
    heightBand: "floor",
    compassBearing: 0,
    capacity: 3,
    adjacencyNote: "Respect sensitivities: several traditions keep sacred text and sacred syllables off the floor.",
  },
  {
    id: "pendant",
    name: "Pendant / Worn",
    description:
      "A body slot: a pendant, ring or pocket talisman carried on the person. Suited to small apotropaic and identity signs.",
    heightBand: "worn",
    compassBearing: 0,
    capacity: 1,
    adjacencyNote: "Scale rule: only small-form placements resolve here.",
  },
];

export const ZONE_IDS = ZONES.map((z) => z.id);

/**
 * Default zone policy: where a symbol has no explicit rule for a zone,
 * placement is ALLOWED with an informational note that no recorded
 * guidance exists. Absence of record is never a prohibition.
 */
export const DEFAULT_ZONE_RULE = {
  verdict: "allowed",
  severity: "note",
  rationale:
    "No recorded placement guidance for this symbol in this position. Placement is aligned with general convention.",
  confidence: "low",
};
