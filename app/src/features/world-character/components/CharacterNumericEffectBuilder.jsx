import React from "react";

function getDefaultScaling(effectLabel) {
  if (effectLabel === "healing") {
    return {
      sourceStat: "int",
      targetStat: "res",
    };
  }

  return {
    sourceStat: "atk",
    targetStat: "def",
  };
}

function getScalingSelection(normalizedDerivation, effectLabel, statOperandOptions) {
  const defaults = getDefaultScaling(effectLabel);
  const fallbackStat = statOperandOptions[0]?.id ?? "atk";

  if (
    normalizedDerivation?.operand?.type === "group" &&
    normalizedDerivation.operand.left?.type === "sourceStat" &&
    normalizedDerivation.operand.right?.type === "targetStat"
  ) {
    return {
      sourceStat:
        normalizedDerivation.operand.left.value || defaults.sourceStat || fallbackStat,
      targetStat:
        normalizedDerivation.operand.right.value || defaults.targetStat || fallbackStat,
    };
  }

  return {
    sourceStat: defaults.sourceStat || fallbackStat,
    targetStat: defaults.targetStat || fallbackStat,
  };
}

export default function CharacterNumericEffectBuilder({
  op,
  normalizedDerivation,
  statOperandOptions,
  effectLabel = "effect",
  onBaseAmountChange,
  onMinimumAmountChange,
  onDerivationUpdate,
}) {
  const scaling = getScalingSelection(
    normalizedDerivation,
    effectLabel,
    statOperandOptions,
  );

  function updateScaling(nextSourceStat, nextTargetStat) {
    onDerivationUpdate({
      mode: "delta",
      base: "current",
      operator: "+",
      operand: {
        type: "group",
        left: {
          type: "sourceStat",
          value: nextSourceStat,
        },
        operator: "-",
        right: {
          type: "targetStat",
          value: nextTargetStat,
        },
      },
    });
  }

  return (
    <div className="character-inspector__equation-card character-inspector__world-effect-expression">
      <div className="character-inspector__equation-header">
        <div className="character-inspector__equation-title">Calculation</div>
        <span className="character-inspector__equation-badge">{effectLabel}</span>
      </div>

      <div className="character-inspector__ability-builder">
        <div className="character-inspector__ability-fields">
          <label className="character-inspector__equation-labeled-field">
            <span>Base Amount</span>
            <input
              type="number"
              step="any"
              className="character-inspector__input"
              value={
                typeof op.baseAmount === "number" || typeof op.baseAmount === "string"
                  ? op.baseAmount
                  : ""
              }
              onChange={(e) => onBaseAmountChange(e.target.value)}
              placeholder="Base Amount"
            />
          </label>

          <div className="character-inspector__equation-labeled-field character-inspector__ability-scaling">
            <span>Scaling</span>
            <div className="character-inspector__ability-scaling-row">
              <select
                className="character-inspector__input character-inspector__select"
                value={scaling.sourceStat}
                onChange={(e) =>
                  updateScaling(e.target.value, scaling.targetStat)
                }
              >
                {statOperandOptions.map((stat) => (
                  <option key={stat.id} value={stat.id}>
                    {stat.label}
                  </option>
                ))}
              </select>

              <span className="character-inspector__ability-scaling-operator">-</span>

              <select
                className="character-inspector__input character-inspector__select"
                value={scaling.targetStat}
                onChange={(e) =>
                  updateScaling(scaling.sourceStat, e.target.value)
                }
              >
                {statOperandOptions.map((stat) => (
                  <option key={stat.id} value={stat.id}>
                    {stat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="character-inspector__equation-labeled-field">
            <span>Minimum Amount</span>
            <input
              type="number"
              step="any"
              min="0"
              className="character-inspector__input"
              value={
                typeof op.minimumAmount === "number" ||
                typeof op.minimumAmount === "string"
                  ? op.minimumAmount
                  : ""
              }
              onChange={(e) => onMinimumAmountChange(e.target.value)}
              placeholder="Minimum Amount"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
