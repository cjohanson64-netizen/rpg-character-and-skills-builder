import React from "react";

export default function SavedCharactersWorkspacePanel({
  hasSavedCharacter,
  savedCharacterName,
  activeTemplateLabel,
  selectedSavedCharacterName,
  onSelectSavedCharacter,
  savedCharacters,
  onOpenCreateModal,
  onOpenEditCharacterModal,
  canEditCharacter,
  onDeleteCharacter,
}) {
  return (
    <div className="character-inspector__panel character-inspector__persistence">
      <div className="character-inspector__persistence-header">
        <h2 className="character-inspector__section-title">Saved Characters</h2>
        <div className="character-inspector__persistence-meta">
          {hasSavedCharacter
            ? `Active instance: "${savedCharacterName}" from ${activeTemplateLabel}`
            : "No saved character"}
        </div>
      </div>

      <div className="character-inspector__persistence-controls">
        <select
          className="character-inspector__input character-inspector__select"
          value={selectedSavedCharacterName}
          onChange={(e) => onSelectSavedCharacter(e.target.value)}
          disabled={!savedCharacters.length}
        >
          {savedCharacters.length === 0 ? (
            <option value="">No saved instances</option>
          ) : (
            savedCharacters.map((instance) => (
              <option key={instance.name} value={instance.name}>
                {instance.name}
              </option>
            ))
          )}
        </select>

        <div className="character-inspector__persistence-actions">
          <button onClick={onOpenCreateModal}>Create Character</button>
          <button onClick={onOpenEditCharacterModal} disabled={!canEditCharacter}>
            Edit Character
          </button>
          <button onClick={onDeleteCharacter} disabled={!hasSavedCharacter}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
