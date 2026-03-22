export const EFFECT_VOCAB = {
  damage: {
    id: "damage",
    label: "Damage",
    description: "Reduces health or durability.",
    kind: "negative",
    targetType: "actor",
  },
  heal: {
    id: "heal",
    label: "Heal",
    description: "Restores health or durability.",
    kind: "positive",
    targetType: "actor",
  },
  poison: {
    id: "poison",
    label: "Poison",
    description: "Applies a lingering harmful status effect.",
    kind: "status",
    targetType: "actor",
  },
  confuse: {
    id: "confuse",
    label: "Confuse",
    description: "Applies a disruptive mental status effect.",
    kind: "status",
    targetType: "actor",
  },
  stun: {
    id: "stun",
    label: "Stun",
    description: "Temporarily prevents the target from acting.",
    kind: "status",
    targetType: "actor",
  },
  freeze: {
    id: "freeze",
    label: "Freeze",
    description: "Immobilizes or slows the target with ice-like force.",
    kind: "status",
    targetType: "actor",
  },
};
