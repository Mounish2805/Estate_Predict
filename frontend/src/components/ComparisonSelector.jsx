import React from 'react';
import Icon from './Icon';
import { formatPrice, formatDate } from '../utils/formatters';

export default function ComparisonSelector({
  valuations,
  selectedIds,
  onToggleSelect,
  onCompare
}) {
  const isReady = selectedIds.length === 2;

  const propA = valuations.find((v) => v.id === selectedIds[0]);
  const propB = valuations.find((v) => v.id === selectedIds[1]);

  return (
    <div className="compare-selector-container">
      {/* Top Selection Status Bar */}
      <div className="compare-status-card">
        <div className="compare-status-left">
          <div className="compare-status-indicator">
            <span className="compare-step-num">{selectedIds.length}/2</span>
            <div>
              <div className="compare-status-title">
                {selectedIds.length === 0
                  ? 'Select 2 properties to compare'
                  : selectedIds.length === 1
                  ? 'Select 1 more property to compare'
                  : 'Ready to compare 2 properties'}
              </div>
              <div className="compare-status-sub">
                Choose any two of your saved valuations from the list below
              </div>
            </div>
          </div>

          <div className="compare-selected-previews">
            <div className={`compare-preview-pill ${propA ? 'filled' : 'empty'}`}>
              <span className="compare-slot-label">Property A:</span>
              <strong>{propA ? `${propA.locality} (${formatPrice(propA.predicted_price_lakhs)})` : 'Not selected'}</strong>
            </div>
            <div className={`compare-preview-pill ${propB ? 'filled' : 'empty'}`}>
              <span className="compare-slot-label">Property B:</span>
              <strong>{propB ? `${propB.locality} (${formatPrice(propB.predicted_price_lakhs)})` : 'Not selected'}</strong>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="compare-launch-btn"
          disabled={!isReady}
          onClick={onCompare}
        >
          <Icon name="chart" size={17} />
          <span>COMPARE PROPERTIES</span>
        </button>
      </div>

      {/* Grid of Saved Valuations */}
      <div className="compare-selection-grid">
        {valuations.map((v) => {
          const isSelected = selectedIds.includes(v.id);
          const slotLabel = selectedIds[0] === v.id ? 'Property A' : selectedIds[1] === v.id ? 'Property B' : null;
          const area = Number(v.area_sqft || 0);
          const priceSqFt = area > 0 && v.predicted_price_inr ? Math.round(Number(v.predicted_price_inr) / area) : null;
          const dateStr = formatDate(v.created_at);

          return (
            <div
              key={v.id}
              className={`compare-select-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onToggleSelect(v.id)}
            >
              <div className="compare-select-card-top">
                <div className="compare-select-header">
                  <div className="compare-select-name">
                    <h3>{v.locality}</h3>
                    <span>{v.property_type}</span>
                  </div>
                  {slotLabel && <span className="compare-slot-badge">{slotLabel}</span>}
                </div>

                <div className="compare-select-price-row">
                  <div className="compare-select-price">{formatPrice(v.predicted_price_lakhs)}</div>
                  {priceSqFt && (
                    <div className="compare-select-sqft">
                      ₹{priceSqFt.toLocaleString('en-IN')} <small>/ sq.ft.</small>
                    </div>
                  )}
                </div>

                <div className="compare-select-specs">
                  <div className="compare-spec-item">
                    <span>Config</span>
                    <strong>{v.bedrooms} BHK · {v.bathrooms} Bath</strong>
                  </div>
                  <div className="compare-spec-item">
                    <span>Area</span>
                    <strong>{area.toLocaleString('en-IN')} sq.ft.</strong>
                  </div>
                  <div className="compare-spec-item">
                    <span>Furnishing</span>
                    <strong>{v.furnished || '—'}</strong>
                  </div>
                  <div className="compare-spec-item">
                    <span>Floor</span>
                    <strong>{v.floor} of {v.total_floors}</strong>
                  </div>
                </div>
              </div>

              <div className="compare-select-card-footer">
                <span className="compare-select-date">{dateStr}</span>
                <button
                  type="button"
                  className={`compare-check-btn ${isSelected ? 'checked' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect(v.id);
                  }}
                >
                  {isSelected ? (
                    <>
                      <span>Selected</span>
                      <span>✓</span>
                    </>
                  ) : (
                    <span>Select Property</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
