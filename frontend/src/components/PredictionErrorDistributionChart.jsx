import React, { useState } from 'react';

export default function PredictionErrorDistributionChart({ errors = [] }) {
  const [hoveredBin, setHoveredBin] = useState(null);

  if (!errors.length) {
    return (
      <div className="admin-chart-placeholder-box">
        <p className="chart-placeholder-text">Evaluation data unavailable.</p>
      </div>
    );
  }

  const width = 540;
  const height = 320;
  const paddingLeft = 45;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 45;

  // Error range bounds
  const minError = -110;
  const maxError = 60;
  const binCount = 20;
  const binWidthVal = (maxError - minError) / binCount;

  // Calculate histogram bins
  const bins = Array.from({ length: binCount }, (_, i) => {
    const start = minError + i * binWidthVal;
    const end = start + binWidthVal;
    return {
      start,
      end,
      mid: (start + end) / 2,
      count: 0
    };
  });

  errors.forEach((err) => {
    const val = Number(err);
    if (!isNaN(val)) {
      const idx = Math.min(
        Math.max(Math.floor((val - minError) / binWidthVal), 0),
        binCount - 1
      );
      bins[idx].count += 1;
    }
  });

  const maxCount = Math.max(...bins.map((b) => b.count), 200);

  const getX = (val) =>
    paddingLeft + ((val - minError) / (maxError - minError)) * (width - paddingLeft - paddingRight);

  const getY = (count) =>
    height - paddingBottom - (count / maxCount) * (height - paddingTop - paddingBottom);

  const yTicks = [0, 50, 100, 150, 200];
  const xTicks = [-100, -75, -50, -25, 0, 25, 50];

  const zeroX = getX(0);

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e9aa24" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#dfa32b" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="barHoverGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
            <stop offset="100%" stopColor="#e9aa24" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Y Grid lines & Labels */}
        {yTicks.map((cnt) => {
          const y = getY(cnt);
          return (
            <g key={`y-${cnt}`}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="rgba(255, 255, 255, 0.06)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text
                x={paddingLeft - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#64748b"
                fontFamily="Inter, Arial, sans-serif"
              >
                {cnt}
              </text>
            </g>
          );
        })}

        {/* X Axis Labels */}
        {xTicks.map((xt) => {
          const x = getX(xt);
          return (
            <g key={`x-${xt}`}>
              <line
                x1={x}
                y1={height - paddingBottom}
                x2={x}
                y2={height - paddingBottom + 5}
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="1"
              />
              <text
                x={x}
                y={height - paddingBottom + 16}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
                fontFamily="Inter, Arial, sans-serif"
              >
                {xt > 0 ? `+${xt}` : xt}L
              </text>
            </g>
          );
        })}

        {/* Axis Titles */}
        <text
          x={(paddingLeft + width - paddingRight) / 2}
          y={height - 8}
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fill="#94a3b8"
          fontFamily="Inter, Arial, sans-serif"
        >
          Prediction Error (₹ Lakhs)
        </text>

        <text
          x={14}
          y={(paddingTop + height - paddingBottom) / 2}
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fill="#94a3b8"
          fontFamily="Inter, Arial, sans-serif"
          transform={`rotate(-90 14 ${(paddingTop + height - paddingBottom) / 2})`}
        >
          Number of Properties
        </text>

        {/* Zero Error Reference Line */}
        <line
          x1={zeroX}
          y1={paddingTop}
          x2={zeroX}
          y2={height - paddingBottom}
          stroke="#e9aa24"
          strokeWidth="1.75"
          strokeDasharray="4 3"
        />

        <text
          x={zeroX + 5}
          y={paddingTop + 12}
          fontSize="9.5"
          fontWeight="600"
          fill="#e9aa24"
          fontFamily="Inter, Arial, sans-serif"
        >
          0 (Zero Error)
        </text>

        {/* Histogram Bars */}
        {bins.map((bin, i) => {
          const barX = getX(bin.start) + 1;
          const barNextX = getX(bin.end) - 1;
          const barW = Math.max(barNextX - barX, 2);
          const barY = getY(bin.count);
          const barH = height - paddingBottom - barY;
          const isHovered = hoveredBin?.index === i;

          return (
            <rect
              key={i}
              x={barX}
              y={barY}
              width={barW}
              height={barH}
              rx="2"
              fill={isHovered ? 'url(#barHoverGrad)' : 'url(#barGrad)'}
              stroke={isHovered ? '#fff' : 'rgba(233, 170, 36, 0.4)'}
              strokeWidth={isHovered ? 1.5 : 0.5}
              style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
              onMouseEnter={() =>
                setHoveredBin({
                  index: i,
                  start: bin.start.toFixed(1),
                  end: bin.end.toFixed(1),
                  count: bin.count,
                  x: barX + barW / 2,
                  y: barY
                })
              }
              onMouseLeave={() => setHoveredBin(null)}
            />
          );
        })}

        {/* Hover Tooltip */}
        {hoveredBin && (
          <g
            transform={`translate(${
              hoveredBin.x > width - 130 ? hoveredBin.x - 125 : Math.max(hoveredBin.x - 55, 10)
            }, ${
              hoveredBin.y < 50 ? hoveredBin.y + 12 : hoveredBin.y - 45
            })`}
          >
            <rect
              width="115"
              height="38"
              rx="6"
              fill="#0f172a"
              stroke="rgba(233, 170, 36, 0.5)"
              strokeWidth="1"
              filter="drop-shadow(0 4px 10px rgba(0,0,0,0.5))"
            />
            <text x="8" y="14" fontSize="9.5" fill="#94a3b8">
              Range: {hoveredBin.start}L to {hoveredBin.end}L
            </text>
            <text x="8" y="28" fontSize="10.5" fill="#f8fafc" fontWeight="700">
              Count: <tspan fill="#e9aa24">{hoveredBin.count}</tspan> properties
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
