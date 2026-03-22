import { ACTION_VOCAB } from "./actions";
import { EDGE_VOCAB } from "./edges";
import { EFFECT_VOCAB } from "./effects";
import { NODE_VOCAB } from "./nodes";
import { OP_TOKEN_VOCAB } from "./opTokens";
import { OP_VOCAB } from "./ops";
import { STATE_KEY_VOCAB } from "./stateKeys";
import { STAT_VOCAB } from "./stats";
import { WORLD_RELATION_CONTRACTS } from "./worldRelationContracts";
import { WORLD_RELATION_VOCAB } from "./worldRelations";

export { 
  ACTION_VOCAB,
  EDGE_VOCAB,
  EFFECT_VOCAB,
  NODE_VOCAB,
  OP_TOKEN_VOCAB,
  OP_VOCAB,
  STATE_KEY_VOCAB,
  STAT_VOCAB,
  WORLD_RELATION_CONTRACTS,
  WORLD_RELATION_VOCAB,
};

export function getWorldRelationContract(relationId) {
  return WORLD_RELATION_CONTRACTS[relationId] ?? null;
}

export function isAllowedOpForRelation(relationId, opType) {
  const contract = getWorldRelationContract(relationId);
  if (!contract) {
    return true;
  }

  return contract.allowedOpTypes.includes(opType);
}

export function createEmptyNumericDeriveExpression(base = "current") {
  return {
    mode: "delta",
    base,
    operator: "+",
    operand: {
      type: "number",
      value: "",
    },
  };
}

export function createEmptyNumericEffectDerivation() {
  return {
    mode: "delta",
    base: "current",
    operator: "+",
    operand: {
      type: "number",
      value: "0",
    },
  };
}

export function parseNumericDeriveExpression(expression) {
  if (typeof expression !== "string") {
    return null;
  }

  function parseSimpleOperandToken(token) {
    const trimmed = token.trim();
    const sourceMatch = trimmed.match(/^source\.([A-Za-z_$][\w$-]*)$/);
    if (sourceMatch) {
      const statId = sourceMatch[1];
      if (!Object.prototype.hasOwnProperty.call(STAT_VOCAB, statId)) {
        return null;
      }

      return {
        type: "sourceStat",
        value: statId,
      };
    }

    const targetMatch = trimmed.match(/^target\.([A-Za-z_$][\w$-]*)$/);
    if (targetMatch) {
      const statId = targetMatch[1];
      if (!Object.prototype.hasOwnProperty.call(STAT_VOCAB, statId)) {
        return null;
      }

      return {
        type: "targetStat",
        value: statId,
      };
    }

    if (Object.prototype.hasOwnProperty.call(STAT_VOCAB, trimmed)) {
      return {
        type: "stat",
        value: trimmed,
      };
    }

    if (!Number.isNaN(Number(trimmed))) {
      return {
        type: "number",
        value: trimmed,
      };
    }

    return null;
  }

  const topLevelMatch = expression
    .trim()
    .match(/^(current|previous)\s*([+-])\s*(.+)$/);

  if (!topLevelMatch) {
    return null;
  }

  const base = topLevelMatch[1];
  const operator = topLevelMatch[2];
  const remainder = topLevelMatch[3].trim();

  if (remainder.startsWith("(") && remainder.endsWith(")")) {
    const innerExpression = remainder.slice(1, -1).trim();
    const groupMatch = innerExpression.match(/^(.+?)\s*([+-])\s*(.+)$/);

    if (!groupMatch) {
      return null;
    }

    const left = parseSimpleOperandToken(groupMatch[1]);
    const innerOperator = groupMatch[2];
    const right = parseSimpleOperandToken(groupMatch[3]);

    if (!left || !right) {
      return null;
    }

    return {
      mode: "delta",
      base,
      operator,
      operand: {
        type: "group",
        left,
        operator: innerOperator,
        right,
      },
    };
  }

  const operand = parseSimpleOperandToken(remainder);
  if (!operand) {
    return null;
  }

  return {
    mode: "delta",
    base,
    operator,
    operand,
  };
}

export function serializeNumericDeriveExpression(expression) {
  if (!expression || typeof expression !== "object") {
    return "";
  }

  const base = typeof expression.base === "string" ? expression.base : "";
  const operator =
    expression.operator === "+" || expression.operator === "-"
      ? expression.operator
      : "";

  function normalizeLegacyOperand(rawExpression) {
    if (
      rawExpression.operand &&
      typeof rawExpression.operand === "object" &&
      typeof rawExpression.operand.type === "string"
    ) {
      return rawExpression.operand;
    }

    if (
      rawExpression.operandType === "number" ||
      rawExpression.operandType === "stat" ||
      rawExpression.operandType === "sourceStat" ||
      rawExpression.operandType === "targetStat"
    ) {
      return {
        type: rawExpression.operandType,
        value:
          typeof rawExpression.operand === "number" ||
          typeof rawExpression.operand === "string"
            ? String(rawExpression.operand).trim()
            : "",
      };
    }

    return null;
  }

  function serializeSimpleOperand(operand) {
    if (!operand || typeof operand !== "object") {
      return "";
    }

    const value =
      typeof operand.value === "number" || typeof operand.value === "string"
        ? String(operand.value).trim()
        : "";

    if (value === "") {
      return "";
    }

    if (operand.type === "number") {
      return Number.isNaN(Number(value)) ? "" : value;
    }

    if (
      (operand.type === "stat" ||
        operand.type === "sourceStat" ||
        operand.type === "targetStat") &&
      !Object.prototype.hasOwnProperty.call(STAT_VOCAB, value)
    ) {
      return "";
    }

    if (operand.type === "stat") {
      return value;
    }

    if (operand.type === "sourceStat") {
      return `source.${value}`;
    }

    if (operand.type === "targetStat") {
      return `target.${value}`;
    }

    return "";
  }

  const operand = normalizeLegacyOperand(expression);

  if (!base || !operator || !operand) {
    return "";
  }

  if (operand.type === "group") {
    const innerOperator =
      operand.operator === "+" || operand.operator === "-"
        ? operand.operator
        : "";
    const left = serializeSimpleOperand(operand.left);
    const right = serializeSimpleOperand(operand.right);

    if (!innerOperator || !left || !right) {
      return "";
    }

    return `${base} ${operator} (${left} ${innerOperator} ${right})`;
  }

  const serializedOperand = serializeSimpleOperand(operand);
  if (!serializedOperand) {
    return "";
  }

  return `${base} ${operator} ${serializedOperand}`;
}

export function getDefaultOpId() {
  return Object.keys(OP_VOCAB)[0];
}

export function getOpDefinition(opId) {
  return OP_VOCAB[opId] ?? OP_VOCAB[getDefaultOpId()];
}

export function createEmptyOp(opId = getDefaultOpId()) {
  const definition = getOpDefinition(opId);

  return definition.fields.reduce(
    (nextOp, field) => ({
      ...nextOp,
      [field.id]: "",
    }),
    {
      type: definition.id,
    },
  );
}

function coerceEffectOpFieldValue(op, field) {
  let rawValue = op[field.id];

  if (field.id === "expression" && typeof rawValue !== "string") {
    rawValue =
      rawValue && typeof rawValue === "object"
        ? serializeNumericDeriveExpression(rawValue)
        : op.value;
  }

  if (field.id === "value" && typeof rawValue !== "string") {
    rawValue =
      typeof op.expression === "string"
        ? op.expression
        : op.expression && typeof op.expression === "object"
          ? serializeNumericDeriveExpression(op.expression)
          : rawValue;
  }

  if (
    typeof rawValue === "number" ||
    typeof rawValue === "boolean"
  ) {
    return String(rawValue).trim();
  }

  return typeof rawValue === "string" ? rawValue.trim() : "";
}

function normalizeNumericEffectDerivation(derivation) {
  if (typeof derivation === "string") {
    return parseNumericDeriveExpression(derivation);
  }

  if (!derivation || typeof derivation !== "object") {
    return null;
  }

  const serialized = serializeNumericDeriveExpression({
    ...derivation,
    base: derivation.base === "previous" ? "previous" : "current",
  });

  return serialized ? parseNumericDeriveExpression(serialized) : null;
}

function validateNumericEffectOp(op) {
  const key = typeof op?.key === "string" ? op.key.trim() : "";
  const baseAmountRaw =
    typeof op?.baseAmount === "number" || typeof op?.baseAmount === "string"
      ? String(op.baseAmount).trim()
      : "";
  const minimumAmountRaw =
    typeof op?.minimumAmount === "number" || typeof op?.minimumAmount === "string"
      ? String(op.minimumAmount).trim()
      : "";
  const additionalDerivation = normalizeNumericEffectDerivation(op?.additionalDerivation);

  if (!key && !baseAmountRaw && !minimumAmountRaw && !additionalDerivation) {
    return {
      status: "empty",
      normalized: null,
      reason: "",
    };
  }

  if (!key) {
    return {
      status: "invalid",
      normalized: null,
      reason: "Missing key.",
    };
  }

  if (baseAmountRaw === "") {
    return {
      status: "invalid",
      normalized: null,
      reason: "Missing base amount.",
    };
  }

  const baseAmount = Number(baseAmountRaw);
  if (!Number.isFinite(baseAmount)) {
    return {
      status: "invalid",
      normalized: null,
      reason: "Base amount must be numeric.",
    };
  }

  if (minimumAmountRaw === "") {
    return {
      status: "invalid",
      normalized: null,
      reason: "Missing minimum amount.",
    };
  }

  const minimumAmount = Number(minimumAmountRaw);
  if (!Number.isFinite(minimumAmount)) {
    return {
      status: "invalid",
      normalized: null,
      reason: "Minimum amount must be numeric.",
    };
  }

  if (minimumAmount < 0) {
    return {
      status: "invalid",
      normalized: null,
      reason: "Minimum amount cannot be negative.",
    };
  }

  if (!additionalDerivation) {
    return {
      status: "invalid",
      normalized: null,
      reason: "Additional derivation is incomplete or invalid.",
    };
  }

  return {
    status: "complete",
    normalized: {
      type: "numericEffect.state",
      key,
      baseAmount,
      additionalDerivation,
      minimumAmount,
    },
    reason: "",
  };
}

export function validateEffectOp(op) {
  if (!op || typeof op !== "object") {
    return {
      status: "invalid",
      normalized: null,
      reason: "Op is missing or malformed.",
    };
  }

  const definition = OP_VOCAB[op.type];
  if (!definition) {
    return {
      status: "invalid",
      normalized: null,
      reason: "Unknown op type.",
    };
  }

  if (definition.id === "numericEffect.state") {
    return validateNumericEffectOp(op);
  }

  const normalized = { type: definition.id };

  for (const field of definition.fields) {
    normalized[field.id] = coerceEffectOpFieldValue(op, field);
  }

  const filledFields = definition.fields.filter((field) => normalized[field.id]);
  if (filledFields.length === 0) {
    return {
      status: "empty",
      normalized: null,
      reason: "",
    };
  }

  const nonKeyFields = definition.fields.filter((field) => field.id !== "key");
  const hasPrimaryContent = nonKeyFields.some((field) => normalized[field.id]);

  if (nonKeyFields.length > 0 && !hasPrimaryContent) {
    return {
      status: "empty",
      normalized: null,
      reason: "",
    };
  }

  const missingFields = definition.fields.filter((field) => !normalized[field.id]);
  if (missingFields.length > 0) {
    const missingExpression = missingFields.some((field) => field.id === "expression");

    return {
      status: "invalid",
      normalized: null,
      reason: missingExpression
        ? "Expression is incomplete or invalid."
        : `Missing ${missingFields.map((field) => field.label.toLowerCase()).join(", ")}.`,
    };
  }

  return {
    status: "complete",
    normalized,
    reason: "",
  };
}

export function normalizeEffectOp(op) {
  const validation = validateEffectOp(op);
  return validation.status === "complete" ? validation.normalized : null;
}
