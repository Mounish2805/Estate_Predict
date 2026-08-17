import React from 'react';
import Icon from './Icon';
import { formatPrice, formatDifference } from '../utils/formatters';

export default function ScenarioResult({ scenarioResult, originalLakhs, originalInr, resultRef }) {
  if (!scenarioResult) {
    return (
      <div className="whatif-placeholder" ref={resultRef}>
        <div className="whatif-placeholder-icon">
          <Icon name="sliders" size={28} />
        </div>
        <h4>Ready to Calculate Scenario</h4>
        <p>
          Adjust furnishing or amenities on the left and calculate to see the estimated valuation difference.
        </p>
      </div>
    );
  }

  const { scenarioLakhs, scenarioInr, diffLakhs, diffInr, diffPercent, changesList } = scenarioResult;
  const isPositive = diffInr > 0;
  const isNegative = diffInr < 0;

  return (
    <div className="whatif-result-card" ref={resultRef}>
      <div className="whatif-result-header">
        <h3>Scenario Valuation Result</h3>
        <p>Estimated impact based on trained Hyderabad regression model</p>
      </div>

      <div className="whatif-comparison-grid">
        <div className="whatif-val-box">
          <div className="whatif-val-box-label">ORIGINAL ESTIMATE</div>
          <div className="whatif-val-box-price">{formatPrice(originalLakhs)}</div>
          <div className="whatif-val-box-sub">
            ₹{originalInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="whatif-val-box scenario-highlight">
          <div className="whatif-val-box-label">SCENARIO ESTIMATE</div>
          <div className="whatif-val-box-price">{formatPrice(scenarioLakhs)}</div>
          <div className="whatif-val-box-sub">
            ₹{scenarioInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className={`whatif-diff-box ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}`}>
        <div>
          <div className="whatif-diff-left-label">ESTIMATED DIFFERENCE</div>
          <div className="whatif-diff-amount">
            {isPositive ? '+' : isNegative ? '−' : ''}
            {formatDifference(diffLakhs, diffInr)}
          </div>
        </div>
        <div className="whatif-diff-badge">
          {diffPercent > 0 ? `+${diffPercent.toFixed(1)}%` : diffPercent < 0 ? `${diffPercent.toFixed(1)}%` : '0.0%'}
        </div>
      </div>

      {changesList && changesList.length > 0 && (
        <div className="whatif-breakdown-box">
          <div className="whatif-breakdown-title">Scenario Changes Evaluated</div>
          {changesList.map((item, idx) => (
            <div className="whatif-breakdown-item" key={idx}>
              <span>{item.label}</span>
              <span
                className={
                  item.type === 'amenity_add'
                    ? 'whatif-change-tag-add'
                    : item.type === 'amenity_remove'
                    ? 'whatif-change-tag-remove'
                    : ''
                }
              >
                {item.detail}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="whatif-disclaimer">
        <Icon name="shield" size={14} />
        <span>
          The Estimated Impact is a statistical prediction generated from the property features and should not be considered a guaranteed commercial return.
        </span>
      </div>
    </div>
  );
}
