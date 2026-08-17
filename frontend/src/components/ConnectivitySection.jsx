import React from 'react';
import Icon from './Icon';

export default function ConnectivitySection({ connectivity }) {
  if (!connectivity) return null;

  return (
    <div className="explorer-section-card">
      <div className="explorer-section-header">
        <Icon name="sliders" size={16} />
        <h3>CONNECTIVITY</h3>
      </div>
      <div className="explorer-connectivity-grid">
        <div className="explorer-connectivity-item">
          <div className="explorer-item-header">
            <span className="explorer-item-icon">🚇</span>
            <strong>Metro Connectivity</strong>
          </div>
          <p>{connectivity.metro || 'Nearby metro connectivity available.'}</p>
        </div>

        <div className="explorer-connectivity-item">
          <div className="explorer-item-header">
            <span className="explorer-item-icon">🛣️</span>
            <strong>Road Connectivity</strong>
          </div>
          <p>{connectivity.roads || 'Connected via major arterial road corridors.'}</p>
        </div>

        <div className="explorer-connectivity-item">
          <div className="explorer-item-header">
            <span className="explorer-item-icon">✈️</span>
            <strong>Airport Connectivity</strong>
          </div>
          <p>{connectivity.airport || 'Connected to Rajiv Gandhi International Airport (RGIA).'}</p>
        </div>
      </div>
    </div>
  );
}
