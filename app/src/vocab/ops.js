export const OP_VOCAB = {
  "graft.state": {
    id: "graft.state",
    label: "Apply Condition",
    description: "Apply a user-facing condition onto the target character.",
    fields: [
      { id: "key", label: "Condition Lane", placeholder: "statuses" },
      { id: "value", label: "Condition", placeholder: "poison" },
    ],
    valueMode: "literal",
    allowedTokens: [],
  },
  "graft.meta": {
    id: "graft.meta",
    label: "Graft Meta",
    description: "Write a literal meta value onto the target character.",
    fields: [
      { id: "key", label: "Key", placeholder: "status" },
      { id: "value", label: "Value", placeholder: "elite" },
    ],
    valueMode: "literal",
    allowedTokens: [],
  },
  "prune.state": {
    id: "prune.state",
    label: "Prune State",
    description: "Remove a state key from the target character.",
    fields: [{ id: "key", label: "Key", placeholder: "poison" }],
    valueMode: "none",
    allowedTokens: [],
  },
  "prune.meta": {
    id: "prune.meta",
    label: "Prune Meta",
    description: "Remove a meta key from the target character.",
    fields: [{ id: "key", label: "Key", placeholder: "status" }],
    valueMode: "none",
    allowedTokens: [],
  },
  "derive.state": {
    id: "derive.state",
    label: "Calculation",
    description: "Compute the next HP value from a structured expression.",
    fields: [
      { id: "key", label: "Key", placeholder: "hp" },
      { id: "expression", label: "Expression", placeholder: "current - 1" },
    ],
    valueMode: "expression",
    allowedTokens: ["current", "previous"],
  },
  "derive.meta": {
    id: "derive.meta",
    label: "Derive Meta",
    description: "Compute a meta value from an expression.",
    fields: [
      { id: "key", label: "Key", placeholder: "threat" },
      { id: "expression", label: "Expression", placeholder: "previous + 1" },
    ],
    valueMode: "expression",
    allowedTokens: ["current", "previous"],
  },
  "numericEffect.state": {
    id: "numericEffect.state",
    label: "Calculation",
    description:
      "Resolve the next HP amount from base amount, additional derivation, and minimum amount.",
    fields: [
      { id: "key", label: "Key", placeholder: "hp" },
      { id: "baseAmount", label: "Base Amount", placeholder: "1" },
      {
        id: "additionalDerivation",
        label: "Additional Derivation",
        placeholder: "source.atk - target.def",
      },
      { id: "minimumAmount", label: "Minimum Amount", placeholder: "1" },
    ],
    valueMode: "numericEffect",
    allowedTokens: [],
  },
};
