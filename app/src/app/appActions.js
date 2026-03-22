import { applyInteractionDefinitionToCharacters } from "../features/world-character/characters/applyInteractionDefinitionToCharacters";
import { validateTatCharacterSource } from "../tat/validateTatCharacterSource";

export function closeEditorModal(setEditorModalState) {
  setEditorModalState((current) => ({
    ...current,
    isOpen: false,
  }));
}

export function openCreateEditorModal(setEditorModalState) {
  setEditorModalState({
    isOpen: true,
    mode: "create-instance",
    resetKey: Date.now(),
  });
}

export function openEditBaseEditorModal(setEditorModalState) {
  setEditorModalState({
    isOpen: true,
    mode: "edit-template",
    resetKey: Date.now(),
  });
}

export function openEditCharacterEditorModal(setEditorModalState, selectedInstance) {
  if (!selectedInstance?.name) {
    return;
  }

  setEditorModalState({
    isOpen: true,
    mode: "edit-instance",
    resetKey: Date.now(),
    originalInstanceName: selectedInstance.name,
  });
}

export function createCharacterInWorkspace({
  instanceName,
  characterName,
  source,
  templateId,
  workspace,
  tat,
  setEditorModalState,
}) {
  const validation = validateTatCharacterSource({ source, characterName });

  if (!validation.ok || !validation.snapshot) {
    throw new Error(validation.message);
  }

  workspace.saveCharacter(instanceName, validation.snapshot, {
    templateId,
    source,
    sourceCharacterName: characterName,
  });
  tat.loadSnapshot(validation.snapshot);
  closeEditorModal(setEditorModalState);
}

export function updateCharacterInWorkspace({
  originalInstanceName,
  instanceName,
  characterName,
  source,
  templateId,
  workspace,
  tat,
  setEditorModalState,
}) {
  const validation = validateTatCharacterSource({ source, characterName });

  if (!validation.ok || !validation.snapshot) {
    throw new Error(validation.message);
  }

  const nextName = instanceName.trim();
  const instanceToReplace = originalInstanceName?.trim() || nextName;
  const currentInstance = workspace.instances.find(
    (instance) => instance.name === instanceToReplace,
  );

  if (!currentInstance) {
    throw new Error(`Character "${instanceToReplace}" could not be found.`);
  }

  const updatedInstance = {
    ...currentInstance,
    name: nextName,
    snapshot: validation.snapshot,
    templateId: templateId ?? currentInstance.templateId ?? null,
    source,
    sourceCharacterName: characterName,
    savedAt: new Date().toISOString(),
  };

  workspace.replaceInstances(
    [
      ...workspace.instances.filter((instance) => instance.name !== instanceToReplace),
      updatedInstance,
    ],
    nextName,
  );
  tat.loadSnapshot(validation.snapshot);
  closeEditorModal(setEditorModalState);
}

export function saveTemplateSource({
  templateId,
  characterName,
  source,
  updateTemplate,
  workspace,
  activeTemplateId,
  tat,
  setEditorModalState,
}) {
  const validation = validateTatCharacterSource({ source, characterName });

  if (!validation.ok || !validation.snapshot) {
    throw new Error(validation.message);
  }

  updateTemplate(templateId, {
    characterName,
    source,
  });

  if (!workspace.selectedInstance && templateId === activeTemplateId) {
    tat.loadSnapshot(validation.snapshot);
  }

  closeEditorModal(setEditorModalState);
}

export function selectSavedCharacterInstance({ name, workspace, tat }) {
  workspace.setSelectedName(name);

  const instance =
    workspace.instances.find((savedInstance) => savedInstance.name === name) ?? null;

  if (!instance?.snapshot) {
    return;
  }

  tat.loadSnapshot(instance.snapshot);
}

export function clearAppData({
  workspace,
  worldCharacter,
  interactionDefinitions,
  resetTemplates,
  setEditorModalState,
}) {
  const shouldClear = window.confirm(
    "Clear all local app data? This will remove saved characters, world interaction history, interaction definitions, and edited template data.",
  );

  if (!shouldClear) {
    return;
  }

  workspace.clearWorkspace();
  worldCharacter.clearWorldCharacter();
  interactionDefinitions.clearDefinitions();
  resetTemplates();
  closeEditorModal(setEditorModalState);
  window.location.reload();
}

export function executeWorldInteraction({
  sourceCharacterName,
  relation,
  targetCharacterName,
  effect,
  metadata,
  interactionDefinitions,
  workspace,
  tat,
  worldCharacter,
}) {
  const definitionId = metadata?.definitionId ?? "";
  const definition =
    interactionDefinitions.interactionDefinitions.find(
      (entry) => entry.id === definitionId,
    ) ?? null;

  if (!definition) {
    throw new Error("The selected interaction definition could not be found.");
  }

  const sourceInstance =
    workspace.instances.find((instance) => instance.name === sourceCharacterName) ?? null;
  const targetInstance =
    workspace.instances.find((instance) => instance.name === targetCharacterName) ?? null;

  if (!sourceInstance) {
    throw new Error(`Source character "${sourceCharacterName}" could not be found.`);
  }

  if (!targetInstance) {
    throw new Error(`Target character "${targetCharacterName}" could not be found.`);
  }

  const execution = applyInteractionDefinitionToCharacters({
    definition,
    sourceInstance,
    targetInstance,
  });

  workspace.replaceInstances(
    workspace.instances.map((instance) =>
      instance.name === execution.targetInstance.name
        ? execution.targetInstance
        : instance,
    ),
    workspace.selectedName,
  );

  if (workspace.selectedName === execution.targetInstance.name) {
    tat.loadSnapshot(execution.targetInstance.snapshot);
  }

  worldCharacter.addEdge(sourceCharacterName, relation, targetCharacterName, effect, {
    ...metadata,
    effectApplied: true,
    resultMeta: execution.resultMeta,
    resultSnapshot: execution.resultSnapshot,
  });
}
