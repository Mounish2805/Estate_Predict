import React from 'react';
import Icon from './Icon';

export default function PropertyContext({ propertyContext }) {
  if (!propertyContext) return null;

  const avgPrice = propertyContext.avg_price_sqft
    ? `₹${Number(propertyContext.avg_price_sqft).toLocaleString('en-IN')}`
    : '—';

  const priceRange =
    propertyContext.min_price_sqft && propertyContext.max_price_sqft
      ? `₹${Number(propertyContext.min_price_sqft).toLocaleString('en-IN')} – ₹${Number(propertyContext.max_price_sqft).toLocaleString('en-IN')}`
      : '—';

  return (
    <div className="explorer-section-card">
      <div className="explorer-section-header">
        <Icon name="chart" size={16} />
        <h3>PROPERTY CONTEXT</h3>
      </div>
      <div className="explorer-prop-context-grid">
        <div className="explorer-prop-context-item">
          <span className="explorer-prop-label">AVERAGE PRICE / SQ.FT.</span>
          <strong className="explorer-prop-val highlight-gold">{avgPrice}</strong>
          <small className="explorer-prop-sub">Market Reference</small>
        </div>

        <div className="explorer-prop-context-item">
          <span className="explorer-prop-label">PRICE RANGE</span>
          <strong className="explorer-prop-val">{priceRange}</strong>
          <small className="explorer-prop-sub">Typical Rate Spread</small>
        </div>

        <div className="explorer-prop-context-item">
          <span className="explorer-prop-label">MARKET SEGMENT</span>
          <strong className="explorer-prop-val">{propertyContext.segment || 'Residential'}</strong>
          <small className="explorer-prop-sub">{propertyContext.market_demand || 'High'} Demand</small>
        </div>

        <div className="explorer-prop-context-item">
          <span className="explorer-prop-label">COMMON PROPERTY TYPES</span>
          <strong className="explorer-prop-val" style={{ fontSize: 14 }}>
            {propertyContext.common_property_types ? propertyContext.common_property_types.join(' · ') : 'Apartments'}
          </strong>
          <small className="explorer-prop-sub">Typical Inventory</small>
        </div>
      </div>
    </div>
  );
}
