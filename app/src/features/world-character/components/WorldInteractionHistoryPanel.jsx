import React from "react";
import {
  formatWorldInteractionAction,
  formatWorldInteractionEffectSummary,
} from "../utils/formatWorldInteractionLogEntry";

export default function WorldInteractionHistoryPanel({
  worldNodes,
  worldInteractions,
  currentWorldSubject,
  onWorldSubjectChange,
  selectedWorldDefinitionId,
  onSelectedWorldDefinitionIdChange,
  authoredWorldDefinitions,
  currentWorldObject,
  onWorldObjectChange,
  selectedWorldDefinition,
  currentWorldRelationContract,
  worldInteractionError,
  onCreateWorldEdge,
}) {
  return (
    <div className="character-inspector__panel character-inspector__world">
      <div className="character-inspector__persistence-header">
        <h2 className="character-inspector__section-title">World Interaction History</h2>
        <div className="character-inspector__persistence-meta">
          {worldNodes.length} instances, {worldInteractions.length} interaction events
        </div>
      </div>

      <form onSubmit={onCreateWorldEdge} className="character-inspector__world-form">
        <select
          className="character-inspector__input character-inspector__select"
          value={currentWorldSubject}
          onChange={(e) => onWorldSubjectChange(e.target.value)}
          disabled={worldNodes.length === 0}
        >
          {worldNodes.length === 0 ? (
            <option value="">No instances</option>
          ) : (
            worldNodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.label ?? node.id}
              </option>
            ))
          )}
        </select>

        <select
          className="character-inspector__input character-inspector__select"
          value={selectedWorldDefinitionId}
          onChange={(e) => onSelectedWorldDefinitionIdChange(e.target.value)}
          disabled={authoredWorldDefinitions.length === 0}
        >
          <option value="">Select Interaction Definition</option>
          {authoredWorldDefinitions.map((definition) => (
            <option key={definition.id} value={definition.id}>
              {definition.name} ({definition.baseRelation})
            </option>
          ))}
        </select>

        <select
          className="character-inspector__input character-inspector__select"
          value={currentWorldObject}
          onChange={(e) => onWorldObjectChange(e.target.value)}
          disabled={worldNodes.length === 0}
        >
          {worldNodes.length === 0 ? (
            <option value="">No instances</option>
          ) : (
            worldNodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.label ?? node.id}
              </option>
            ))
          )}
        </select>

        <button
          type="submit"
          disabled={
            worldNodes.length === 0 ||
            !selectedWorldDefinition ||
            !currentWorldSubject ||
            !currentWorldObject
          }
        >
          Record Interaction
        </button>
      </form>

      {authoredWorldDefinitions.length === 0 ? (
        <div className="character-inspector__status">
          No saved interaction definitions yet. Create one below to enable
          world interaction recording.
        </div>
      ) : selectedWorldDefinition ? (
        <div className="character-inspector__world-token-hint">
          {selectedWorldDefinition.name} uses the{" "}
          {selectedWorldDefinition.baseRelation} base family.
          {currentWorldRelationContract?.notes
            ? ` ${currentWorldRelationContract.notes}`
            : ""}
        </div>
      ) : (
        <div className="character-inspector__status">
          Select a saved interaction definition to record an interaction.
        </div>
      )}

      {worldInteractionError ? (
        <div className="character-inspector__status">{worldInteractionError}</div>
      ) : null}

      <div className="character-inspector__world-list">
        {worldInteractions.length === 0 ? (
          <div className="character-inspector__status">No interaction history yet.</div>
        ) : (
          worldInteractions.map((interaction) => (
            <div key={interaction.id} className="character-inspector__world-item">
              <div className="character-inspector__list-button character-inspector__world-button">
                <div className="character-inspector__list-button-title">
                  {formatWorldInteractionAction(interaction)}
                </div>
                <div className="character-inspector__list-button-subtitle">
                  Effect: {formatWorldInteractionEffectSummary(interaction)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
