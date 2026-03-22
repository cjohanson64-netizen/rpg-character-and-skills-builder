export const NODE_VOCAB = {
  role: {
    id: "role",
    label: "Role",
    description: "Base classification node for actor roles in the RPG character.",
    kind: "archetype",
  },
  hero: {
    id: "hero",
    label: "Hero",
    description: "A player-aligned combatant or protagonist.",
    extends: "role",
    kind: "actor",
  },
  enemy: {
    id: "enemy",
    label: "Enemy",
    description: "A hostile combatant or opposing force.",
    extends: "role",
    kind: "actor",
  },
  npc: {
    id: "npc",
    label: "NPC",
    description: "A non-player character that can participate in scenes or encounters.",
    extends: "role",
    kind: "actor",
  },
  item: {
    id: "item",
    label: "Item",
    description: "A usable or collectible object in the world.",
    kind: "object",
  },
  equipment: {
    id: "equipment",
    label: "Equipment",
    description: "An item intended to be equipped by an actor.",
    extends: "item",
    kind: "object",
  },
  skill: {
    id: "skill",
    label: "Skill",
    description: "A learned ability, technique, or spell-like capability.",
    kind: "capability",
  },
  status: {
    id: "status",
    label: "Status",
    description: "A temporary or persistent condition affecting an actor.",
    kind: "condition",
  },
};
