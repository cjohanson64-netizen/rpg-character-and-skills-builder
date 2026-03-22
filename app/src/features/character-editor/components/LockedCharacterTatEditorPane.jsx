import React from "react";
import Editor from "@monaco-editor/react";
import { configureTatMonaco, TAT_LANGUAGE_ID } from "../utils/tatMonaco";

const CORE_STAT_FIELDS = ["hp", "atk", "def", "int", "res", "spd"];

export default function LockedCharacterTatEditorPane({
  templates,
  selectedTemplateId,
  onTemplateChange,
  instanceName,
  onInstanceNameChange,
  lockedValues,
  onLockedValueChange,
  schema,
  previewSource,
  onEditorMount,
  builderValidation,
  validation,
  submitError,
  validationHint,
  formatErrorType,
}) {
  return (
    <div className="character-modal__builder">
      <div className="character-modal__builder-grid">
        <div className="character-modal__builder-panel">
          <div className="character-modal__builder-section">
            <h3 className="character-modal__builder-title">Editor Mode</h3>
            <div className="character-modal__locked-hint">
              Character TAT Editor locks structure and only lets you edit
              predefined value fields. The preview updates live from those values.
            </div>
          </div>

          <div className="character-modal__builder-section">
            <h3 className="character-modal__builder-title">Preset</h3>
            <div className="character-modal__builder-fields">
              <label className="character-modal__field">
                <span className="character-modal__label">Preset Template</span>
                <select
                  className="character-inspector__input character-inspector__select"
                  value={selectedTemplateId}
                  onChange={onTemplateChange}
                >
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="character-modal__field">
                <span className="character-modal__label">Character Name</span>
                <input
                  className="character-inspector__input"
                  value={instanceName}
                  onChange={onInstanceNameChange}
                  placeholder="Aria the Warrior"
                />
              </label>
            </div>
          </div>

          <div className="character-modal__builder-section">
            <h3 className="character-modal__builder-title">Editable Identity</h3>
            <div className="character-modal__builder-fields">
              <label className="character-modal__field">
                <span className="character-modal__label">Class</span>
                <input
                  className="character-inspector__input"
                  value={lockedValues.rootId}
                  onChange={(event) =>
                    onLockedValueChange("rootId", event.target.value)
                  }
                />
              </label>

              <label className="character-modal__field">
                <span className="character-modal__label">Root Type</span>
                <input
                  className="character-inspector__input"
                  value={lockedValues.rootType}
                  onChange={(event) =>
                    onLockedValueChange("rootType", event.target.value)
                  }
                />
              </label>

              <label className="character-modal__field">
                <span className="character-modal__label">Root Name</span>
                <input
                  className="character-inspector__input"
                  value={lockedValues.rootName}
                  onChange={(event) =>
                    onLockedValueChange("rootName", event.target.value)
                  }
                />
              </label>
            </div>
          </div>

          <div className="character-modal__builder-section">
            <h3 className="character-modal__builder-title">Editable Stats</h3>
            <div className="character-modal__builder-stats">
              {CORE_STAT_FIELDS.map((statKey) => (
                <label key={statKey} className="character-modal__field">
                  <span className="character-modal__label">{statKey.toUpperCase()}</span>
                  <input
                    type="number"
                    className="character-inspector__input"
                    value={lockedValues[statKey]}
                    onChange={(event) =>
                      onLockedValueChange(statKey, event.target.value)
                    }
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="character-modal__builder-section">
            <h3 className="character-modal__builder-title">Editable Metadata</h3>
            <div className="character-modal__builder-fields">
              <label className="character-modal__field">
                <span className="character-modal__label">Description</span>
                <textarea
                  className="character-inspector__input character-modal__textarea"
                  value={lockedValues.description}
                  onChange={(event) =>
                    onLockedValueChange("description", event.target.value)
                  }
                  placeholder="Short summary of this character."
                />
              </label>
            </div>
          </div>

          <div className="character-modal__builder-section">
            <h3 className="character-modal__builder-title">Editable Schema</h3>
            <div className="character-modal__validation-list">
              <strong>{schema.templateId}</strong>
              {schema.editableFields.map((field) => (
                <div key={field.id}>
                  {field.id}: {field.type}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="character-modal__validation">
          <div className="character-modal__validation-header">
            <span
              className={`character-modal__badge ${
                builderValidation.ok && validation.ok
                  ? "character-modal__badge--success"
                  : "character-modal__badge--error"
              }`}
            >
              {builderValidation.ok && validation.ok ? "Ready" : "Locked"}
            </span>
            <span className="character-modal__validation-type">
              {builderValidation.ok && validation.ok
                ? "character ready"
                : builderValidation.ok
                  ? formatErrorType(validation.errorType ?? "validation")
                  : "value validation"}
            </span>
          </div>

          <div className="character-modal__validation-message">
            {submitError ||
              (!builderValidation.ok
                ? builderValidation.message
                : validation.message)}
          </div>

          <div className="character-modal__validation-list">
            <strong>Locked Structure</strong>
            <div>nodes, edges, seed, grafts, and export layout are read-only.</div>
            <div>Only literal values from the editable schema can change.</div>
          </div>

          {validation.ok && validation.snapshot ? (
            <div className="character-modal__validation-list">
              <strong>Ready snapshot</strong>
              <div>root: {validation.snapshot.root ?? "none"}</div>
              <div>nodes: {validation.snapshot.nodes.length}</div>
              <div>edges: {validation.snapshot.edges.length}</div>
            </div>
          ) : null}

          <div className="character-modal__raw-preview">
            <div className="character-modal__label">Character TAT Preview</div>
            <div className="character-modal__editor-shell">
              <Editor
                height="360px"
                defaultLanguage={TAT_LANGUAGE_ID}
                language={TAT_LANGUAGE_ID}
                value={previewSource}
                theme="tat-dark"
                beforeMount={configureTatMonaco}
                onMount={onEditorMount}
                options={{
                  automaticLayout: true,
                  fontSize: 14,
                  minimap: { enabled: false },
                  padding: { top: 16 },
                  readOnly: true,
                  domReadOnly: true,
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  lineNumbers: "on",
                }}
              />
            </div>
          </div>

          <div className="character-modal__validation-hint">{validationHint}</div>
        </div>
      </div>
    </div>
  );
}
