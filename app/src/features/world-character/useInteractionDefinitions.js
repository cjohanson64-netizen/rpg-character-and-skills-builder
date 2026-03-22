import { useCallback, useEffect, useMemo, useState } from "react";
import { WORLD_RELATION_VOCAB, normalizeEffectOp } from "../../vocab";

const STORAGE_KEY = "tryangletree.interactionDefinitions";

function createEmptyInteractionDefinitions() {
  return [];
}

function normalizeBaseRelation(baseRelation) {
  if (typeof baseRelation !== "string") {
    return "";
  }

  const trimmedBaseRelation = baseRelation.trim();
  return trimmedBaseRelation ? trimmedBaseRelation : "";
}

function isKnownBaseRelation(baseRelation) {
  return Object.prototype.hasOwnProperty.call(WORLD_RELATION_VOCAB, baseRelation);
}

function normalizeDefinitionName(name, fallbackName) {
  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }

  if (typeof fallbackName === "string" && fallbackName.trim()) {
    return fallbackName.trim();
  }

  return "";
}

function normalizeDefinitionEffect(effect) {
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

function normalizeInteractionDefinition(definition) {
  const legacyRelation =
    typeof definition?.relation === "string" ? definition.relation.trim() : "";
  const baseRelation = normalizeBaseRelation(
    definition?.baseRelation ?? legacyRelation,
  );
  const fallbackLabel =
    typeof definition?.label === "string" ? definition.label.trim() : "";
  const name = normalizeDefinitionName(
    definition?.name,
    fallbackLabel || baseRelation,
  );

  return {
    id: typeof definition?.id === "string" ? definition.id : "",
    name,
    baseRelation,
    effect: normalizeDefinitionEffect(definition?.effect),
  };
}

function readInteractionDefinitions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyInteractionDefinitions();

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed
          .map(normalizeInteractionDefinition)
          .filter((definition) => definition.id && definition.baseRelation)
      : createEmptyInteractionDefinitions();
  } catch {
    return createEmptyInteractionDefinitions();
  }
}

function writeInteractionDefinitions(definitions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(definitions));
}

function clearInteractionDefinitionStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

function slugifyDefinitionName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createInteractionDefinitionId(name, baseRelation) {
  const slug = slugifyDefinitionName(name) || baseRelation || "definition";

  return `interaction-definition:${slug}:${Date.now()}:${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function useInteractionDefinitions() {
  const [definitions, setDefinitions] = useState(() => readInteractionDefinitions());

  useEffect(() => {
    writeInteractionDefinitions(definitions);
  }, [definitions]);

  const sortedDefinitions = useMemo(
    () =>
      [...definitions].sort((left, right) => {
        const nameComparison = left.name.localeCompare(right.name);
        if (nameComparison !== 0) {
          return nameComparison;
        }

        return left.baseRelation.localeCompare(right.baseRelation);
      }),
    [definitions],
  );

  const createDefinition = useCallback((definition) => {
    const name = normalizeDefinitionName(definition?.name, "");
    const baseRelation = normalizeBaseRelation(definition?.baseRelation);
    if (!name || !baseRelation || !isKnownBaseRelation(baseRelation)) return;

    setDefinitions((current) => [
      ...current,
      {
        id: createInteractionDefinitionId(name, baseRelation),
        name,
        baseRelation,
        effect: normalizeDefinitionEffect(definition?.effect),
      },
    ]);
  }, []);

  const updateDefinition = useCallback((definitionId, updates) => {
    setDefinitions((current) =>
      current.map((definition) =>
        definition.id === definitionId
          ? {
              ...definition,
              name: normalizeDefinitionName(updates?.name, definition.name),
              baseRelation:
                (isKnownBaseRelation(normalizeBaseRelation(updates?.baseRelation))
                  ? normalizeBaseRelation(updates?.baseRelation)
                  : "") || definition.baseRelation,
              effect: normalizeDefinitionEffect(updates?.effect),
            }
          : definition,
      ),
    );
  }, []);

  const deleteDefinition = useCallback((definitionId) => {
    setDefinitions((current) =>
      current.filter((definition) => definition.id !== definitionId),
    );
  }, []);

  const clearDefinitions = useCallback(() => {
    clearInteractionDefinitionStorage();
    setDefinitions(createEmptyInteractionDefinitions());
  }, []);

  return {
    interactionDefinitions: sortedDefinitions,
    createDefinition,
    updateDefinition,
    deleteDefinition,
    clearDefinitions,
  };
}
