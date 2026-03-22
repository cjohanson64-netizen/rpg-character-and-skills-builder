import { useCallback, useMemo, useState } from "react";

const STORAGE_KEY = "tryangletree.characterWorkspace";

function createEmptyWorkspace() {
  return {
    instances: [],
    selectedName: "",
  };
}

function readWorkspace() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyWorkspace();

    const parsed = JSON.parse(raw);
    return {
      instances: Array.isArray(parsed?.instances) ? parsed.instances : [],
      selectedName: typeof parsed?.selectedName === "string" ? parsed.selectedName : "",
    };
  } catch {
    return createEmptyWorkspace();
  }
}

function writeWorkspace(workspace) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
}

function clearWorkspaceStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

export function useSavedCharacter() {
  const [workspace, setWorkspace] = useState(() => readWorkspace());

  const saveCharacter = useCallback((name, characterSnapshot, options = {}) => {
    if (!characterSnapshot) return;

    const nextName = name?.trim();
    if (!nextName) return;

    setWorkspace((current) => {
      const nextInstance = {
        name: nextName,
        snapshot: characterSnapshot,
        templateId: options.templateId ?? null,
        source: options.source ?? null,
        sourceCharacterName: options.sourceCharacterName ?? null,
        savedAt: new Date().toISOString(),
      };

      const existingIndex = current.instances.findIndex(
        (instance) => instance.name === nextName,
      );

      const nextInstances =
        existingIndex >= 0
          ? current.instances.map((instance, index) =>
              index === existingIndex ? nextInstance : instance,
            )
          : [...current.instances, nextInstance];

      const nextWorkspace = {
        instances: nextInstances.sort((a, b) => a.name.localeCompare(b.name)),
        selectedName: nextName,
      };

      writeWorkspace(nextWorkspace);
      return nextWorkspace;
    });
  }, []);

  const setSelectedName = useCallback((name) => {
    setWorkspace((current) => {
      const nextWorkspace = {
        ...current,
        selectedName: name,
      };

      writeWorkspace(nextWorkspace);
      return nextWorkspace;
    });
  }, []);

  const loadSelectedCharacter = useCallback(() => {
    const current = readWorkspace();
    setWorkspace(current);

    return (
      current.instances.find(
        (instance) => instance.name === current.selectedName,
      ) ?? null
    );
  }, []);

  const deleteSelectedCharacter = useCallback(() => {
    setWorkspace((current) => {
      if (!current.selectedName) return current;

      const nextInstances = current.instances.filter(
        (instance) => instance.name !== current.selectedName,
      );

      const nextWorkspace = {
        instances: nextInstances,
        selectedName: nextInstances[0]?.name ?? "",
      };

      writeWorkspace(nextWorkspace);
      return nextWorkspace;
    });
  }, []);

  const replaceInstances = useCallback((nextInstances, selectedName) => {
    setWorkspace((current) => {
      const normalizedInstances = Array.isArray(nextInstances) ? nextInstances : current.instances;
      const nextWorkspace = {
        instances: [...normalizedInstances].sort((a, b) => a.name.localeCompare(b.name)),
        selectedName:
          typeof selectedName === "string"
            ? selectedName
            : current.selectedName,
      };

      writeWorkspace(nextWorkspace);
      return nextWorkspace;
    });
  }, []);

  const clearWorkspace = useCallback(() => {
    clearWorkspaceStorage();
    setWorkspace(createEmptyWorkspace());
  }, []);

  const selectedInstance = useMemo(
    () =>
      workspace.instances.find(
        (instance) => instance.name === workspace.selectedName,
      ) ?? null,
    [workspace.instances, workspace.selectedName],
  );

  return {
    instances: workspace.instances,
    hasSavedCharacters: workspace.instances.length > 0,
    selectedName: workspace.selectedName,
    selectedInstance,
    saveCharacter,
    setSelectedName,
    loadSelectedCharacter,
    deleteSelectedCharacter,
    replaceInstances,
    clearWorkspace,
  };
}
