import { useState } from "react";
import { useTatGraph } from "@tryangletree/react";
import {
  clearAppData,
  closeEditorModal,
  createCharacterInWorkspace,
  executeWorldInteraction,
  openCreateEditorModal,
  openEditCharacterEditorModal,
  saveTemplateSource,
  selectSavedCharacterInstance,
  updateCharacterInWorkspace,
} from "./appActions";
import { useSavedCharacter } from "../features/character-workspace/useSavedCharacter";
import { useCharacterTemplates } from "../features/templates/useCharacterTemplates";
import { useInteractionDefinitions } from "../features/world-character/useInteractionDefinitions";
import { useWorldCharacter } from "../features/world-character/useWorldCharacter";

export function useAppController() {
  const {
    templates,
    getTemplateById,
    updateTemplate,
    resetTemplates,
  } = useCharacterTemplates();
  const defaultTemplate = templates[0];
  const [editorModalState, setEditorModalState] = useState({
    isOpen: false,
    mode: "create-instance",
    resetKey: 0,
  });
  const tat = useTatGraph({
    tatSource: defaultTemplate.source,
    graphName: defaultTemplate.characterName,
  });
  const workspace = useSavedCharacter();
  const worldCharacter = useWorldCharacter(workspace.instances);
  const interactionDefinitions = useInteractionDefinitions();
  const activeTemplateId =
    workspace.selectedInstance?.templateId ?? defaultTemplate.id;
  const activeTemplate = getTemplateById(activeTemplateId);

  function handleCreateCharacter({ instanceName, characterName, source, templateId }) {
    createCharacterInWorkspace({
      instanceName,
      characterName,
      source,
      templateId,
      workspace,
      tat,
      setEditorModalState,
    });
  }

  function handleUpdateCharacter({
    originalInstanceName,
    instanceName,
    characterName,
    source,
    templateId,
  }) {
    updateCharacterInWorkspace({
      originalInstanceName,
      instanceName,
      characterName,
      source,
      templateId,
      workspace,
      tat,
      setEditorModalState,
    });
  }

  function handleSaveTemplate({ templateId, characterName, source }) {
    saveTemplateSource({
      templateId,
      characterName,
      source,
      updateTemplate,
      workspace,
      activeTemplateId,
      tat,
      setEditorModalState,
    });
  }

  function handleSelectSavedCharacter(name) {
    selectSavedCharacterInstance({ name, workspace, tat });
  }

  function handleClearData() {
    clearAppData({
      workspace,
      worldCharacter,
      interactionDefinitions,
      resetTemplates,
      setEditorModalState,
    });
  }

  function handleCreateWorldInteraction(
    sourceCharacterName,
    relation,
    targetCharacterName,
    effect,
    metadata,
  ) {
    executeWorldInteraction({
      sourceCharacterName,
      relation,
      targetCharacterName,
      effect,
      metadata,
      interactionDefinitions,
      workspace,
      tat,
      worldCharacter,
    });
  }

  return {
    characterState: {
      characterView: tat.graphView,
      isLoading: tat.isLoading,
      error: tat.error,
    },
    workspaceState: {
      hasSavedCharacter: workspace.hasSavedCharacters,
      savedCharacterName: workspace.selectedName,
      savedCharacters: workspace.instances,
      selectedSavedCharacterName: workspace.selectedName,
      selectedCharacter: workspace.selectedInstance,
      characterTemplates: templates,
      activeTemplateId,
    },
    worldState: {
      worldCharacter: worldCharacter.worldCharacter,
      interactionDefinitions: interactionDefinitions.interactionDefinitions,
    },
    inspectorActions: {
      onReset: tat.reset,
      onClearData: handleClearData,
      onOpenCreateModal: () => openCreateEditorModal(setEditorModalState),
      onOpenEditCharacterModal: () =>
        openEditCharacterEditorModal(setEditorModalState, workspace.selectedInstance),
      onDeleteCharacter: workspace.deleteSelectedCharacter,
      onSelectSavedCharacter: handleSelectSavedCharacter,
      onCreateWorldEdge: handleCreateWorldInteraction,
      onCreateInteractionDefinition: interactionDefinitions.createDefinition,
      onUpdateInteractionDefinition: interactionDefinitions.updateDefinition,
      onDeleteInteractionDefinition: interactionDefinitions.deleteDefinition,
    },
    createModalProps: {
      key: editorModalState.resetKey,
      isOpen: editorModalState.isOpen,
      mode: editorModalState.mode,
      initialInstanceName:
        editorModalState.mode === "edit-template" ||
        editorModalState.mode === "edit-instance"
          ? workspace.selectedName
          : "",
      originalInstanceName: editorModalState.originalInstanceName ?? "",
      initialTemplateId: activeTemplate?.id ?? defaultTemplate.id,
      selectedCharacter: workspace.selectedInstance,
      templates,
      onCancel: () => closeEditorModal(setEditorModalState),
      onCreate: handleCreateCharacter,
      onUpdate: handleUpdateCharacter,
      onSaveTemplate: handleSaveTemplate,
    },
  };
}
