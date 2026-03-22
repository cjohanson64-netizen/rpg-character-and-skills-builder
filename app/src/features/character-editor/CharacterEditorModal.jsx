import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  TAT_MARKER_OWNER,
} from "./utils/tatMonaco";
import CharacterBuilderPane from "./components/CharacterBuilderPane";
import TemplateEditorPane from "./components/TemplateEditorPane";
import { validateTatCharacterSource } from "../../tat/validateTatCharacterSource";
import {
  buildTatCharacterSourceFromForm,
  createCharacterBuilderFormFromTemplate,
  createCharacterBuilderFormFromInstance,
  normalizeCharacterBuilderForm,
  validateCharacterBuilderForm,
} from "./characters/characterBuilder";
import { formatErrorType, getInitialModalState, getTemplateSeed } from "./utils/createFromScratchModalState";

export default function CharacterEditorModal({
  isOpen,
  mode = "create-instance",
  initialInstanceName,
  originalInstanceName,
  initialTemplateId,
  selectedCharacter,
  templates,
  onCancel,
  onCreate,
  onUpdate,
  onSaveTemplate,
}) {
  const initialModalState = getInitialModalState({
    mode,
    initialInstanceName,
    initialTemplateId,
    templates,
  });
  const selectedTemplate =
    templates.find((template) => template.id === initialModalState.selectedTemplateId) ??
    templates[0] ??
    null;
  const initialBuilderForm =
    mode === "edit-instance" && selectedCharacter
      ? createCharacterBuilderFormFromInstance(selectedCharacter)
      : createCharacterBuilderFormFromTemplate(selectedTemplate, {
          instanceName: initialInstanceName || "",
        });

  const [characterName, setCharacterName] = useState(initialModalState.characterName);
  const [source, setSource] = useState(initialModalState.source);
  const [showAdvanced, setShowAdvanced] = useState(initialModalState.showAdvanced ?? false);
  const [builderForm, setBuilderForm] = useState(initialBuilderForm);
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    initialModalState.selectedTemplateId,
  );
  const [submitError, setSubmitError] = useState(initialModalState.submitError);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const isEditTemplateMode = mode === "edit-template";
  const isEditInstanceMode = mode === "edit-instance";
  const isCreateMode = mode === "create-instance";
  const normalizedBuilderForm = useMemo(
    () => normalizeCharacterBuilderForm(builderForm),
    [builderForm],
  );
  const builderValidation = useMemo(
    () => validateCharacterBuilderForm(builderForm),
    [builderForm],
  );
  const generatedSource = useMemo(
    () => buildTatCharacterSourceFromForm(normalizedBuilderForm),
    [normalizedBuilderForm],
  );
  const generatedCharacterName = normalizedBuilderForm.characterExportName;
  const effectiveCharacterName = isEditTemplateMode ? characterName : generatedCharacterName;
  const effectiveSource = isEditTemplateMode ? source : generatedSource;

  const validation = useMemo(
    () =>
      validateTatCharacterSource({
        source: effectiveSource,
        characterName: effectiveCharacterName,
      }),
    [effectiveCharacterName, effectiveSource],
  );

  useEffect(() => {
    if (!isOpen || !editorRef.current || !monacoRef.current) {
      return;
    }

    const model = editorRef.current.getModel();
    if (!model) {
      return;
    }

    const markers = validation.marker
      ? [
          {
            ...validation.marker,
            severity: monacoRef.current.MarkerSeverity.Error,
            message: validation.message,
          },
        ]
      : [];

    monacoRef.current.editor.setModelMarkers(model, TAT_MARKER_OWNER, markers);
  }, [isOpen, validation]);

  function handleMount(editor, monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;
  }

  function handleCreate() {
    if (isEditTemplateMode) {
      if (!validation.ok || !selectedTemplateId || !onSaveTemplate) {
        return;
      }

      try {
        onSaveTemplate({
          templateId: selectedTemplateId,
          characterName: characterName.trim(),
          source,
        });
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : String(error));
      }

      return;
    }

    if (!builderValidation.ok || !validation.ok) {
      return;
    }

    try {
      const submitPayload = {
        instanceName: normalizedBuilderForm.instanceName,
        characterName: effectiveCharacterName,
        source: effectiveSource,
        templateId: selectedCharacter?.templateId ?? selectedTemplateId,
      };

      if (isEditInstanceMode && onUpdate) {
        onUpdate({
          ...submitPayload,
          originalInstanceName: originalInstanceName || selectedCharacter?.name || "",
        });
      } else {
        onCreate(submitPayload);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : String(error));
    }
  }

  function handleTemplateChange(event) {
    const nextTemplateId = event.target.value;
    const nextTemplateSeed = getTemplateSeed(nextTemplateId, templates);
    const nextTemplate =
      templates.find((template) => template.id === nextTemplateSeed.selectedTemplateId) ?? null;

    setSelectedTemplateId(nextTemplateSeed.selectedTemplateId);
    setCharacterName(nextTemplateSeed.characterName);
    setSource(nextTemplateSeed.source);
    if (nextTemplate) {
      setBuilderForm((current) =>
        createCharacterBuilderFormFromTemplate(nextTemplate, {
          instanceName: current.instanceName,
        }),
      );
    }
    setSubmitError("");
  }

  function handleBuilderFieldChange(fieldId, value) {
    setBuilderForm((current) => ({
      ...current,
      [fieldId]: value,
    }));
    setSubmitError("");
  }

  if (!isOpen) {
    return null;
  }

  const modalTitle = isEditTemplateMode
    ? "Edit Base Character"
    : isEditInstanceMode
      ? "Edit Character"
      : "Create Character";
  const modalSubtitle = isEditTemplateMode
    ? "Update the current base template source. This changes future characters created from it, but it does not rewrite existing saved instances."
    : isEditInstanceMode
      ? "Update the selected character with the same structured form used for creation. The app regenerates the underlying TAT safely behind the scenes."
      : "Create a character with structured identity, stats, and metadata fields. The app generates the underlying TAT behind the scenes.";
  const actionLabel = isEditTemplateMode
    ? "Save Base Character"
    : isEditInstanceMode
      ? "Update Character"
      : "Create Character";
  const validationHint = isEditTemplateMode
    ? "Save stays disabled until the template source parses, executes, and produces the requested character export. Existing saved instances keep their own snapshots."
    : isEditInstanceMode
      ? "Update stays disabled until the form is valid and the regenerated character snapshot compiles successfully."
      : "Create stays disabled until the form is valid and the regenerated character snapshot compiles successfully.";
  const validationMessage =
    !isEditTemplateMode && !builderValidation.ok
      ? builderValidation.message
        : submitError || validation.message;
  const canSubmit = isEditTemplateMode
    ? validation.ok
    : builderValidation.ok && validation.ok;

  return (
    <div className="character-modal__backdrop" role="presentation">
      <div
        className="character-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scratch-modal-title"
      >
        <div className="character-modal__header">
          <div>
            <h2 className="character-modal__title" id="scratch-modal-title">
              {modalTitle}
            </h2>
            <p className="character-modal__subtitle">{modalSubtitle}</p>
          </div>
          <button
            type="button"
            className="character-modal__close"
            onClick={onCancel}
            aria-label="Close character editor modal"
          >
            Close
          </button>
        </div>



        {isEditTemplateMode ? (
          <TemplateEditorPane
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            templateLabel="Base Template"
            templateSelectDisabled
            instanceName={undefined}
            characterName={characterName}
            source={source}
            onTemplateChange={handleTemplateChange}
            onCharacterNameChange={(event) => setCharacterName(event.target.value)}
            onSourceChange={setSource}
            onEditorMount={handleMount}
            validation={validation}
            submitError={validationMessage}
            validationHint={validationHint}
            formatErrorType={formatErrorType}
          />
        ) : (
          <CharacterBuilderPane
            showPresetSelector={isCreateMode}
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            onTemplateChange={handleTemplateChange}
            builderForm={builderForm}
            onFieldChange={handleBuilderFieldChange}
            canSubmit={canSubmit}
            builderValidation={builderValidation}
            validation={validation}
            submitError={validationMessage}
            normalizedBuilderForm={normalizedBuilderForm}
            generatedCharacterName={generatedCharacterName}
            showAdvanced={showAdvanced}
            onToggleAdvanced={() => setShowAdvanced((current) => !current)}
            generatedSource={generatedSource}
            validationHint={validationHint}
            formatErrorType={formatErrorType}
          />
        )}
        <div className="character-modal__footer">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" onClick={handleCreate} disabled={!canSubmit}>
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
