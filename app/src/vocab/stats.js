export const STAT_VOCAB = {
  hp: {
    id: "hp",
    label: "HP",
    description: "Health points. Determines how much damage a target can take.",
    category: "vital",
    default: 10,
  },
  atk: {
    id: "atk",
    label: "ATK",
    description: "Attack. Influences outgoing physical damage.",
    category: "combat",
    default: 1,
  },
  def: {
    id: "def",
    label: "DEF",
    description: "Defense. Mitigates incoming physical damage.",
    category: "combat",
    default: 1,
  },
  int: {
    id: "int",
    label: "INT",
    description: "Intelligence. Influences magic, skill power, or derived effects.",
    category: "mental",
    default: 1,
  },
  res: {
    id: "res",
    label: "RES",
    description: "Resistance. Mitigates magical or status-based effects.",
    category: "combat",
    default: 1,
  },
  spd: {
    id: "spd",
    label: "SPD",
    description: "Speed. Influences turn order, initiative, or evasion-like outcomes.",
    category: "mobility",
    default: 1,
  },
};
