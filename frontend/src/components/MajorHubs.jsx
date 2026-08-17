import React from 'react';
import Icon from './Icon';

export default function MajorHubs({ hubs }) {
  if (!hubs || hubs.length === 0) return null;

  return (
    <div className="explorer-section-card">
      <div className="explorer-section-header">
        <Icon name="building" size={16} />
        <h3>MAJOR HUBS</h3>
      </div>
      <div className="explorer-hubs-grid">
        {hubs.map((hub, idx) => (
          <div className="explorer-hub-chip" key={idx}>
            <span className="explorer-hub-bullet">🏢</span>
            <span>{hub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
