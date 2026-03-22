const BLANK_TEMPLATE_ID = "blank";

export function formatErrorType(errorType) {
  return errorType.replaceAll("_", " ");
}

export function getTemplateSeed(templateId, templates) {
  const template =
    templates.find((entry) => entry.id === templateId) ?? templates[0] ?? null;

  if (!template) {
    return {
      selectedTemplateId: BLANK_TEMPLATE_ID,
      characterName: "blankCharacter",
      source: "",
    };
  }

  return {
    selectedTemplateId: template.id,
    characterName: template.characterName,
    source: template.source,
  };
}

export function getInitialModalState({
  mode,
  initialInstanceName,
  initialTemplateId,
  templates,
}) {
  const templateSeed = getTemplateSeed(initialTemplateId, templates);

  if (mode === "edit-template") {
    return {
      instanceName: initialInstanceName || "",
      showAdvanced: true,
      ...templateSeed,
      submitError: "",
    };
  }

  return {
    instanceName: initialInstanceName || "",
    ...templateSeed,
    submitError: "",
  };
}

export { BLANK_TEMPLATE_ID };
