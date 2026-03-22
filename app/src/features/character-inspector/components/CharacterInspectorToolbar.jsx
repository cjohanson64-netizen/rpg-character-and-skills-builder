import React from "react";

export default function CharacterInspectorToolbar({
  onReset,
  onClearData,
}) {
  return (
    <div className="character-inspector__toolbar">
      <div className="character-inspector__toolbar-group">
        <button onClick={onReset}>Reset</button>
      </div>
      <div className="character-inspector__toolbar-group character-inspector__toolbar-group--end">
        <button
          onClick={onClearData}
          className="character-inspector__button--danger"
        >
          Clear Data
        </button>
      </div>
    </div>
  );
}
