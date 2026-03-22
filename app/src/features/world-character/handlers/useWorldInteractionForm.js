import { useState } from "react";
import { WORLD_RELATION_VOCAB, getWorldRelationContract } from "../../../vocab";

export function useWorldInteractionForm({
  worldNodes,
  savedInteractionDefinitions,
  onCreateWorldEdge,
}) {
  const [worldSubject, setWorldSubject] = useState(() => worldNodes[0]?.id ?? "");
  const [worldObject, setWorldObject] = useState(
    () => worldNodes[1]?.id ?? worldNodes[0]?.id ?? "",
  );
  const [selectedWorldDefinitionId, setSelectedWorldDefinitionId] = useState("");
  const [worldInteractionError, setWorldInteractionError] = useState("");

  const authoredWorldDefinitions = savedInteractionDefinitions.filter(
    (d) => d.id && d.baseRelation,
  );
  const selectedWorldDefinition =
    authoredWorldDefinitions.find((d) => d.id === selectedWorldDefinitionId) ?? null;

  const currentWorldSubject = worldNodes.some((n) => n.id === worldSubject)
    ? worldSubject
    : worldNodes[0]?.id ?? "";
  const currentWorldObject = worldNodes.some((n) => n.id === worldObject)
    ? worldObject
    : worldNodes[0]?.id ?? "";

  const availableWorldRelations = Object.values(WORLD_RELATION_VOCAB);
  const baseRelationInVocab = availableWorldRelations.some(
    (r) => r.id === selectedWorldDefinition?.baseRelation,
  );
  const selectedWorldBaseRelation =
    selectedWorldDefinition?.baseRelation && baseRelationInVocab
      ? selectedWorldDefinition.baseRelation
      : "";
  const currentWorldRelationContract = getWorldRelationContract(selectedWorldBaseRelation);

  function handleCreateWorldEdge(e) {
    e.preventDefault();
    if (!currentWorldSubject || !selectedWorldDefinition || !currentWorldObject) return;
    try {
      onCreateWorldEdge?.(
        currentWorldSubject,
        selectedWorldDefinition.name.trim(),
        currentWorldObject,
        selectedWorldDefinition.effect ?? null,
        {
          definitionId: selectedWorldDefinition.id,
          definitionName: selectedWorldDefinition.name,
          baseRelation: selectedWorldDefinition.baseRelation,
        },
      );
      setWorldInteractionError("");
      setSelectedWorldDefinitionId("");
    } catch (err) {
      setWorldInteractionError(err instanceof Error ? err.message : String(err));
    }
  }

  return {
    currentWorldSubject,
    currentWorldObject,
    onWorldSubjectChange: setWorldSubject,
    onWorldObjectChange: setWorldObject,
    selectedWorldDefinitionId,
    onSelectedWorldDefinitionIdChange: setSelectedWorldDefinitionId,
    worldInteractionError,
    authoredWorldDefinitions,
    selectedWorldDefinition,
    currentWorldRelationContract,
    onCreateWorldEdge: handleCreateWorldEdge,
  };
}
