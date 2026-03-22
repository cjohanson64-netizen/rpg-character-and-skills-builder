import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeEffectOp } from "../../vocab";

const STORAGE_KEY = "tryangletree.worldCharacter";

function createEmptyWorldCharacter() {
  return {
    nodes: [],
    interactions: [],
  };
}

function normalizeWorldEffect(effect) {
  if (!effect || typeof effect !== "object") {
    return null;
  }

  const normalizedOps = Array.isArray(effect.ops)
    ? effect.ops.map(normalizeEffectOp).filter(Boolean)
    : [];

  if (normalizedOps.length === 0) {
    return null;
  }

  return {
    target: typeof effect.target === "string" && effect.target ? effect.target : "root",
    ops: normalizedOps,
  };
}

function normalizeWorldInteraction(interaction) {
  return {
    id: typeof interaction?.id === "string" ? interaction.id : "",
    subject: typeof interaction?.subject === "string" ? interaction.subject : "",
    relation: typeof interaction?.relation === "string" ? interaction.relation : "",
    definitionId:
      typeof interaction?.definitionId === "string" ? interaction.definitionId : "",
    definitionName:
      typeof interaction?.definitionName === "string"
        ? interaction.definitionName
        : "",
    baseRelation:
      typeof interaction?.baseRelation === "string" ? interaction.baseRelation : "",
    object: typeof interaction?.object === "string" ? interaction.object : "",
    timestamp:
      typeof interaction?.timestamp === "string" && interaction.timestamp
        ? interaction.timestamp
        : new Date().toISOString(),
    effect: normalizeWorldEffect(interaction?.effect),
    effectApplied: Boolean(interaction?.effectApplied),
    resultSnapshot: interaction?.resultSnapshot ?? null,
    resultMeta:
      interaction?.resultMeta && typeof interaction.resultMeta === "object"
        ? interaction.resultMeta
        : null,
  };
}

function readWorldCharacter() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyWorldCharacter();

    const parsed = JSON.parse(raw);
    const storedInteractions = Array.isArray(parsed?.interactions)
      ? parsed.interactions
      : Array.isArray(parsed?.edges)
        ? parsed.edges
        : [];

    return {
      nodes: Array.isArray(parsed?.nodes) ? parsed.nodes : [],
      interactions: storedInteractions
        .map(normalizeWorldInteraction)
        .filter((interaction) => interaction.id),
    };
  } catch {
    return createEmptyWorldCharacter();
  }
}

function writeWorldCharacter(worldCharacter) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(worldCharacter));
}

function clearWorldCharacterStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

function createWorldInteractionId(subject, relation, object) {
  return `world:${subject}:${relation}:${object}:${Date.now()}:${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function useWorldCharacter(instances) {
  const [storedWorldCharacter, setStoredWorldCharacter] = useState(() => readWorldCharacter());

  const nodes = useMemo(
    () =>
      instances.map((instance) => ({
        id: instance.name,
        label: instance.name,
      })),
    [instances],
  );

  const validNodeIds = useMemo(
    () => new Set(nodes.map((node) => node.id)),
    [nodes],
  );

  const interactions = useMemo(
    () =>
      storedWorldCharacter.interactions.filter(
        (interaction) =>
          validNodeIds.has(interaction.subject) &&
          validNodeIds.has(interaction.object),
      ),
    [storedWorldCharacter.interactions, validNodeIds],
  );

  useEffect(() => {
    writeWorldCharacter({
      nodes,
      interactions,
    });
  }, [interactions, nodes]);

  const addEdge = useCallback(
    (subject, relation, object, effect = null, metadata = null) => {
    const nextRelation = relation?.trim();
    if (!subject || !object || !nextRelation) return;

    setStoredWorldCharacter((current) => ({
      ...current,
      interactions: [
        ...current.interactions,
        {
          id: createWorldInteractionId(subject, nextRelation, object),
          subject,
          relation: nextRelation,
          definitionId:
            typeof metadata?.definitionId === "string" ? metadata.definitionId : "",
          definitionName:
            typeof metadata?.definitionName === "string"
              ? metadata.definitionName
              : "",
          baseRelation:
            typeof metadata?.baseRelation === "string" ? metadata.baseRelation : "",
          object,
          timestamp: new Date().toISOString(),
          effect: normalizeWorldEffect(effect),
          effectApplied: Boolean(metadata?.effectApplied),
          resultSnapshot: metadata?.resultSnapshot ?? null,
          resultMeta:
            metadata?.resultMeta && typeof metadata.resultMeta === "object"
              ? metadata.resultMeta
              : null,
        },
      ],
    }));
    },
    [],
  );

  const updateEdge = useCallback((edgeId, updates) => {
    setStoredWorldCharacter((current) => ({
      ...current,
      interactions: current.interactions.map((interaction) =>
        interaction.id === edgeId
          ? {
              ...interaction,
              subject: updates.subject,
              relation: updates.relation,
              definitionId:
                typeof updates.definitionId === "string"
                  ? updates.definitionId
                  : interaction.definitionId ?? "",
              definitionName:
                typeof updates.definitionName === "string"
                  ? updates.definitionName
                  : interaction.definitionName ?? "",
              baseRelation:
                typeof updates.baseRelation === "string"
                  ? updates.baseRelation
                  : interaction.baseRelation ?? "",
              object: updates.object,
              effect: normalizeWorldEffect(updates.effect),
              resultMeta: updates.resultMeta ?? interaction.resultMeta ?? null,
              resultSnapshot:
                updates.resultSnapshot ?? interaction.resultSnapshot ?? null,
              effectApplied:
                typeof updates.effectApplied === "boolean"
                  ? updates.effectApplied
                  : interaction.effectApplied,
            }
          : interaction,
      ),
    }));
  }, []);

  const deleteEdge = useCallback((edgeId) => {
    setStoredWorldCharacter((current) => ({
      ...current,
      interactions: current.interactions.filter(
        (interaction) => interaction.id !== edgeId,
      ),
    }));
  }, []);

  const clearWorldCharacter = useCallback(() => {
    clearWorldCharacterStorage();
    setStoredWorldCharacter(createEmptyWorldCharacter());
  }, []);

  return {
    worldCharacter: {
      nodes,
      interactions,
      edges: interactions,
    },
    addEdge,
    updateEdge,
    deleteEdge,
    clearWorldCharacter,
  };
}
