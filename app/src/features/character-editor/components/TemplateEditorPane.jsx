import React from "react";
import Editor from "@monaco-editor/react";
import {
  configureTatMonaco,
  TAT_LANGUAGE_ID,
} from "../utils/tatMonaco";

export default function TemplateEditorPane({
  templates,
  selectedTemplateId,
  templateLabel = "Template",
  templateSelectDisabled = false,
  instanceName,
  onInstanceNameChange,
  characterName,
  source,
  onTemplateChange,
  onCharacterNameChange,
  onSourceChange,
  onEditorMount,
  validation,
  submitError,
  validationHint,
  formatErrorType,
}) {
  return (
    <>
      <div className="character-modal__controls">
        <label className="character-modal__field">
          <span className="character-modal__label">{templateLabel}</span>
          <select
            className="character-inspector__input character-inspector__select"
            value={selectedTemplateId}
            onChange={onTemplateChange}
            disabled={templateSelectDisabled}
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.label}
              </option>
            ))}
          </select>
        </label>

        {typeof instanceName === "string" ? (
          <label className="character-modal__field">
            <span className="character-modal__label">Character Name</span>
            <input
              className="character-inspector__input"
              value={instanceName}
              onChange={onInstanceNameChange}
              placeholder="New Character"
            />
          </label>
        ) : null}

        <label className="character-modal__field">
          <span className="character-modal__label">Character Export</span>
          <input
            className="character-inspector__input"
            value={characterName}
            onChange={onCharacterNameChange}
            placeholder="scratchCharacter"
          />
        </label>
      </div>

      <div className="character-modal__body">
        <div className="character-modal__editor-shell">
          <Editor
            height="100%"
            defaultLanguage={TAT_LANGUAGE_ID}
            language={TAT_LANGUAGE_ID}
            value={source}
            theme="tat-dark"
            beforeMount={configureTatMonaco}
            onMount={onEditorMount}
            onChange={(value) => onSourceChange(value ?? "")}
            options={{
              automaticLayout: true,
              fontSize: 14,
              minimap: { enabled: false },
              padding: { top: 16 },
              scrollBeyondLastLine: false,
              wordWrap: "on",
            }}
          />
        </div>

        <div className="character-modal__validation">
          <div className="character-modal__validation-header">
            <span
              className={`character-modal__badge ${
                validation.ok
                  ? "character-modal__badge--success"
                  : "character-modal__badge--error"
              }`}
            >
              {validation.ok ? "Valid" : "Invalid"}
            </span>
            <span className="character-modal__validation-type">
              {validation.ok
                ? "character ready"
                : formatErrorType(validation.errorType ?? "error")}
            </span>
          </div>

          <div className="character-modal__validation-message">
            {submitError || validation.message}
          </div>

          {validation.availableCharacterNames.length > 0 ? (
            <div className="character-modal__validation-list">
              <strong>Available character exports</strong>
              <div>{validation.availableCharacterNames.join(", ")}</div>
            </div>
          ) : null}

          {validation.ok && validation.snapshot ? (
            <div className="character-modal__validation-list">
              <strong>Ready snapshot</strong>
              <div>root: {validation.snapshot.root ?? "none"}</div>
              <div>nodes: {validation.snapshot.nodes.length}</div>
              <div>edges: {validation.snapshot.edges.length}</div>
            </div>
          ) : null}

          <div className="character-modal__validation-hint">{validationHint}</div>
        </div>
      </div>
    </>
  );
}
