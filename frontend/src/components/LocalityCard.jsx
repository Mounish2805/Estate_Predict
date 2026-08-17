import React from 'react';
import Icon from './Icon';

export default function LocalityCard({ locality, onSelect }) {
  const avgPrice = locality.avg_price_sqft
    ? `₹${Number(locality.avg_price_sqft).toLocaleString('en-IN')} / sq.ft.`
    : 'Rate on request';

  return (
    <div className="locality-card" onClick={() => onSelect(locality.name)}>
      <div className="locality-card-top">
        <div className="locality-card-header-row">
          <div>
            <h3 className="locality-card-name">{locality.name}</h3>
            <div className="locality-card-region">{locality.region}</div>
          </div>
          <span className="locality-card-segment">{locality.segment}</span>
        </div>
      </div>

      <div className="locality-card-body">
        <div className="locality-card-stat">
          <span className="locality-card-stat-label">AVERAGE PRICE</span>
          <strong className="locality-card-stat-val">{avgPrice}</strong>
        </div>
        <div className="locality-card-stat">
          <span className="locality-card-stat-label">PROPERTY CONTEXT</span>
          <span className="locality-card-stat-context">
            {locality.common_property_types ? locality.common_property_types.join(' · ') : 'Residential'}
          </span>
        </div>
      </div>

      <div className="locality-card-footer">
        <span className="locality-card-cta">
          <span>VIEW LOCALITY</span>
          <Icon name="chevronRight" size={14} />
        </span>
      </div>
    </div>
  );
}
