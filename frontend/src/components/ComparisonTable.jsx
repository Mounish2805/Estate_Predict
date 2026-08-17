import React from 'react';
import Icon from './Icon';
import { formatPrice, formatDate } from '../utils/formatters';

export default function ComparisonTable({ propA, propB }) {
  if (!propA || !propB) return null;

  const areaA = Number(propA.area_sqft || 0);
  const areaB = Number(propB.area_sqft || 0);

  const inrA = Number(propA.predicted_price_inr || 0);
  const inrB = Number(propB.predicted_price_inr || 0);

  const priceSqFtA = areaA > 0 ? Math.round(inrA / areaA) : 0;
  const priceSqFtB = areaB > 0 ? Math.round(inrB / areaB) : 0;

  const getAmenitiesList = (p) => {
    const list = [];
    if (Number(p.parking) === 1 || p.parking === true) list.push('Parking');
    if (p.lift === 'Yes' || p.lift === true) list.push('Lift');
    if (p.power_backup === 'Yes' || p.powerBackup === true) list.push('Power Backup');
    if (p.security === 'Yes' || p.security === true) list.push('Security');
    if (p.gym === 'Yes' || p.gym === true) list.push('Gym');
    if (p.swimming_pool === 'Yes' || p.swimmingPool === true) list.push('Swimming Pool');
    return list;
  };

  const amenitiesA = getAmenitiesList(propA);
  const amenitiesB = getAmenitiesList(propB);

  const rows = [
    { label: 'Locality', valA: propA.locality, valB: propB.locality, strong: true },
    { label: 'Property Type', valA: propA.property_type, valB: propB.property_type },
    {
      label: 'Built-up Area',
      valA: `${areaA.toLocaleString('en-IN')} sq.ft.`,
      valB: `${areaB.toLocaleString('en-IN')} sq.ft.`,
      strong: true
    },
    {
      label: 'Configuration',
      valA: `${propA.bedrooms} BHK · ${propA.bathrooms} Bath`,
      valB: `${propB.bedrooms} BHK · ${propB.bathrooms} Bath`
    },
    {
      label: 'Balconies',
      valA: `${propA.balconies !== undefined ? propA.balconies : '—'}`,
      valB: `${propB.balconies !== undefined ? propB.balconies : '—'}`
    },
    {
      label: 'Floor Position',
      valA: `Floor ${propA.floor} of ${propA.total_floors}`,
      valB: `Floor ${propB.floor} of ${propB.total_floors}`
    },
    {
      label: 'Property Age',
      valA: `${propA.property_age} ${Number(propA.property_age) === 1 ? 'Year' : 'Years'}`,
      valB: `${propB.property_age} ${Number(propB.property_age) === 1 ? 'Year' : 'Years'}`
    },
    { label: 'Furnishing Status', valA: propA.furnished || '—', valB: propB.furnished || '—' },
    {
      label: 'Amenities',
      valA: (
        <div>
          <strong>{amenitiesA.length} Included</strong>
          <div className="compare-amenities-tags">
            {amenitiesA.map((a, i) => (
              <span key={i} className="compare-amenity-tag">✓ {a}</span>
            ))}
          </div>
        </div>
      ),
      valB: (
        <div>
          <strong>{amenitiesB.length} Included</strong>
          <div className="compare-amenities-tags">
            {amenitiesB.map((b, i) => (
              <span key={i} className="compare-amenity-tag">✓ {b}</span>
            ))}
          </div>
        </div>
      )
    },
    {
      label: 'Facing & Water',
      valA: `${propA.facing || 'East'} · ${propA.water_supply || '24x7'}`,
      valB: `${propB.facing || 'East'} · ${propB.water_supply || '24x7'}`
    },
    {
      label: 'Estimated Value',
      valA: <strong className="compare-table-price highlight-gold">{formatPrice(propA.predicted_price_lakhs)}</strong>,
      valB: <strong className="compare-table-price highlight-gold">{formatPrice(propB.predicted_price_lakhs)}</strong>,
      highlight: true
    },
    {
      label: 'Price / sq.ft.',
      valA: `₹${priceSqFtA.toLocaleString('en-IN')} / sq.ft.`,
      valB: `₹${priceSqFtB.toLocaleString('en-IN')} / sq.ft.`,
      highlight: true
    },
    {
      label: 'Valuation Date',
      valA: formatDate(propA.created_at),
      valB: formatDate(propB.created_at)
    }
  ];

  return (
    <div className="compare-table-wrapper">
      <div className="compare-table-header-cards">
        <div className="compare-header-card prop-a">
          <span className="compare-slot-tag">PROPERTY A</span>
          <h3>{propA.locality}</h3>
          <div className="compare-header-sub">{propA.bedrooms} BHK {propA.property_type} · {areaA.toLocaleString('en-IN')} sq.ft.</div>
          <div className="compare-header-price">{formatPrice(propA.predicted_price_lakhs)}</div>
          <div className="compare-header-rate">₹{priceSqFtA.toLocaleString('en-IN')} / sq.ft.</div>
        </div>

        <div className="compare-header-divider">
          <span>VS</span>
        </div>

        <div className="compare-header-card prop-b">
          <span className="compare-slot-tag">PROPERTY B</span>
          <h3>{propB.locality}</h3>
          <div className="compare-header-sub">{propB.bedrooms} BHK {propB.property_type} · {areaB.toLocaleString('en-IN')} sq.ft.</div>
          <div className="compare-header-price">{formatPrice(propB.predicted_price_lakhs)}</div>
          <div className="compare-header-rate">₹{priceSqFtB.toLocaleString('en-IN')} / sq.ft.</div>
        </div>
      </div>

      <table className="compare-table">
        <thead>
          <tr>
            <th className="compare-col-feature">PROPERTY FEATURE</th>
            <th className="compare-col-a">PROPERTY A ({propA.locality})</th>
            <th className="compare-col-b">PROPERTY B ({propB.locality})</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className={row.highlight ? 'highlight-row' : ''}>
              <td className="compare-cell-feature">{row.label}</td>
              <td className="compare-cell-val prop-a-val">{row.valA}</td>
              <td className="compare-cell-val prop-b-val">{row.valB}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
