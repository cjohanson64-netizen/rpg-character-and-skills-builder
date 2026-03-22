import React from "react";

const CORE_STAT_FIELDS = ["hp", "atk", "def", "int", "res", "spd"];
const CHARACTER_TYPE_OPTIONS = ["hero", "enemy", "npc"];

export default function CharacterBuilderForm({
  showPresetSelector = false,
  templates = [],
  selectedTemplateId = "",
  onTemplateChange,
  builderForm,
  onFieldChange,
}) {
  return (
    <>
      {showPresetSelector ? (
        <div className="character-modal__builder-section">
          <h3 className="character-modal__builder-title">Preset</h3>
          <div className="character-modal__builder-fields">
            <label className="character-modal__field">
              <span className="character-modal__label">Starting Template</span>
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
          </div>
        </div>
      ) : null}

      <div className="character-modal__builder-section">
        <h3 className="character-modal__builder-title">Identity</h3>
        <div className="character-modal__builder-fields">
          <label className="character-modal__field">
            <span className="character-modal__label">Character Name</span>
            <input
              className="character-inspector__input"
              value={builderForm.instanceName}
              onChange={(event) =>
                onFieldChange("instanceName", event.target.value)
              }
              placeholder="Aria the Warrior"
            />
          </label>

          <label className="character-modal__field">
            <span className="character-modal__label">Class</span>
            <input
              className="character-inspector__input"
              value={builderForm.rootId}
              onChange={(event) => onFieldChange("rootId", event.target.value)}
              placeholder="aria"
            />
          </label>

          <label className="character-modal__field">
            <span className="character-modal__label">Display Name</span>
            <input
              className="character-inspector__input"
              value={builderForm.displayName}
              onChange={(event) =>
                onFieldChange("displayName", event.target.value)
              }
              placeholder="Aria"
            />
          </label>

          <label className="character-modal__field">
            <span className="character-modal__label">Character Type</span>
            <select
              className="character-inspector__input character-inspector__select"
              value={builderForm.type}
              onChange={(event) => onFieldChange("type", event.target.value)}
            >
              {CHARACTER_TYPE_OPTIONS.map((typeOption) => (
                <option key={typeOption} value={typeOption}>
                  {typeOption}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="character-modal__builder-section">
        <h3 className="character-modal__builder-title">Core Stats</h3>
        <div className="character-modal__builder-stats">
          {CORE_STAT_FIELDS.map((statKey) => (
            <label key={statKey} className="character-modal__field">
              <span className="character-modal__label">{statKey.toUpperCase()}</span>
              <input
                type="number"
                className="character-inspector__input"
                value={builderForm[statKey]}
                onChange={(event) => onFieldChange(statKey, event.target.value)}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="character-modal__builder-section">
        <h3 className="character-modal__builder-title">Semantic Metadata</h3>
        <div className="character-modal__builder-fields">
          <label className="character-modal__field">
            <span className="character-modal__label">Description</span>
            <textarea
              className="character-inspector__input character-modal__textarea"
              value={builderForm.description}
              onChange={(event) =>
                onFieldChange("description", event.target.value)
              }
              placeholder="Short summary of this character."
            />
          </label>

          <label className="character-modal__field">
            <span className="character-modal__label">Biography</span>
            <textarea
              className="character-inspector__input character-modal__textarea"
              value={builderForm.biography}
              onChange={(event) =>
                onFieldChange("biography", event.target.value)
              }
              placeholder="Background and story details."
            />
          </label>

          <label className="character-modal__field">
            <span className="character-modal__label">Notes</span>
            <textarea
              className="character-inspector__input character-modal__textarea"
              value={builderForm.notes}
              onChange={(event) => onFieldChange("notes", event.target.value)}
              placeholder="Designer notes, reminder text, or semantic tags."
            />
          </label>
        </div>
      </div>
    </>
  );
}
