import React from 'react';
import Icon from './Icon';

export default function NearbyEssentials({ hospitals, schools }) {
  return (
    <div className="explorer-section-card">
      <div className="explorer-section-header">
        <Icon name="shield" size={16} />
        <h3>NEARBY ESSENTIALS</h3>
      </div>
      <div className="explorer-essentials-grid">
        <div className="explorer-essentials-col">
          <div className="explorer-essentials-title">
            <span className="explorer-essentials-icon">🏥</span>
            <strong>HOSPITALS</strong>
          </div>
          {hospitals && hospitals.length > 0 ? (
            <ul className="explorer-essentials-list">
              {hospitals.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          ) : (
            <p className="explorer-unavailable">Information unavailable</p>
          )}
        </div>

        <div className="explorer-essentials-col">
          <div className="explorer-essentials-title">
            <span className="explorer-essentials-icon">🏫</span>
            <strong>SCHOOLS</strong>
          </div>
          {schools && schools.length > 0 ? (
            <ul className="explorer-essentials-list">
              {schools.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          ) : (
            <p className="explorer-unavailable">Information unavailable</p>
          )}
        </div>
      </div>
    </div>
  );
}
