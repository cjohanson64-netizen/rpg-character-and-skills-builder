import { useState } from "react";
import {
  OP_VOCAB,
  WORLD_RELATION_VOCAB,
  createEmptyNumericDeriveExpression,
  getDefaultOpId,
  getOpDefinition,
  getWorldRelationContract,
  isAllowedOpForRelation,
  parseNumericDeriveExpression,
  validateEffectOp,
} from "../../../vocab";
import { normalizeDeriveExpression } from "../utils/deriveExpression";

export function useInteractionDefinitionEditor({
  onCreateInteractionDefinition,
  onUpdateInteractionDefinition,
}) {
  const [selectedDefinitionId, setSelectedDefinitionId] = useState(null);
  const [definitionName, setDefinitionName] = useState("");
  const [definitionBaseRelation, setDefinitionBaseRelation] = useState("");
  const [definitionEffectTarget, setDefinitionEffectTarget] = useState("root");
  const [definitionEffectOps, setDefinitionEffectOps] = useState([]);

  const availableWorldRelations = Object.values(WORLD_RELATION_VOCAB);
  const definitionBaseRelationExistsInVocab = availableWorldRelations.some(
    (r) => r.id === definitionBaseRelation,
  );
  const currentDefinitionBaseRelation =
    definitionBaseRelation && definitionBaseRelationExistsInVocab
      ? definitionBaseRelation
      : availableWorldRelations[0]?.id ?? "";
  const currentDefinitionRelationContract = getWorldRelationContract(
    currentDefinitionBaseRelation,
  );
  const availableDefinitionOpDefinitions = currentDefinitionRelationContract
    ? Object.values(OP_VOCAB).filter((op) =>
        isAllowedOpForRelation(currentDefinitionBaseRelation, op.id),
      )
    : Object.values(OP_VOCAB);
  const allowedDefinitionKeyIds = currentDefinitionRelationContract
    ? [
        ...currentDefinitionRelationContract.allowedStatKeys,
        ...currentDefinitionRelationContract.allowedStateKeys,
      ]
    : [];

  const definitionEffectOpStates = definitionEffectOps.map((op) => {
    const definition = getOpDefinition(op.type);
    const validation = validateEffectOp(op);
    return {
      definition,
      status: validation.status,
      reason: validation.reason,
      normalized: validation.normalized,
    };
  });
  const normalizedDefinitionEffectOps = definitionEffectOpStates
    .map((s) => s.normalized)
    .filter(Boolean);
  const hasIncompleteDefinitionEffectOps = definitionEffectOpStates.some(
    (s) => s.status === "invalid",
  );
  const firstInvalidOp = definitionEffectOpStates.find((s) => s.status === "invalid");
  const definitionSaveValidationMessage = !definitionName.trim()
    ? "Enter a custom interaction name to save this definition."
    : !currentDefinitionBaseRelation
      ? "Choose a base relation family to save this definition."
      : hasIncompleteDefinitionEffectOps
        ? `Fix invalid payload op: ${firstInvalidOp?.definition.label ?? "op"}. ${firstInvalidOp?.reason ?? ""}`.trim()
        : "";

  function createDefaultNumericEffectDerivation(baseRelation = currentDefinitionBaseRelation) {
    const defaultSourceStat = baseRelation === "heals" ? "int" : "atk";
    const defaultTargetStat = baseRelation === "heals" ? "res" : "def";

    return {
      mode: "delta",
      base: "current",
      operator: "+",
      operand: {
        type: "group",
        left: {
          type: "sourceStat",
          value: defaultSourceStat,
        },
        operator: "-",
        right: {
          type: "targetStat",
          value: defaultTargetStat,
        },
      },
    };
  }

  function getPreferredDefinitionOpId() {
    if (
      currentDefinitionBaseRelation === "attacks" ||
      currentDefinitionBaseRelation === "heals"
    ) {
      return "numericEffect.state";
    }

    return availableDefinitionOpDefinitions[0]?.id ?? getDefaultOpId();
  }

  function createDefinitionDraftOp(opId) {
    if (opId === "numericEffect.state") {
      return {
        type: "numericEffect.state",
        key: "hp",
        baseAmount: "",
        additionalDerivation: createDefaultNumericEffectDerivation(
          currentDefinitionBaseRelation,
        ),
        minimumAmount: "",
      };
    }

    if (opId === "graft.state") {
      const preferredConditionLane =
        allowedDefinitionKeyIds.find((keyId) => keyId !== "hp") ?? "statuses";

      return {
        type: "graft.state",
        key: preferredConditionLane,
        value: "poison",
      };
    }

    const def = getOpDefinition(opId);
    return def.fields.reduce(
      (nextOp, field) => {
        if (field.id === "key") return { ...nextOp, key: "hp" };
        if (field.id === "expression")
          return {
            ...nextOp,
            expression: createEmptyNumericDeriveExpression(
              def.allowedTokens[0] ?? "current",
            ),
          };
        return { ...nextOp, [field.id]: "" };
      },
      { type: def.id },
    );
  }

  function handleSelectInteractionDefinition(definition) {
    setSelectedDefinitionId(definition.id);
    setDefinitionName(definition.name ?? "");
    setDefinitionBaseRelation(definition.baseRelation ?? "");
    setDefinitionEffectTarget(definition.effect?.target ?? "root");
    setDefinitionEffectOps(
      definition.effect?.ops?.length
        ? definition.effect.ops.map((op) => {
            const opDef = getOpDefinition(op.type);
            return opDef.fields.reduce(
              (nextOp, field) => {
                if (field.id === "additionalDerivation") {
                  return {
                    ...nextOp,
                    additionalDerivation:
                      op.additionalDerivation && typeof op.additionalDerivation === "object"
                        ? op.additionalDerivation
                        : createDefaultNumericEffectDerivation(definition.baseRelation),
                  };
                }
                if (field.id === "expression") {
                  return {
                    ...nextOp,
                    expression:
                      parseNumericDeriveExpression(op.expression) ??
                      createEmptyNumericDeriveExpression(
                        opDef.allowedTokens[0] ?? "current",
                      ),
                  };
                }
                if (field.id === "baseAmount" || field.id === "minimumAmount") {
                  return {
                    ...nextOp,
                    [field.id]:
                      typeof op[field.id] === "number" || typeof op[field.id] === "string"
                        ? String(op[field.id])
                        : "",
                  };
                }
                if (field.id === "key" && op.type === "numericEffect.state") {
                  return {
                    ...nextOp,
                    key: "hp",
                  };
                }
                return {
                  ...nextOp,
                  [field.id]: typeof op[field.id] === "string" ? op[field.id] : "",
                };
              },
              { type: op.type },
            );
          })
        : [],
    );
  }

  function resetDefinitionForm() {
    setSelectedDefinitionId(null);
    setDefinitionName("");
    setDefinitionBaseRelation(availableWorldRelations[0]?.id ?? "");
    setDefinitionEffectTarget("root");
    setDefinitionEffectOps([]);
  }

  function updateDefinitionEffectOp(index, key, value) {
    setDefinitionEffectOps((cur) =>
      cur.map((op, i) => (i === index ? { ...op, [key]: value } : op)),
    );
  }

  function handleDefinitionEffectTypeChange(index, nextType) {
    setDefinitionEffectOps((cur) =>
      cur.map((op, i) => (i === index ? createDefinitionDraftOp(nextType) : op)),
    );
  }

  function addDefinitionEffectOp() {
    const nextOpId = getPreferredDefinitionOpId();
    setDefinitionEffectOps((cur) => [...cur, createDefinitionDraftOp(nextOpId)]);
  }

  function removeDefinitionEffectOp(index) {
    setDefinitionEffectOps((cur) => cur.filter((_, i) => i !== index));
  }

  function setDefinitionDeriveExpression(index, nextExpression) {
    setDefinitionEffectOps((cur) =>
      cur.map((op, i) =>
        i === index
          ? { ...op, expression: normalizeDeriveExpression(nextExpression) }
          : op,
      ),
    );
  }

  function setDefinitionNumericEffectDerivation(index, nextExpression) {
    setDefinitionEffectOps((cur) =>
      cur.map((op, i) =>
        i === index
          ? { ...op, additionalDerivation: normalizeDeriveExpression(nextExpression) }
          : op,
      ),
    );
  }

  function appendTokenToDefinitionOp(index, tokenId) {
    const def = getOpDefinition(definitionEffectOps[index]?.type);
    const fieldId = def.valueMode === "expression" ? "expression" : "value";
    const existing =
      typeof definitionEffectOps[index]?.[fieldId] === "string"
        ? definitionEffectOps[index][fieldId]
        : "";
    updateDefinitionEffectOp(index, fieldId, existing ? `${existing} ${tokenId}` : tokenId);
  }

  function handleSaveInteractionDefinition(e) {
    e.preventDefault();
    if (
      !definitionName.trim() ||
      !currentDefinitionBaseRelation ||
      hasIncompleteDefinitionEffectOps
    ) {
      return;
    }

    const nextEffect =
      normalizedDefinitionEffectOps.length > 0
        ? { target: definitionEffectTarget, ops: normalizedDefinitionEffectOps }
        : null;

    if (selectedDefinitionId && onUpdateInteractionDefinition) {
      onUpdateInteractionDefinition(selectedDefinitionId, {
        name: definitionName.trim(),
        baseRelation: currentDefinitionBaseRelation,
        effect: nextEffect,
      });
    } else if (onCreateInteractionDefinition) {
      onCreateInteractionDefinition({
        name: definitionName.trim(),
        baseRelation: currentDefinitionBaseRelation,
        effect: nextEffect,
      });
    }

    resetDefinitionForm();
  }

  return {
    selectedDefinitionId,
    definitionName,
    setDefinitionName,
    definitionBaseRelation,
    currentDefinitionBaseRelation,
    setDefinitionBaseRelation,
    definitionBaseRelationExistsInVocab,
    definitionEffectTarget,
    setDefinitionEffectTarget,
    definitionEffectOps,
    availableWorldRelations,
    availableDefinitionOpDefinitions,
    allowedDefinitionKeyIds,
    currentDefinitionRelationContract,
    definitionEffectOpStates,
    hasIncompleteDefinitionEffectOps,
    definitionSaveValidationMessage,
    handleSelectInteractionDefinition,
    resetDefinitionForm,
    updateDefinitionEffectOp,
    handleDefinitionEffectTypeChange,
    addDefinitionEffectOp,
    removeDefinitionEffectOp,
    setDefinitionDeriveExpression,
    setDefinitionNumericEffectDerivation,
    appendTokenToDefinitionOp,
    handleSaveInteractionDefinition,
  };
}
