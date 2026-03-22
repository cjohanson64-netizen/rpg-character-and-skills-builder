import React from "react";
import CharacterBuilderForm from "./CharacterBuilderForm";

export default function CharacterBuilderPane({
  showPresetSelector = false,
  templates = [],
  selectedTemplateId = "",
  onTemplateChange,
  builderForm,
  onFieldChange,
  canSubmit,
  builderValidation,
  validation,
  submitError,
  normalizedBuilderForm,
  generatedCharacterName,
  showAdvanced,
  onToggleAdvanced,
  generatedSource,
  validationHint,
  formatErrorType,
}) {
  return (
    <div className="character-modal__builder">
      <div className="character-modal__builder-grid">
        <div className="character-modal__builder-panel">
          <CharacterBuilderForm
            showPresetSelector={showPresetSelector}
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            onTemplateChange={onTemplateChange}
            builderForm={builderForm}
            onFieldChange={onFieldChange}
          />
        </div>

        <div className="character-modal__validation">
          <div className="character-modal__validation-header">
            <span
              className={`character-modal__badge ${
                canSubmit
                  ? "character-modal__badge--success"
                  : "character-modal__badge--error"
              }`}
            >
              {canSubmit ? "Ready" : "Needs Input"}
            </span>
            <span className="character-modal__validation-type">
              {canSubmit
                ? "character ready"
                : builderValidation.ok
                  ? formatErrorType(validation.errorType ?? "validation")
                  : "builder validation"}
            </span>
          </div>

          <div className="character-modal__validation-message">
            {submitError ||
              (!builderValidation.ok
                ? builderValidation.message
                : validation.message)}
          </div>

          <div className="character-modal__validation-list">
            <strong>Generated character</strong>
            <div>flow: character</div>
            <div>instance: {normalizedBuilderForm.instanceName || "none"}</div>
            <div>export: {generatedCharacterName}</div>
            <div>root: {normalizedBuilderForm.rootId || "none"}</div>
            <div>type: {normalizedBuilderForm.type || "none"}</div>
          </div>

          {validation.ok && validation.snapshot ? (
            <div className="character-modal__validation-list">
              <strong>Ready snapshot</strong>
              <div>root: {validation.snapshot.root ?? "none"}</div>
              <div>nodes: {validation.snapshot.nodes.length}</div>
              <div>edges: {validation.snapshot.edges.length}</div>
            </div>
          ) : null}

          <button
            type="button"
            className="character-modal__advanced-toggle"
            onClick={onToggleAdvanced}
          >
            {showAdvanced ? "Hide Raw" : "Show Raw"}
          </button>

          {showAdvanced ? (
            <div className="character-modal__raw-preview">
              <div className="character-modal__label">Generated TAT</div>
              <pre className="character-inspector__code-block">{generatedSource}</pre>
            </div>
          ) : null}

          <div className="character-modal__validation-hint">{validationHint}</div>
        </div>
      </div>
    </div>
  );
}
