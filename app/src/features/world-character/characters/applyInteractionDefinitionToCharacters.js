import { parseNumericDeriveExpression } from "../../../vocab";

const ARRAY_LIKE_STATE_KEYS = new Set([
  "statuses",
  "buffs",
  "debuffs",
  "equipment",
  "weapon",
  "armor",
  "accessory",
]);

function cloneSnapshot(snapshot) {
  return JSON.parse(JSON.stringify(snapshot));
}

function getRootNode(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.nodes)) {
    return null;
  }

  return (
    snapshot.nodes.find((node) => node.id === snapshot.root) ??
    snapshot.nodes[0] ??
    null
  );
}

function getTargetNode(snapshot, target) {
  if (target !== "root") {
    throw new Error(`Unsupported interaction target "${target}".`);
  }

  const node = getRootNode(snapshot);
  if (!node) {
    throw new Error("Target character has no root node to apply the interaction to.");
  }

  return node;
}

function toNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  return 0;
}

function parseLiteralValue(value) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;

  const numericValue = Number(trimmed);
  if (!Number.isNaN(numericValue) && trimmed !== "") {
    return numericValue;
  }

  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

function getStateValue(node, key) {
  return node?.state?.[key];
}

function getStatValue(node, statKey) {
  return toNumber(node?.state?.[statKey] ?? node?.meta?.[statKey] ?? node?.value?.[statKey]);
}

function parseBaseHpFromCharacterSource(source) {
  if (typeof source !== "string" || !source.trim()) {
    return null;
  }

  const hpMatch = source.match(/@graft\.state\([^\n]*"hp"\s*,\s*(-?\d+(?:\.\d+)?)\)/);
  if (!hpMatch) {
    return null;
  }

  const parsedHp = Number(hpMatch[1]);
  return Number.isFinite(parsedHp) ? parsedHp : null;
}

function getMaxHpValue(targetInstance, targetRoot, previousTargetState) {
  const explicitMaxHp = [
    targetRoot?.state?.maxHp,
    targetRoot?.meta?.maxHp,
    targetRoot?.value?.maxHp,
    targetRoot?.state?.baseHp,
    targetRoot?.meta?.baseHp,
    targetRoot?.value?.baseHp,
  ]
    .map((value) => toNumber(value))
    .find((value) => value > 0);

  if (explicitMaxHp) {
    return explicitMaxHp;
  }

  const sourceDefinedHp = parseBaseHpFromCharacterSource(targetInstance?.source);
  if (typeof sourceDefinedHp === "number" && sourceDefinedHp > 0) {
    return sourceDefinedHp;
  }

  const fallbackHp = [
    previousTargetState?.maxHp,
    previousTargetState?.baseHp,
    previousTargetState?.hp,
    targetRoot?.state?.hp,
  ]
    .map((value) => toNumber(value))
    .find((value) => value > 0);

  return fallbackHp ?? 0;
}

function clampHpValue(nextHpValue, targetInstance, targetRoot, previousTargetState) {
  const maxHp = getMaxHpValue(targetInstance, targetRoot, previousTargetState);
  if (maxHp > 0) {
    return Math.min(maxHp, Math.max(0, nextHpValue));
  }

  return Math.max(0, nextHpValue);
}

function resolveSimpleOperandValue(operand, sourceRoot, targetRoot) {
  if (!operand || typeof operand !== "object") {
    return 0;
  }

  if (operand.type === "number") {
    return toNumber(operand.value);
  }

  if (operand.type === "sourceStat") {
    return getStatValue(sourceRoot, operand.value);
  }

  if (operand.type === "targetStat" || operand.type === "stat") {
    return getStatValue(targetRoot, operand.value);
  }

  return 0;
}

function resolveOperandValueWithOptions(
  operand,
  sourceRoot,
  targetRoot,
  options = {},
) {
  if (!operand || typeof operand !== "object") {
    return 0;
  }

  const { clampGroupedSubtotal = false } = options;

  if (operand.type === "group") {
    const leftValue = resolveSimpleOperandValue(operand.left, sourceRoot, targetRoot);
    const rightValue = resolveSimpleOperandValue(operand.right, sourceRoot, targetRoot);
    const groupedValue =
      operand.operator === "-" ? leftValue - rightValue : leftValue + rightValue;

    return clampGroupedSubtotal ? Math.max(0, groupedValue) : groupedValue;
  }

  return resolveSimpleOperandValue(operand, sourceRoot, targetRoot);
}

function evaluateDeriveExpression(
  expression,
  sourceRoot,
  targetRoot,
  currentValue,
  previousValue,
  options = {},
) {
  const baseValue =
    options.ignoreBase === true
      ? 0
      : expression.base === "previous"
        ? previousValue
        : currentValue;
  const operandValue = resolveOperandValueWithOptions(
    expression.operand,
    sourceRoot,
    targetRoot,
    {
      clampGroupedSubtotal: options.clampGroupedSubtotal === true,
    },
  );

  return expression.operator === "-" ? baseValue - operandValue : baseValue + operandValue;
}

function getNumericEffectDirection(definition) {
  if (definition?.baseRelation === "attacks") {
    return "subtract";
  }

  if (definition?.baseRelation === "heals") {
    return "add";
  }

  return "add";
}

function applyGraftState(currentValue, key, nextValue) {
  if (Array.isArray(currentValue)) {
    return currentValue.includes(nextValue)
      ? currentValue
      : [...currentValue, nextValue];
  }

  if (currentValue && typeof currentValue === "object" && nextValue && typeof nextValue === "object") {
    return {
      ...currentValue,
      ...nextValue,
    };
  }

  if (currentValue === undefined && ARRAY_LIKE_STATE_KEYS.has(key) && !Array.isArray(nextValue)) {
    return [nextValue];
  }

  return nextValue;
}

export function applyInteractionDefinitionToCharacters({
  definition,
  sourceInstance,
  targetInstance,
}) {
  if (!definition?.effect?.ops?.length) {
    throw new Error("Interaction definition has no executable effect ops.");
  }

  if (!sourceInstance?.snapshot) {
    throw new Error(`Source character "${sourceInstance?.name ?? "unknown"}" is missing a snapshot.`);
  }

  if (!targetInstance?.snapshot) {
    throw new Error(`Target character "${targetInstance?.name ?? "unknown"}" is missing a snapshot.`);
  }

  const nextTargetSnapshot = cloneSnapshot(targetInstance.snapshot);
  const sourceRoot = getRootNode(sourceInstance.snapshot);
  const targetRoot = getTargetNode(nextTargetSnapshot, definition.effect.target ?? "root");

  if (!sourceRoot) {
    throw new Error(`Source character "${sourceInstance.name}" has no root node.`);
  }

  if (!targetRoot.state || typeof targetRoot.state !== "object") {
    targetRoot.state = {};
  }

  const previousTargetState = {
    ...targetRoot.state,
  };
  const appliedOps = [];

  for (const op of definition.effect.ops) {
    if (!op?.type) {
      throw new Error("Encountered an effect op without a type.");
    }

    if (op.type === "derive.state") {
      const expression =
        typeof op.expression === "string"
          ? parseNumericDeriveExpression(op.expression)
          : null;

      if (!expression) {
        throw new Error(`Could not parse derive expression "${op.expression ?? ""}".`);
      }

      const baseValue =
        expression.base === "previous"
          ? toNumber(previousTargetState[op.key])
          : toNumber(getStateValue(targetRoot, op.key));
      const nextValue = evaluateDeriveExpression(
        expression,
        sourceRoot,
        targetRoot,
        baseValue,
        toNumber(previousTargetState[op.key]),
        { clampGroupedSubtotal: true },
      );

      targetRoot.state[op.key] =
        op.key === "hp"
          ? clampHpValue(nextValue, targetInstance, targetRoot, previousTargetState)
          : nextValue;
      appliedOps.push({
        type: op.type,
        key: op.key,
        expression: op.expression,
        value: nextValue,
      });
      continue;
    }

    if (op.type === "numericEffect.state") {
      const expression =
        typeof op.additionalDerivation === "string"
          ? parseNumericDeriveExpression(op.additionalDerivation)
          : op.additionalDerivation;
      if (!expression || typeof expression !== "object") {
        throw new Error("Numeric effect is missing its additional derivation.");
      }

      const baseAmount = toNumber(op.baseAmount);
      const minimumAmount = Math.max(0, toNumber(op.minimumAmount));
      const additionalAmount = evaluateDeriveExpression(
        expression,
        sourceRoot,
        targetRoot,
        0,
        0,
        { clampGroupedSubtotal: false, ignoreBase: true },
      );
      const resolvedAmount = Math.max(minimumAmount, baseAmount + additionalAmount);
      const currentValue = toNumber(getStateValue(targetRoot, op.key));
      const nextValue =
        getNumericEffectDirection(definition) === "subtract"
          ? currentValue - resolvedAmount
          : currentValue + resolvedAmount;

      targetRoot.state[op.key] =
        op.key === "hp"
          ? clampHpValue(nextValue, targetInstance, targetRoot, previousTargetState)
          : nextValue;
      appliedOps.push({
        type: op.type,
        key: op.key,
        baseAmount,
        minimumAmount,
        additionalDerivation: expression,
        resolvedAmount,
        value: nextValue,
      });
      continue;
    }

    if (op.type === "graft.state") {
      const literalValue = parseLiteralValue(op.value);
      const nextValue = applyGraftState(targetRoot.state[op.key], op.key, literalValue);

      targetRoot.state[op.key] = nextValue;
      appliedOps.push({
        type: op.type,
        key: op.key,
        value: nextValue,
      });
      continue;
    }

    if (op.type === "prune.state") {
      delete targetRoot.state[op.key];
      appliedOps.push({
        type: op.type,
        key: op.key,
        value: null,
      });
      continue;
    }

    throw new Error(`Unsupported effect op "${op.type}".`);
  }

  return {
    sourceInstance,
    targetInstance: {
      ...targetInstance,
      snapshot: nextTargetSnapshot,
      savedAt: new Date().toISOString(),
    },
    resultMeta: {
      sourceCharacter: sourceInstance.name,
      targetCharacter: targetInstance.name,
      targetNodeId: targetRoot.id ?? nextTargetSnapshot.root ?? "root",
      appliedOps,
    },
    resultSnapshot: {
      targetCharacter: targetInstance.name,
      targetRootId: targetRoot.id ?? nextTargetSnapshot.root ?? "root",
      targetState: {
        ...targetRoot.state,
      },
    },
  };
}
