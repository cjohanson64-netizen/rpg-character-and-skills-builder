import React, { useMemo } from "react";
import CharacterInspectorToolbar from "./components/CharacterInspectorToolbar";
import SavedCharactersWorkspacePanel from "../character-workspace/components/SavedCharactersWorkspacePanel";
import LoadedCharactersPanel from "../character-workspace/components/LoadedCharactersPanel";
import WorldInteractionHistoryPanel from "../world-character/components/WorldInteractionHistoryPanel";
import InteractionDefinitionsPanel from "../world-character/components/InteractionDefinitionsPanel";
import { useInteractionDefinitionEditor } from "../world-character/handlers/useInteractionDefinitionEditor";
import { useWorldInteractionForm } from "../world-character/handlers/useWorldInteractionForm";

export default function CharacterInspector({
  workspaceState,
  worldState,
  inspectorActions,
}) {
  const {
    hasSavedCharacter,
    savedCharacterName,
    savedCharacters,
    selectedSavedCharacterName,
    selectedCharacter,
    characterTemplates,
    activeTemplateId,
  } = workspaceState;
  const { worldCharacter, interactionDefinitions } = worldState;
  const {
    onReset,
    onOpenCreateModal,
    onOpenEditCharacterModal,
    onDeleteCharacter,
    onSelectSavedCharacter,
    onClearData,
    onCreateWorldEdge,
    onCreateInteractionDefinition,
    onUpdateInteractionDefinition,
    onDeleteInteractionDefinition,
  } = inspectorActions;

  const worldNodes = useMemo(() => worldCharacter?.nodes ?? [], [worldCharacter]);
  const worldInteractions = useMemo(
    () => worldCharacter?.interactions ?? worldCharacter?.edges ?? [],
    [worldCharacter],
  );
  const savedInteractionDefinitions = useMemo(
    () => interactionDefinitions ?? [],
    [interactionDefinitions],
  );

  const activeTemplateLabel = useMemo(() => {
    if (activeTemplateId === "blank") return "Blank Character";
    if (activeTemplateId === "scratch") return "Scratch";
    return characterTemplates.find((t) => t.id === activeTemplateId)?.label ?? "Unknown";
  }, [activeTemplateId, characterTemplates]);

  const definitionEditor = useInteractionDefinitionEditor({
    onCreateInteractionDefinition,
    onUpdateInteractionDefinition,
  });

  const worldForm = useWorldInteractionForm({
    worldNodes,
    savedInteractionDefinitions,
    onCreateWorldEdge,
  });
  const selectedWorldCharacterNames = useMemo(() => {
    return [...new Set([worldForm.currentWorldSubject, worldForm.currentWorldObject].filter(Boolean))];
  }, [worldForm.currentWorldObject, worldForm.currentWorldSubject]);
  const selectedWorldCharacters = useMemo(
    () => {
      const savedCharactersByName = new Map(
        savedCharacters.map((character) => [character.name, character]),
      );

      return selectedWorldCharacterNames
        .map((characterName) => savedCharactersByName.get(characterName) ?? null)
        .filter(Boolean);
    },
    [savedCharacters, selectedWorldCharacterNames],
  );

  return (
    <div className="character-inspector">
      <h1 className="character-inspector__title">RPG Character and Skill Builder</h1>

      <CharacterInspectorToolbar onReset={onReset} onClearData={onClearData} />

      <SavedCharactersWorkspacePanel
        hasSavedCharacter={hasSavedCharacter}
        savedCharacterName={savedCharacterName}
        activeTemplateLabel={activeTemplateLabel}
        selectedSavedCharacterName={selectedSavedCharacterName}
        onSelectSavedCharacter={onSelectSavedCharacter}
        savedCharacters={savedCharacters}
        onOpenCreateModal={onOpenCreateModal}
        onOpenEditCharacterModal={onOpenEditCharacterModal}
        canEditCharacter={Boolean(selectedCharacter)}
        onDeleteCharacter={onDeleteCharacter}
      />

      <LoadedCharactersPanel
        instances={selectedWorldCharacters}
        selectedCharacterName={selectedSavedCharacterName}
        title="Selected Characters"
        emptyMessage="Select characters in the world interaction panel to inspect them here."
      />

      <WorldInteractionHistoryPanel
        worldNodes={worldNodes}
        worldInteractions={worldInteractions}
        currentWorldSubject={worldForm.currentWorldSubject}
        onWorldSubjectChange={worldForm.onWorldSubjectChange}
        selectedWorldDefinitionId={worldForm.selectedWorldDefinitionId}
        onSelectedWorldDefinitionIdChange={worldForm.onSelectedWorldDefinitionIdChange}
        authoredWorldDefinitions={worldForm.authoredWorldDefinitions}
        currentWorldObject={worldForm.currentWorldObject}
        onWorldObjectChange={worldForm.onWorldObjectChange}
        selectedWorldDefinition={worldForm.selectedWorldDefinition}
        currentWorldRelationContract={worldForm.currentWorldRelationContract}
        worldInteractionError={worldForm.worldInteractionError}
        onCreateWorldEdge={worldForm.onCreateWorldEdge}
      />

      <InteractionDefinitionsPanel
        savedInteractionDefinitions={savedInteractionDefinitions}
        onDeleteInteractionDefinition={onDeleteInteractionDefinition}
        selectedDefinitionId={definitionEditor.selectedDefinitionId}
        definitionName={definitionEditor.definitionName}
        setDefinitionName={definitionEditor.setDefinitionName}
        currentDefinitionBaseRelation={definitionEditor.currentDefinitionBaseRelation}
        setDefinitionBaseRelation={definitionEditor.setDefinitionBaseRelation}
        availableWorldRelations={definitionEditor.availableWorldRelations}
        definitionBaseRelationExistsInVocab={definitionEditor.definitionBaseRelationExistsInVocab}
        definitionBaseRelation={definitionEditor.definitionBaseRelation}
        definitionEffectTarget={definitionEditor.definitionEffectTarget}
        setDefinitionEffectTarget={definitionEditor.setDefinitionEffectTarget}
        hasIncompleteDefinitionEffectOps={definitionEditor.hasIncompleteDefinitionEffectOps}
        resetDefinitionForm={definitionEditor.resetDefinitionForm}
        definitionSaveValidationMessage={definitionEditor.definitionSaveValidationMessage}
        currentDefinitionRelationContract={definitionEditor.currentDefinitionRelationContract}
        addDefinitionEffectOp={definitionEditor.addDefinitionEffectOp}
        definitionEffectOps={definitionEditor.definitionEffectOps}
        definitionEffectOpStates={definitionEditor.definitionEffectOpStates}
        allowedDefinitionKeyIds={definitionEditor.allowedDefinitionKeyIds}
        availableDefinitionOpDefinitions={definitionEditor.availableDefinitionOpDefinitions}
        handleDefinitionEffectTypeChange={definitionEditor.handleDefinitionEffectTypeChange}
        updateDefinitionEffectOp={definitionEditor.updateDefinitionEffectOp}
        setDefinitionDeriveExpression={definitionEditor.setDefinitionDeriveExpression}
        setDefinitionNumericEffectDerivation={
          definitionEditor.setDefinitionNumericEffectDerivation
        }
        removeDefinitionEffectOp={definitionEditor.removeDefinitionEffectOp}
        appendTokenToDefinitionOp={definitionEditor.appendTokenToDefinitionOp}
        handleSelectInteractionDefinition={definitionEditor.handleSelectInteractionDefinition}
        handleSaveInteractionDefinition={definitionEditor.handleSaveInteractionDefinition}
      />
    </div>
  );
}
