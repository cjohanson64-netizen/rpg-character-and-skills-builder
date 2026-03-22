import { useCallback, useMemo, useState } from "react";
import { characterTemplates as defaultCharacterTemplates } from "./TemplateRegistry";

const STORAGE_KEY = "tryangletree.characterTemplates";

function normalizeTemplates(storedTemplates) {
  const storedById = new Map(
    Array.isArray(storedTemplates)
      ? storedTemplates.map((template) => [template?.id, template])
      : [],
  );

  return defaultCharacterTemplates.map((template) => {
    const storedTemplate = storedById.get(template.id);

    return {
      ...template,
      characterName:
        typeof storedTemplate?.characterName === "string" &&
        storedTemplate.characterName.trim()
          ? storedTemplate.characterName
          : template.characterName,
      source:
        typeof storedTemplate?.source === "string" && storedTemplate.source.trim()
          ? storedTemplate.source
          : template.source,
    };
  });
}

function readTemplates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return normalizeTemplates(null);

    const parsed = JSON.parse(raw);
    return normalizeTemplates(parsed?.templates);
  } catch {
    return normalizeTemplates(null);
  }
}

function writeTemplates(templates) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      templates: templates.map((template) => ({
        id: template.id,
        characterName: template.characterName,
        source: template.source,
      })),
    }),
  );
}

function clearTemplatesStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

export function useCharacterTemplates() {
  const [templates, setTemplates] = useState(() => readTemplates());

  const updateTemplate = useCallback((templateId, updates) => {
    setTemplates((current) => {
      const nextTemplates = current.map((template) =>
        template.id === templateId
          ? {
              ...template,
              source: updates.source,
              characterName: updates.characterName,
            }
          : template,
      );

      writeTemplates(nextTemplates);
      return nextTemplates;
    });
  }, []);

  const getTemplateById = useCallback(
    (templateId) =>
      templates.find((template) => template.id === templateId) ?? null,
    [templates],
  );

  const resetTemplates = useCallback(() => {
    clearTemplatesStorage();
    setTemplates(normalizeTemplates(null));
  }, []);

  const editableTemplateIds = useMemo(
    () => new Set(templates.map((template) => template.id)),
    [templates],
  );

  return {
    templates,
    editableTemplateIds,
    getTemplateById,
    updateTemplate,
    resetTemplates,
  };
}
