import React from "react";
import LoadedCharacterCardSummary from "./LoadedCharacterCardSummary";

export default function LoadedCharacterCard({
  card,
  isExpanded,
  isSelected,
  onToggleExpanded,
}) {
  return (
    <div
      className={`character-inspector__loaded-card ${
        isSelected ? "is-selected" : ""
      }`}
    >
      <LoadedCharacterCardSummary
        card={card}
        isExpanded={isExpanded}
        isSelected={isSelected}
        onToggleExpanded={onToggleExpanded}
      />

      {card.statuses.length > 0 ? (
        <div className="character-inspector__loaded-section">
          <div className="character-inspector__loaded-section-title">
            Status Effects
          </div>
          <div className="character-inspector__loaded-chip-groups">
            {card.statuses.map((section) => (
              <div key={section.key} className="character-inspector__loaded-chip-group">
                <div className="character-inspector__loaded-chip-group-title">
                  {section.label}
                </div>
                <div className="character-inspector__loaded-chips">
                  {section.items.map((item) => (
                    <span
                      key={`${section.key}:${item}`}
                      className="character-inspector__loaded-chip"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {card.statuses.length === 0 ? (
        <div className="character-inspector__world-token-hint">
          No visible status, buff, or debuff lanes on this root character yet.
        </div>
      ) : null}

      {isExpanded ? (
        <pre className="character-inspector__code-block character-inspector__loaded-raw">
          {JSON.stringify(card.rawSnapshot, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
