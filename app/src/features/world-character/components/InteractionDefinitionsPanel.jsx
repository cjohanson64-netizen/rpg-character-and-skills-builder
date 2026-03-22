import React from "react";
import {
  STATE_KEY_VOCAB,
  STAT_VOCAB,
  WORLD_RELATION_CONTRACTS,
  createEmptyNumericDeriveExpression,
  getOpDefinition,
  isAllowedOpForRelation,
  serializeNumericDeriveExpression,
} from "../../../vocab";
import CharacterDeriveExpressionBuilder from "./CharacterDeriveExpressionBuilder";
import CharacterNumericEffectBuilder from "./CharacterNumericEffectBuilder";
import {
  normalizeDeriveExpression,
  normalizeSimpleDeriveOperand,
  updateExpressionGroupedOperandType,
  updateExpressionGroupedOperandValue,
  updateExpressionGroupedOperator,
  updateExpressionOperandMode,
  updateExpressionSimpleOperandType,
  updateExpressionSimpleOperandValue,
} from "../utils/deriveExpression";

const WORLD_EFFECT_TARGETS = ["root"];
const statOperandOptions = Object.values(STAT_VOCAB);
const defaultStatOperandId = statOperandOptions[0]?.id ?? "hp";
const CONDITION_OPTIONS = [
  { id: "poison", label: "Poison" },
  { id: "stun", label: "Stun" },
  { id: "confuse", label: "Confuse" },
  { id: "freeze", label: "Freeze" },
  { id: "shield", label: "Shield" },
  { id: "regen", label: "Regen" },
];

export default function InteractionDefinitionsPanel({
  savedInteractionDefinitions,
  handleSaveInteractionDefinition,
  definitionName,
  setDefinitionName,
  currentDefinitionBaseRelation,
  setDefinitionBaseRelation,
  availableWorldRelations,
  definitionBaseRelationExistsInVocab,
  definitionBaseRelation,
  definitionEffectTarget,
  setDefinitionEffectTarget,
  hasIncompleteDefinitionEffectOps,
  selectedDefinitionId,
  resetDefinitionForm,
  definitionSaveValidationMessage,
  currentDefinitionRelationContract,
  addDefinitionEffectOp,
  definitionEffectOps,
  definitionEffectOpStates,
  allowedDefinitionKeyIds,
  availableDefinitionOpDefinitions,
  handleDefinitionEffectTypeChange,
  updateDefinitionEffectOp,
  setDefinitionDeriveExpression,
  setDefinitionNumericEffectDerivation,
  removeDefinitionEffectOp,
  handleSelectInteractionDefinition,
  onDeleteInteractionDefinition,
}) {
  function formatNumericEffectSummary(op) {
    const derivationSummary = serializeNumericDeriveExpression(op.additionalDerivation);
    return [
      `base: ${op.baseAmount}`,
      `minimum: ${op.minimumAmount}`,
      `derivation: ${derivationSummary || "invalid"}`,
    ].join(" | ");
  }

  function formatConditionSummary(op) {
    return [`lane: ${op.key}`, `condition: ${op.value}`].join(" | ");
  }

  function getNumericEffectPresentation(baseRelation) {
    if (baseRelation === "attacks") {
      return {
        effectLabel: "damage",
        effectOperatorSymbol: "-",
      };
    }

    if (baseRelation === "heals") {
      return {
        effectLabel: "healing",
        effectOperatorSymbol: "+",
      };
    }

    return {
      effectLabel: "effect",
      effectOperatorSymbol: "+",
    };
  }

  return (
    <div className="character-inspector__panel character-inspector__world">
      <div className="character-inspector__persistence-header">
        <h2 className="character-inspector__section-title">Interaction Definitions</h2>
        <div className="character-inspector__persistence-meta">
          {savedInteractionDefinitions.length} reusable relation definitions
        </div>
      </div>

      <form
        onSubmit={handleSaveInteractionDefinition}
        className="character-inspector__world-form"
      >
        <input
          className="character-inspector__input"
          value={definitionName}
          onChange={(e) => setDefinitionName(e.target.value)}
          placeholder="Custom interaction name"
        />

        <select
          className="character-inspector__input character-inspector__select"
          value={currentDefinitionBaseRelation}
          onChange={(e) => setDefinitionBaseRelation(e.target.value)}
          disabled={!availableWorldRelations.length}
        >
          {!definitionBaseRelationExistsInVocab && definitionBaseRelation ? (
            <option value={definitionBaseRelation}>
              {definitionBaseRelation} (Legacy)
            </option>
          ) : null}
          {availableWorldRelations.map((relationEntry) => (
            <option key={relationEntry.id} value={relationEntry.id}>
              {relationEntry.label}
            </option>
          ))}
        </select>

        <select
          className="character-inspector__input character-inspector__select"
          value={definitionEffectTarget}
          onChange={(e) => setDefinitionEffectTarget(e.target.value)}
        >
          {WORLD_EFFECT_TARGETS.map((target) => (
            <option key={target} value={target}>
              {target}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={
            !definitionName.trim() ||
            !currentDefinitionBaseRelation ||
            hasIncompleteDefinitionEffectOps
          }
        >
          {selectedDefinitionId ? "Update Definition" : "Save Definition"}
        </button>

        <button type="button" onClick={resetDefinitionForm}>
          New Definition
        </button>
      </form>

      {definitionSaveValidationMessage ? (
        <div className="character-inspector__status">
          {definitionSaveValidationMessage}
        </div>
      ) : null}

      <div className="character-inspector__world-effect-editor">
        <div className="character-inspector__world-effect-header">
          <h3 className="character-inspector__section-title">Definition Effect Payload</h3>
          <button type="button" onClick={addDefinitionEffectOp}>
            Add Op
          </button>
        </div>

        {currentDefinitionRelationContract ? (
          <div className="character-inspector__world-token-hint">
            {currentDefinitionRelationContract.notes}
          </div>
        ) : definitionBaseRelation &&
          !WORLD_RELATION_CONTRACTS[definitionBaseRelation] ? (
          <div className="character-inspector__world-token-hint">
            Legacy relation without a formal contract. All op types remain
            available for compatibility.
          </div>
        ) : null}

        {definitionEffectOps.length === 0 ? (
          <div className="character-inspector__status">
            No effect ops. Definitions can still be saved without effects.
          </div>
        ) : (
          <div className="character-inspector__world-effect-ops">
            {definitionEffectOps.map((op, index) => {
              const definition = getOpDefinition(op.type);
              const opState = definitionEffectOpStates[index];
              const isNumericDeriveOp =
                op.type === "derive.state" || op.type === "derive.meta";
              const isNumericEffectOp = op.type === "numericEffect.state";
              const currentOpAllowed = isAllowedOpForRelation(
                currentDefinitionBaseRelation,
                op.type,
              );
              const availableKeyOptions = allowedDefinitionKeyIds.map((keyId) => {
                const statDefinition = STAT_VOCAB[keyId];
                const stateKeyDefinition = STATE_KEY_VOCAB[keyId];
                const vocabularyEntry = statDefinition ?? stateKeyDefinition;

                return {
                  id: keyId,
                  label: vocabularyEntry?.label ?? keyId,
                };
              });
              const numericEffectPresentation = getNumericEffectPresentation(
                currentDefinitionBaseRelation,
              );
              const availableConditionKeyOptions = availableKeyOptions.filter(
                (option) => option.id !== "hp",
              );

              return (
                <div
                  key={`${selectedDefinitionId ?? "new-definition"}:${index}`}
                  className="character-inspector__world-effect-op"
                >
                  <div className="character-inspector__world-effect-row">
                    <div className="character-inspector__world-effect-kind">
                      <label className="character-inspector__equation-toolbar">
                        <span className="character-inspector__equation-toolbar-label">
                          Effect Type
                        </span>
                        <select
                          className="character-inspector__input character-inspector__select"
                          value={op.type}
                          onChange={(e) =>
                            handleDefinitionEffectTypeChange(index, e.target.value)
                          }
                        >
                          {!currentOpAllowed ? (
                            <option value={op.type}>
                              {definition.label} (Legacy)
                            </option>
                          ) : null}
                          {availableDefinitionOpDefinitions.map((opDefinition) => (
                            <option key={opDefinition.id} value={opDefinition.id}>
                              {opDefinition.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    {isNumericEffectOp
                      ? (() => {
                          return (
                            <CharacterNumericEffectBuilder
                              op={op}
                              normalizedDerivation={normalizeDeriveExpression(
                                op.additionalDerivation,
                              )}
                              statOperandOptions={statOperandOptions}
                              effectLabel={numericEffectPresentation.effectLabel}
                              onBaseAmountChange={(value) =>
                                updateDefinitionEffectOp(index, "baseAmount", value)
                              }
                              onMinimumAmountChange={(value) =>
                                updateDefinitionEffectOp(index, "minimumAmount", value)
                              }
                              onDerivationUpdate={(nextExpression) =>
                                setDefinitionNumericEffectDerivation(index, nextExpression)
                              }
                            />
                          );
                        })()
                      : op.type === "graft.state"
                        ? (() => {
                            const keyValue =
                              typeof op.key === "string" ? op.key : "";
                            const valueText =
                              typeof op.value === "string" ? op.value : "";
                            const isKnownKey = availableConditionKeyOptions.some(
                              (option) => option.id === keyValue,
                            );
                            const isKnownCondition = CONDITION_OPTIONS.some(
                              (condition) => condition.id === valueText,
                            );

                            return (
                              <div className="character-inspector__equation-card character-inspector__world-effect-expression">
                                <div className="character-inspector__equation-header">
                                  <div className="character-inspector__equation-title">
                                    Apply Condition
                                  </div>
                                </div>

                                <div className="character-inspector__equation-formula character-inspector__equation-formula--wrapped">
                                  <span className="character-inspector__equation-chip character-inspector__equation-chip--result">
                                    condition
                                  </span>
                                  <span className="character-inspector__equation-symbol">=</span>

                                  <label className="character-inspector__equation-labeled-field">
                                    <span>lane</span>
                                    <select
                                      className="character-inspector__input character-inspector__select"
                                      value={keyValue}
                                      onChange={(e) =>
                                        updateDefinitionEffectOp(
                                          index,
                                          "key",
                                          e.target.value,
                                        )
                                      }
                                    >
                                      {!isKnownKey && keyValue ? (
                                        <option value={keyValue}>{keyValue} (Legacy)</option>
                                      ) : null}
                                      {availableConditionKeyOptions.map((option) => (
                                        <option key={option.id} value={option.id}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  </label>

                                  <label className="character-inspector__equation-labeled-field">
                                    <span>apply</span>
                                    <select
                                      className="character-inspector__input character-inspector__select"
                                      value={valueText}
                                      onChange={(e) =>
                                        updateDefinitionEffectOp(
                                          index,
                                          "value",
                                          e.target.value,
                                        )
                                      }
                                    >
                                      {!isKnownCondition && valueText ? (
                                        <option value={valueText}>
                                          {valueText} (Legacy)
                                        </option>
                                      ) : null}
                                      {CONDITION_OPTIONS.map((condition) => (
                                        <option key={condition.id} value={condition.id}>
                                          {condition.label}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                </div>
                              </div>
                            );
                          })()
                      : definition.fields.map((field) => {
                      if (isNumericDeriveOp && field.id === "key") {
                        return null;
                      }

                      if (field.id === "key" && availableKeyOptions.length > 0) {
                        const keyValue =
                          typeof op[field.id] === "string" ? op[field.id] : "";
                        const isKnownKey = availableKeyOptions.some(
                          (option) => option.id === keyValue,
                        );

                        return (
                          <select
                            key={`${op.type}:${field.id}`}
                            className="character-inspector__input character-inspector__select"
                            value={keyValue}
                            onChange={(e) =>
                              updateDefinitionEffectOp(index, field.id, e.target.value)
                            }
                          >
                            {!isKnownKey && keyValue ? (
                              <option value={keyValue}>{keyValue} (Legacy)</option>
                            ) : null}
                            {availableKeyOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        );
                      }

                      if (isNumericDeriveOp && field.id === "expression") {
                        const expression =
                          op.expression && typeof op.expression === "object"
                            ? op.expression
                            : createEmptyNumericDeriveExpression(
                                definition.allowedTokens[0] ?? "current",
                              );
                        const normalizedExpression = normalizeDeriveExpression(expression);
                        const operandMode =
                          normalizedExpression.operand.type === "group" ? "group" : "simple";
                        const simpleOperand =
                          operandMode === "simple"
                            ? normalizeSimpleDeriveOperand(normalizedExpression.operand)
                            : null;
                        const groupedOperand =
                          operandMode === "group"
                            ? {
                                ...normalizedExpression.operand,
                                left: normalizeSimpleDeriveOperand(
                                  normalizedExpression.operand.left,
                                ),
                                right: normalizeSimpleDeriveOperand(
                                  normalizedExpression.operand.right,
                                ),
                              }
                            : null;

                        return (
                          <React.Fragment key={`${op.type}:${field.id}`}>
                            <CharacterDeriveExpressionBuilder
                              normalizedExpression={normalizedExpression}
                              allowedTokens={definition.allowedTokens}
                              title="Calculation"
                              resultLabel="next HP"
                              operandMode={operandMode}
                              simpleOperand={simpleOperand}
                              groupedOperand={groupedOperand}
                              statOperandOptions={statOperandOptions}
                              defaultStatOperandId={defaultStatOperandId}
                              onUpdate={(nextExpression) =>
                                setDefinitionDeriveExpression(index, nextExpression)
                              }
                              updateExpressionOperandMode={updateExpressionOperandMode}
                              updateExpressionSimpleOperandType={updateExpressionSimpleOperandType}
                              updateExpressionSimpleOperandValue={updateExpressionSimpleOperandValue}
                              updateExpressionGroupedOperandType={updateExpressionGroupedOperandType}
                              updateExpressionGroupedOperandValue={updateExpressionGroupedOperandValue}
                              updateExpressionGroupedOperator={updateExpressionGroupedOperator}
                            />
                          </React.Fragment>
                        );
                      }

                      return (
                        <input
                          key={`${op.type}:${field.id}`}
                          className="character-inspector__input"
                          value={typeof op[field.id] === "string" ? op[field.id] : ""}
                          onChange={(e) =>
                            updateDefinitionEffectOp(index, field.id, e.target.value)
                          }
                          placeholder={field.placeholder ?? field.label.toLowerCase()}
                        />
                      );
                    })}

                    <button
                      type="button"
                      className="character-inspector__world-op-delete"
                      onClick={() => removeDefinitionEffectOp(index)}
                    >
                      Remove Op
                    </button>
                  </div>

                  {isNumericEffectOp ? (
                    <div className="character-inspector__world-token-hint">
                      Calculation is fixed to HP in v1 and resolves base amount plus
                      derivation, floored by the minimum amount.
                    </div>
                  ) : op.type === "graft.state" ? (
                    <div className="character-inspector__world-token-hint">
                      Apply Condition adds a readable RPG effect like poison, stun,
                      confuse, freeze, shield, or regen.
                    </div>
                  ) : isNumericDeriveOp ? (
                    <div className="character-inspector__world-token-hint">
                      Legacy Calculation still edits HP with the same structured
                      expression builder.
                    </div>
                  ) : null}

                  {opState?.status === "invalid" && opState.reason ? (
                    <div className="character-inspector__status">{opState.reason}</div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="character-inspector__world-list">
        {savedInteractionDefinitions.length === 0 ? (
          <div className="character-inspector__status">No interaction definitions yet.</div>
        ) : (
          savedInteractionDefinitions.map((definition) => (
            <div key={definition.id} className="character-inspector__world-item">
              <button
                type="button"
                onClick={() => handleSelectInteractionDefinition(definition)}
                className={`character-inspector__list-button character-inspector__world-button ${
                  definition.id === selectedDefinitionId ? "is-selected" : ""
                }`}
              >
                <div className="character-inspector__list-button-title">
                  {definition.name}
                </div>
                <div className="character-inspector__list-button-subtitle">
                  definition id: {definition.id}
                </div>
                <div className="character-inspector__list-button-subtitle">
                  base family: {definition.baseRelation}
                </div>
                <div className="character-inspector__list-button-subtitle">
                  effect target: {definition.effect?.target ?? "none"}
                </div>
                {definition.effect?.ops?.length ? (
                  <div className="character-inspector__world-effect-details">
                    {definition.effect.ops.map((op, index) => {
                      const opDefinition = getOpDefinition(op.type);

                      return (
                        <div
                          key={`${definition.id}:op:${index}`}
                          className="character-inspector__list-button-subtitle"
                        >
                          {op.type}{" "}
                          {op.type === "numericEffect.state"
                            ? formatNumericEffectSummary(op)
                            : op.type === "graft.state"
                              ? formatConditionSummary(op)
                            : opDefinition.fields
                                .map((field) => `${field.id}: ${op[field.id]}`)
                                .join(" | ")}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="character-inspector__list-button-subtitle">
                    no effect payload
                  </div>
                )}
              </button>

              <button
                type="button"
                className="character-inspector__world-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteInteractionDefinition(definition.id);
                  if (selectedDefinitionId === definition.id) {
                    resetDefinitionForm();
                  }
                }}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
