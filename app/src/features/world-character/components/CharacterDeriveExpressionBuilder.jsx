import React from "react";
import { OP_TOKEN_VOCAB } from "../../../vocab";

function renderSimpleOperandValueControl({
  operand,
  statOperandOptions,
  defaultStatOperandId,
  onChange,
  placeholder,
}) {
  if (
    operand.type === "sourceStat" ||
    operand.type === "targetStat" ||
    operand.type === "stat"
  ) {
    return (
      <select
        className="character-inspector__input character-inspector__select"
        value={operand.value || defaultStatOperandId}
        onChange={(e) => onChange(e.target.value)}
      >
        {statOperandOptions.map((stat) => (
          <option key={stat.id} value={stat.id}>
            {stat.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type="number"
      step="any"
      className="character-inspector__input"
      value={operand.value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function renderSimpleOperandEditor({
  operand,
  statOperandOptions,
  defaultStatOperandId,
  onTypeChange,
  onValueChange,
  placeholder,
  numberLabel = "Number",
  sourceLabel = "Source Stat",
  targetLabel = "Target Stat",
}) {
  return (
    <span className="character-inspector__equation-token-group">
      <select
        className="character-inspector__input character-inspector__select"
        value={operand.type}
        onChange={(e) => onTypeChange(e.target.value)}
      >
        <option value="number">{numberLabel}</option>
        <option value="sourceStat">{sourceLabel}</option>
        <option value="targetStat">{targetLabel}</option>
      </select>

      {renderSimpleOperandValueControl({
        operand,
        statOperandOptions,
        defaultStatOperandId,
        onChange: onValueChange,
        placeholder,
      })}
    </span>
  );
}

export default function CharacterDeriveExpressionBuilder({
  normalizedExpression,
  allowedTokens,
  showBaseSelector = true,
  showContainer = true,
  title = "Derived Expression",
  resultLabel = "value",
  operandMode,
  simpleOperand,
  groupedOperand,
  statOperandOptions,
  defaultStatOperandId,
  onUpdate,
  updateExpressionOperandMode,
  updateExpressionSimpleOperandType,
  updateExpressionSimpleOperandValue,
  updateExpressionGroupedOperandType,
  updateExpressionGroupedOperandValue,
  updateExpressionGroupedOperator,
}) {
  const rootClassName = showContainer
    ? "character-inspector__equation-card character-inspector__world-effect-expression"
    : "character-inspector__equation-nested";

  const content = (
    <>
      <div className="character-inspector__equation-header">
        <div className="character-inspector__equation-title">{title}</div>
        <label className="character-inspector__equation-toolbar">
          <span className="character-inspector__equation-toolbar-label">Shape</span>
          <select
            className="character-inspector__input character-inspector__select"
            value={operandMode}
            onChange={(e) =>
              onUpdate(updateExpressionOperandMode(normalizedExpression, e.target.value))
            }
          >
            <option value="simple">Simple</option>
            <option value="group">Grouped</option>
          </select>
        </label>
      </div>

      <div className="character-inspector__equation-formula">
        <span className="character-inspector__equation-chip character-inspector__equation-chip--result">
          {resultLabel}
        </span>
        <span className="character-inspector__equation-symbol">=</span>

        {showBaseSelector ? (
          <>
            <select
              className="character-inspector__input character-inspector__select"
              value={normalizedExpression.base}
              onChange={(e) =>
                onUpdate({
                  ...normalizedExpression,
                  base: e.target.value,
                })
              }
            >
              {allowedTokens.map((tokenId) => (
                <option key={tokenId} value={tokenId}>
                  {OP_TOKEN_VOCAB[tokenId]?.label ?? tokenId}
                </option>
              ))}
            </select>

            <select
              className="character-inspector__input character-inspector__select"
              value={normalizedExpression.operator}
              onChange={(e) =>
                onUpdate({
                  ...normalizedExpression,
                  operator: e.target.value,
                })
              }
            >
              <option value="+">+</option>
              <option value="-">-</option>
            </select>
          </>
        ) : (
          <select
            className="character-inspector__input character-inspector__select"
            value={normalizedExpression.operator}
            onChange={(e) =>
              onUpdate({
                ...normalizedExpression,
                operator: e.target.value,
              })
            }
          >
            <option value="+">+</option>
            <option value="-">-</option>
          </select>
        )}

        {operandMode === "simple" ? (
          renderSimpleOperandEditor({
            operand: simpleOperand,
            statOperandOptions,
            defaultStatOperandId,
            onTypeChange: (value) =>
              onUpdate(
                updateExpressionSimpleOperandType(normalizedExpression, value),
              ),
            onValueChange: (value) =>
              onUpdate(
                updateExpressionSimpleOperandValue(normalizedExpression, value),
              ),
            placeholder: "Amount",
          })
        ) : (
          <span className="character-inspector__equation-group">
            <span className="character-inspector__equation-parenthesis">(</span>
            {renderSimpleOperandEditor({
              operand: groupedOperand.left,
              statOperandOptions,
              defaultStatOperandId,
              onTypeChange: (value) =>
                onUpdate(
                  updateExpressionGroupedOperandType(
                    normalizedExpression,
                    "left",
                    value,
                  ),
                ),
              onValueChange: (value) =>
                onUpdate(
                  updateExpressionGroupedOperandValue(
                    normalizedExpression,
                    "left",
                    value,
                  ),
                ),
              placeholder: "Left Amount",
              numberLabel: "Left Number",
              sourceLabel: "Left Source",
              targetLabel: "Left Target",
            })}

            <select
              className="character-inspector__input character-inspector__select"
              value={groupedOperand.operator}
              onChange={(e) =>
                onUpdate(
                  updateExpressionGroupedOperator(normalizedExpression, e.target.value),
                )
              }
            >
              <option value="+">+</option>
              <option value="-">-</option>
            </select>

            {renderSimpleOperandEditor({
              operand: groupedOperand.right,
              statOperandOptions,
              defaultStatOperandId,
              onTypeChange: (value) =>
                onUpdate(
                  updateExpressionGroupedOperandType(
                    normalizedExpression,
                    "right",
                    value,
                  ),
                ),
              onValueChange: (value) =>
                onUpdate(
                  updateExpressionGroupedOperandValue(
                    normalizedExpression,
                    "right",
                    value,
                  ),
                ),
              placeholder: "Right Amount",
              numberLabel: "Right Number",
              sourceLabel: "Right Source",
              targetLabel: "Right Target",
            })}
            <span className="character-inspector__equation-parenthesis">)</span>
          </span>
        )}
      </div>
    </>
  );

  return (
    <div className={rootClassName}>{content}</div>
  );
}
