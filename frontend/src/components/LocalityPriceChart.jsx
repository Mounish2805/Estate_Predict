import React, { useState } from 'react';

export default function LocalityPriceChart({ historicalPrices }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  if (!historicalPrices || historicalPrices.length === 0) {
    return <div style={{ padding: '20px 0', color: '#737873', fontSize: 13 }}>No historical price points available.</div>;
  }

  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;
  const width = 680;
  const height = 240;

  const prices = historicalPrices.map(p => p.avg_price_sqft);
  const minPrice = Math.min(...prices) * 0.92;
  const maxPrice = Math.max(...prices) * 1.06;

  const getX = (idx) => paddingLeft + (idx / (historicalPrices.length - 1)) * (width - paddingLeft - paddingRight);
  const getY = (price) => height - paddingBottom - ((price - minPrice) / (maxPrice - minPrice)) * (height - paddingTop - paddingBottom);

  const points = historicalPrices.map((p, i) => `${getX(i)},${getY(p.avg_price_sqft)}`).join(' ');

  // Create area fill path
  const firstX = getX(0);
  const lastX = getX(historicalPrices.length - 1);
  const baseY = height - paddingBottom;
  const areaPath = `M ${firstX},${baseY} L ${points.replace(/ /g, ' L ')} L ${lastX},${baseY} Z`;

  // Grid lines
  const gridSteps = 4;
  const gridPrices = Array.from({ length: gridSteps }, (_, i) => minPrice + (i / (gridSteps - 1)) * (maxPrice - minPrice));

  return (
    <div className="locality-chart-container">
      <svg viewBox={`0 0 ${width} ${height}`} className="locality-chart-svg">
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C89B5D" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#C89B5D" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Y Grid lines & labels */}
        {gridPrices.map((p, i) => {
          const y = getY(p);
          return (
            <g key={i}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#EFECE5" strokeWidth="1" strokeDasharray="3 3" />
              <text x={paddingLeft - 10} y={y + 4} textAnchor="end" fontSize="10.5" fill="#8C9491" fontFamily="sans-serif">
                ₹{Math.round(p / 1000)}k
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#trendGradient)" />

        {/* Trend line */}
        <polyline fill="none" stroke="#183A37" strokeWidth="2.5" points={points} strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots & X labels */}
        {historicalPrices.map((p, i) => {
          const cx = getX(i);
          const cy = getY(p.avg_price_sqft);
          const isHovered = hoveredIdx === i;

          return (
            <g key={i} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)} style={{ cursor: 'pointer' }}>
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 6 : 4.5}
                fill={isHovered ? "#C89B5D" : "#183A37"}
                stroke="#FFFFFF"
                strokeWidth="2"
                style={{ transition: 'all 0.2s ease' }}
              />
              <text x={cx} y={height - paddingBottom + 20} textAnchor="middle" fontSize="11" fill="#737873" fontWeight="500">
                {p.period}
              </text>

              {isHovered && (
                <g>
                  <rect x={cx - 45} y={cy - 34} width="90" height="24" rx="4" fill="#183A37" />
                  <text x={cx} y={cy - 18} textAnchor="middle" fontSize="11" fill="#FFFFFF" fontWeight="700">
                    ₹{p.avg_price_sqft.toLocaleString('en-IN')}/sqft
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
