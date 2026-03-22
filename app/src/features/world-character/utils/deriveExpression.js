import { STAT_VOCAB } from "../../../vocab";

const defaultStatOperandId = Object.values(STAT_VOCAB)[0]?.id ?? "hp";

export function createEmptySimpleDeriveOperand(type = "number") {
  return {
    type,
    value:
      type === "sourceStat" || type === "targetStat" || type === "stat"
        ? defaultStatOperandId
        : "",
  };
}

export function createEmptyGroupedDeriveOperand() {
  return {
    type: "group",
    left: createEmptySimpleDeriveOperand("sourceStat"),
    operator: "-",
    right: createEmptySimpleDeriveOperand("targetStat"),
  };
}

export function normalizeSimpleDeriveOperand(operand) {
  if (!operand || typeof operand !== "object") {
    return createEmptySimpleDeriveOperand();
  }

  const type =
    operand.type === "sourceStat" ||
    operand.type === "targetStat" ||
    operand.type === "stat"
      ? operand.type
      : "number";
  const value =
    typeof operand.value === "number" || typeof operand.value === "string"
      ? String(operand.value)
      : "";

  return {
    type,
    value:
      type === "sourceStat" || type === "targetStat" || type === "stat"
        ? value || defaultStatOperandId
        : value,
  };
}

export function normalizeDeriveExpression(expression) {
  const base = expression?.base === "previous" ? "previous" : "current";
  const operator = expression?.operator === "-" ? "-" : "+";

  if (expression?.operand?.type === "group") {
    return {
      mode: "delta",
      base,
      operator,
      operand: {
        type: "group",
        left: normalizeSimpleDeriveOperand(expression.operand.left),
        operator: expression.operand.operator === "-" ? "-" : "+",
        right: normalizeSimpleDeriveOperand(expression.operand.right),
      },
    };
  }

  if (
    expression?.operand &&
    typeof expression.operand === "object" &&
    typeof expression.operand.type === "string"
  ) {
    return {
      mode: "delta",
      base,
      operator,
      operand: normalizeSimpleDeriveOperand(expression.operand),
    };
  }

  if (
    expression?.operandType === "number" ||
    expression?.operandType === "sourceStat" ||
    expression?.operandType === "targetStat" ||
    expression?.operandType === "stat"
  ) {
    return {
      mode: "delta",
      base,
      operator,
      operand: normalizeSimpleDeriveOperand({
        type: expression.operandType,
        value: expression.operand,
      }),
    };
  }

  return {
    mode: "delta",
    base,
    operator,
    operand: createEmptySimpleDeriveOperand(),
  };
}

export function updateExpressionOperandMode(expression, operandMode) {
  return {
    ...normalizeDeriveExpression(expression),
    operand:
      operandMode === "group"
        ? createEmptyGroupedDeriveOperand()
        : createEmptySimpleDeriveOperand(),
  };
}

export function updateExpressionSimpleOperandType(expression, operandType) {
  return {
    ...normalizeDeriveExpression(expression),
    operand: createEmptySimpleDeriveOperand(operandType),
  };
}

export function updateExpressionSimpleOperandValue(expression, value) {
  const norm = normalizeDeriveExpression(expression);
  return {
    ...norm,
    operand: { ...normalizeSimpleDeriveOperand(norm.operand), value },
  };
}

export function updateExpressionGroupedOperandType(expression, side, operandType) {
  const norm = normalizeDeriveExpression(expression);
  const group =
    norm.operand.type === "group" ? norm.operand : createEmptyGroupedDeriveOperand();
  return {
    ...norm,
    operand: { ...group, [side]: createEmptySimpleDeriveOperand(operandType) },
  };
}

export function updateExpressionGroupedOperandValue(expression, side, value) {
  const norm = normalizeDeriveExpression(expression);
  const group =
    norm.operand.type === "group" ? norm.operand : createEmptyGroupedDeriveOperand();
  return {
    ...norm,
    operand: {
      ...group,
      [side]: { ...normalizeSimpleDeriveOperand(group[side]), value },
    },
  };
}

export function updateExpressionGroupedOperator(expression, operator) {
  const norm = normalizeDeriveExpression(expression);
  const group =
    norm.operand.type === "group" ? norm.operand : createEmptyGroupedDeriveOperand();
  return {
    ...norm,
    operand: { ...group, operator: operator === "-" ? "-" : "+" },
  };
}
