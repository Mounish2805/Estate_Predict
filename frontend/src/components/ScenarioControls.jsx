import React from 'react';
import Icon from './Icon';

export default function ScenarioControls({
  furnished,
  originalFurnished,
  onFurnishedChange,
  amenities,
  onToggleAmenity,
  onCalculate,
  onReset,
  calculating,
  noChangeNotice,
  error
}) {
  const furnishOptions = ['Unfurnished', 'Semi-Furnished', 'Furnished'];
  const amenityItems = [
    ['parking', 'Parking'],
    ['lift', 'Lift'],
    ['powerBackup', 'Power Backup'],
    ['security', 'Security'],
    ['gym', 'Gym'],
    ['swimmingPool', 'Swimming Pool']
  ];

  return (
    <div className="whatif-controls-section">
      <div className="whatif-section-title">
        <Icon name="sliders" size={15} />
        <span>FURNISHING STATUS</span>
        <small>(Select one)</small>
      </div>

      <div className="whatif-furnish-group">
        {furnishOptions.map((opt) => (
          <div
            key={opt}
            className={`whatif-furnish-option ${furnished === opt ? 'active' : ''}`}
            onClick={() => onFurnishedChange(opt)}
          >
            <strong>{opt}</strong>
            {opt === originalFurnished && (
              <span className="whatif-current-tag">Current</span>
            )}
          </div>
        ))}
      </div>

      <div className="whatif-section-title">
        <Icon name="shield" size={15} />
        <span>SUPPORTED AMENITIES</span>
        <small>(Check to simulate)</small>
      </div>

      <div className="whatif-amenities-grid">
        {amenityItems.map(([k, label]) => (
          <label
            key={k}
            className={`whatif-amenity-pill ${amenities[k] ? 'active' : ''}`}
          >
            <input
              type="checkbox"
              checked={amenities[k]}
              onChange={() => onToggleAmenity(k)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>

      {noChangeNotice && (
        <div className="whatif-nochange-alert">
          <Icon name="shield" size={16} />
          <span>{noChangeNotice}</span>
        </div>
      )}

      {error && <div className="form-error" style={{ marginTop: 14 }}>{error}</div>}

      <div className="whatif-btn-row">
        <button
          type="button"
          className="whatif-calc-btn"
          disabled={calculating}
          onClick={onCalculate}
        >
          <Icon name="chart" size={17} />
          <span>{calculating ? 'Calculating Scenario…' : 'CALCULATE SCENARIO'}</span>
        </button>
        <button
          type="button"
          className="whatif-reset-btn"
          onClick={onReset}
          title="Reset scenario to original property configuration"
        >
          <Icon name="refresh" size={14} />
        </button>
      </div>
    </div>
  );
}
