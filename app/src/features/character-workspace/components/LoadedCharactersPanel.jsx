import React, { useMemo, useState } from "react";
import LoadedCharacterCard from "./LoadedCharacterCard";

const CORE_STAT_KEYS = ["hp", "atk", "def", "int", "res", "spd"];
const STATUS_SECTIONS = [
  { key: "statuses", label: "Statuses" },
  { key: "buffs", label: "Buffs" },
  { key: "debuffs", label: "Debuffs" },
];

function formatScalarValue(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function toDisplayItems(value) {
  if (value === null || value === undefined || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => formatScalarValue(item))
      .filter(Boolean);
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, entryValue]) => {
        const formattedValue = formatScalarValue(entryValue);
        return formattedValue ? `${key}: ${formattedValue}` : key;
      })
      .filter(Boolean);
  }

  return [formatScalarValue(value)].filter(Boolean);
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

function getMaxHpValue(instance, rootNode) {
  const rootValue = rootNode?.value ?? {};
  const rootState = rootNode?.state ?? {};
  const rootMeta = rootNode?.meta ?? {};

  const explicitMaxHp = [
    rootState.maxHp,
    rootMeta.maxHp,
    rootValue.maxHp,
    rootState.baseHp,
    rootMeta.baseHp,
    rootValue.baseHp,
  ]
    .map((value) => toNumber(value))
    .find((value) => value > 0);

  if (explicitMaxHp) {
    return explicitMaxHp;
  }

  const sourceDefinedHp = parseBaseHpFromCharacterSource(instance?.source);
  if (typeof sourceDefinedHp === "number" && sourceDefinedHp > 0) {
    return sourceDefinedHp;
  }

  const fallbackHp = toNumber(rootState.hp);
  return fallbackHp > 0 ? fallbackHp : null;
}

function buildCharacterCard(instance) {
  const snapshot = instance?.snapshot ?? null;
  const rootNode = getRootNode(snapshot);
  const rootValue = rootNode?.value ?? {};
  const rootState = rootNode?.state ?? {};
  const rootMeta = rootNode?.meta ?? {};
  const rootId = snapshot?.root ?? rootNode?.id ?? "none";
  const maxHpValue = getMaxHpValue(instance, rootNode);
  const stats = CORE_STAT_KEYS.map((statKey) => ({
    key: statKey,
    label: statKey.toUpperCase(),
    value:
      statKey === "hp"
        ? (() => {
            const currentHp =
              rootState[statKey] ??
              rootMeta[statKey] ??
              rootValue[statKey] ??
              null;

            if (currentHp === null || currentHp === undefined || currentHp === "") {
              return null;
            }

            return maxHpValue ? `${currentHp} / ${maxHpValue}` : String(currentHp);
          })()
        : rootState[statKey] ??
          rootMeta[statKey] ??
          rootValue[statKey] ??
          null,
  }));

  const statuses = STATUS_SECTIONS.map((section) => ({
    ...section,
    items: toDisplayItems(
      rootState[section.key] ??
        rootMeta[section.key] ??
        rootValue[section.key] ??
        null,
    ),
  })).filter((section) => section.items.length > 0);

  return {
    id: instance?.name ?? rootId,
    displayName: instance?.name || rootValue.name || rootId || "Unnamed Character",
    className: rootValue.name || rootMeta.name || rootNode?.id || "Unknown Class",
    type:
      rootValue.type ??
      rootMeta.type ??
      rootState.type ??
      snapshot?.characterName ??
      null,
    stats,
    statuses,
    rawSnapshot: snapshot,
  };
}

export default function LoadedCharactersPanel({
  instances,
  selectedCharacterName,
  title = "Loaded Characters",
  emptyMessage = "No character instances are loaded into the workspace yet.",
}) {
  const [expandedCharacterIds, setExpandedCharacterIds] = useState(() => new Set());
  const characterCards = useMemo(
    () => (instances ?? []).map(buildCharacterCard),
    [instances],
  );

  function toggleExpanded(characterId) {
    setExpandedCharacterIds((current) => {
      const next = new Set(current);
      if (next.has(characterId)) {
        next.delete(characterId);
      } else {
        next.add(characterId);
      }

      return next;
    });
  }

  return (
    <div className="character-inspector__panel character-inspector__loaded">
      <div className="character-inspector__persistence-header">
        <h2 className="character-inspector__section-title">{title}</h2>
        <div className="character-inspector__persistence-meta">
          {characterCards.length} loaded instance{characterCards.length === 1 ? "" : "s"}
        </div>
      </div>

      {characterCards.length === 0 ? (
        <div className="character-inspector__status">{emptyMessage}</div>
      ) : (
        <div className="character-inspector__loaded-grid">
          {characterCards.map((card) => {
            const isExpanded = expandedCharacterIds.has(card.id);
            const isSelected = card.displayName === selectedCharacterName;

            return (
              <LoadedCharacterCard
                key={card.id}
                card={card}
                isExpanded={isExpanded}
                isSelected={isSelected}
                onToggleExpanded={() => toggleExpanded(card.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
