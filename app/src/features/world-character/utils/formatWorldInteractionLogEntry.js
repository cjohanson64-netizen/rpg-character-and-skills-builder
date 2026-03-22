function formatConditionValue(value) {
  if (Array.isArray(value)) {
    return formatConditionValue(value[value.length - 1] ?? "");
  }

  if (value && typeof value === "object") {
    return "";
  }

  const text = String(value ?? "").trim();
  if (!text) {
    return "";
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatNumericEffect(op, baseRelation) {
  const amount =
    typeof op?.resolvedAmount === "number"
      ? op.resolvedAmount
      : typeof op?.value === "number"
        ? Math.abs(op.value)
        : null;

  if (op?.key !== "hp" || amount === null) {
    return "";
  }

  if (baseRelation === "heals") {
    return `HP + ${amount}`;
  }

  return `HP - ${amount}`;
}

function formatAppliedOp(op, baseRelation) {
  if (!op || typeof op !== "object") {
    return "";
  }

  if (op.type === "numericEffect.state") {
    return formatNumericEffect(op, baseRelation);
  }

  if (op.type === "graft.state") {
    return formatConditionValue(op.value);
  }

  if (op.type === "derive.state" && op.key === "hp") {
    const nextHp = typeof op.value === "number" ? op.value : null;
    if (nextHp === null) {
      return "";
    }

    return `HP = ${nextHp}`;
  }

  return "";
}

export function formatWorldInteractionEffectSummary(interaction) {
  const appliedOps = Array.isArray(interaction?.resultMeta?.appliedOps)
    ? interaction.resultMeta.appliedOps
    : [];
  const effectParts = appliedOps
    .map((op) => formatAppliedOp(op, interaction?.baseRelation))
    .filter(Boolean);

  if (effectParts.length > 0) {
    return effectParts.join(", ");
  }

  return "No visible effect";
}

export function formatWorldInteractionAction(interaction) {
  const source = interaction?.subject || "Unknown";
  const action = interaction?.definitionName || interaction?.relation || "acts on";
  const target = interaction?.object || "Unknown";

  return `${source} → ${action} → ${target}`;
}
