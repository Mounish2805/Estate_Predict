import React from 'react';
import Icon from './Icon';
import { formatPrice, formatDifference } from '../utils/formatters';

export default function ComparisonSummary({ propA, propB }) {
  if (!propA || !propB) return null;

  const inrA = Number(propA.predicted_price_inr || 0);
  const inrB = Number(propB.predicted_price_inr || 0);

  const lakhsA = Number(propA.predicted_price_lakhs || 0);
  const lakhsB = Number(propB.predicted_price_lakhs || 0);

  const diffInr = inrA - inrB;
  const diffLakhs = lakhsA - lakhsB;
  const absDiffInr = Math.abs(diffInr);
  const absDiffLakhs = Math.abs(diffLakhs);

  const baseInr = Math.min(inrA, inrB);
  const pctDiff = baseInr > 0 ? (absDiffInr / baseInr) * 100 : 0;

  const areaA = Number(propA.area_sqft || 0);
  const areaB = Number(propB.area_sqft || 0);
  const rateA = areaA > 0 ? Math.round(inrA / areaA) : 0;
  const rateB = areaB > 0 ? Math.round(inrB / areaB) : 0;
  const rateDiff = Math.abs(rateA - rateB);

  let comparisonText = '';
  if (diffInr > 0) {
    comparisonText = `Property A (${propA.locality}) is estimated at ${formatDifference(absDiffLakhs, absDiffInr)} (${pctDiff.toFixed(1)}%) higher than Property B (${propB.locality}).`;
  } else if (diffInr < 0) {
    comparisonText = `Property A (${propA.locality}) is estimated at ${formatDifference(absDiffLakhs, absDiffInr)} (${pctDiff.toFixed(1)}%) lower than Property B (${propB.locality}).`;
  } else {
    comparisonText = `Both properties have identical estimated market values of ${formatPrice(lakhsA)}.`;
  }

  return (
    <div className="compare-summary-card">
      <div className="compare-summary-header">
        <Icon name="chart" size={16} />
        <h3>VALUE DIFFERENCE SUMMARY</h3>
      </div>

      <div className="compare-summary-body">
        <div className="compare-summary-stat-grid">
          <div className="compare-summary-stat">
            <span className="compare-stat-label">ESTIMATED PRICE DIFFERENCE</span>
            <div className="compare-stat-val highlight-gold">
              {diffInr === 0 ? '₹0' : formatDifference(absDiffLakhs, absDiffInr)}
            </div>
            <small className="compare-stat-sub">
              {diffInr === 0 ? 'Equal Valuation' : `${pctDiff.toFixed(1)}% difference`}
            </small>
          </div>

          <div className="compare-summary-stat">
            <span className="compare-stat-label">RATE DIFFERENCE</span>
            <div className="compare-stat-val">
              ₹{rateDiff.toLocaleString('en-IN')} <small>/ sq.ft.</small>
            </div>
            <small className="compare-stat-sub">Spread between property rates</small>
          </div>
        </div>

        <div className="compare-summary-explanation">
          <Icon name="shield" size={16} />
          <p>{comparisonText}</p>
        </div>

        <div className="compare-summary-disclaimer">
          Note: This comparison reflects ML estimations based on respective property specifications, built-up areas, and micro-market parameters. It serves as a pricing reference and not an official financial appraisal.
        </div>
      </div>
    </div>
  );
}
