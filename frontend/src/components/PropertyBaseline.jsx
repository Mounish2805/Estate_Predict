import React from 'react';

export default function PropertyBaseline({
  locality,
  propertyType,
  area,
  bedrooms,
  bathrooms,
  floor,
  totalFloors,
  propertyAge
}) {
  return (
    <div className="whatif-fixed-box">
      <div className="whatif-fixed-header">
        <span className="whatif-fixed-label">CURRENT PROPERTY</span>
        <span className="whatif-fixed-badge">BASELINE</span>
      </div>
      <div className="whatif-fixed-grid">
        <div className="whatif-fixed-item">
          <span>LOCALITY</span>
          <span>{locality}</span>
        </div>
        <div className="whatif-fixed-item">
          <span>PROPERTY TYPE</span>
          <span>{propertyType}</span>
        </div>
        <div className="whatif-fixed-item">
          <span>BUILT-UP AREA</span>
          <span>{Number(area).toLocaleString('en-IN')} sq.ft.</span>
        </div>
        <div className="whatif-fixed-item">
          <span>CONFIGURATION</span>
          <span>{bedrooms} BHK · {bathrooms} Bath</span>
        </div>
        <div className="whatif-fixed-item">
          <span>FLOOR</span>
          <span>{floor} of {totalFloors}</span>
        </div>
        <div className="whatif-fixed-item">
          <span>PROPERTY AGE</span>
          <span>{propertyAge} {Number(propertyAge) === 1 ? 'Yr' : 'Yrs'}</span>
        </div>
      </div>
    </div>
  );
}
