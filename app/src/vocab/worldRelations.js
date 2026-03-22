export const WORLD_RELATION_VOCAB = {
  attacks: {
    id: "attacks",
    label: "Attacks",
    description: "The source character instance attacks the target character instance.",
    sourceTypes: ["character-instance"],
    targetTypes: ["character-instance"],
  },
  heals: {
    id: "heals",
    label: "Heals",
    description: "The source character instance restores health or vitality to the target.",
    sourceTypes: ["character-instance"],
    targetTypes: ["character-instance"],
  },
  buffs: {
    id: "buffs",
    label: "Buffs",
    description: "The source character instance applies a beneficial effect to the target.",
    sourceTypes: ["character-instance"],
    targetTypes: ["character-instance"],
  },
  debuffs: {
    id: "debuffs",
    label: "Debuffs",
    description: "The source character instance applies a harmful effect to the target.",
    sourceTypes: ["character-instance"],
    targetTypes: ["character-instance"],
  },
};
