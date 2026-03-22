import React from "react";

export default function LoadedCharacterCardSummary({
  card,
  isExpanded,
  isSelected,
  onToggleExpanded,
}) {
  return (
    <>
      <div className="character-inspector__loaded-header">
        <div>
          <div className="character-inspector__loaded-title-row">
            <h2 className="character-inspector__loaded-title">{card.displayName}</h2>
            {isSelected ? (
              <span className="character-inspector__loaded-badge">Active</span>
            ) : null}
          </div>
          <h3 className="character-inspector__loaded-subtitle">
            {(card.className ?? "Unknown")} {"\u2022"} {(card.type ?? "Unknown")}
          </h3>
        </div>

        <button
          type="button"
          className="character-inspector__loaded-toggle"
          onClick={onToggleExpanded}
        >
          {isExpanded ? "Hide Raw" : "Show Raw"}
        </button>
      </div>

      <div className="character-inspector__loaded-section">
        <div className="character-inspector__loaded-section-title">Core Stats</div>
        <div className="character-inspector__loaded-stats">
          {card.stats.map((stat) => (
            <div key={stat.key} className="character-inspector__loaded-stat">
              <span className="character-inspector__loaded-stat-label">
                {stat.label}
              </span>
              <span className="character-inspector__loaded-stat-value">
                {stat.value ?? "--"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
