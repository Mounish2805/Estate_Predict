import React, { useState } from 'react';

export default function ActualVsPredictedChart({ actual = [], predicted = [] }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!actual.length || !predicted.length || actual.length !== predicted.length) {
    return (
      <div className="admin-chart-placeholder-box">
        <p className="chart-placeholder-text">Evaluation data unavailable.</p>
      </div>
    );
  }

  const width = 540;
  const height = 320;
  const paddingLeft = 50;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 45;

  const maxVal = 320; // Maximum price in Lakhs across dataset
  const minVal = 0;

  const getX = (val) =>
    paddingLeft + ((val - minVal) / (maxVal - minVal)) * (width - paddingLeft - paddingRight);

  const getY = (val) =>
    height - paddingBottom - ((val - minVal) / (maxVal - minVal)) * (height - paddingTop - paddingBottom);

  const ticks = [0, 50, 100, 150, 200, 250, 300];

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <defs>
          <radialGradient id="pointGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f2bd3f" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#e9aa24" stopOpacity="0.3" />
          </radialGradient>
        </defs>

        {/* Grid lines & Y Axis Ticks */}
        {ticks.map((t) => {
          const y = getY(t);
          return (
            <g key={`y-${t}`}>
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
                ₹{t}L
              </text>
            </g>
          );
        })}

        {/* X Axis Ticks */}
        {ticks.map((t) => {
          const x = getX(t);
          return (
            <g key={`x-${t}`}>
              <line
                x1={x}
                y1={paddingTop}
                x2={x}
                y2={height - paddingBottom}
                stroke="rgba(255, 255, 255, 0.06)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text
                x={x}
                y={height - paddingBottom + 16}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
                fontFamily="Inter, Arial, sans-serif"
              >
                ₹{t}L
              </text>
            </g>
          );
        })}

        {/* Axis Labels */}
        <text
          x={(paddingLeft + width - paddingRight) / 2}
          y={height - 8}
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fill="#94a3b8"
          fontFamily="Inter, Arial, sans-serif"
        >
          Actual Price (₹ Lakhs)
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
          Predicted Price (₹ Lakhs)
        </text>

        {/* y = x Perfect Reference Line */}
        <line
          x1={getX(0)}
          y1={getY(0)}
          x2={getX(300)}
          y2={getY(300)}
          stroke="#e9aa24"
          strokeWidth="1.75"
          strokeDasharray="5 4"
          strokeOpacity="0.8"
        />

        {/* Reference Line Label */}
        <text
          x={getX(235)}
          y={getY(250)}
          fontSize="10"
          fontWeight="600"
          fill="#e9aa24"
          fontFamily="Inter, Arial, sans-serif"
        >
          y = x (Ideal)
        </text>

        {/* Scatter Points (600 properties) */}
        {actual.map((act, i) => {
          const pred = predicted[i];
          const cx = getX(act);
          const cy = getY(pred);
          const isHovered = hoveredPoint?.index === i;

          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={isHovered ? 5.5 : 2.75}
              fill={isHovered ? '#fff' : 'rgba(233, 170, 36, 0.6)'}
              stroke={isHovered ? '#e9aa24' : 'rgba(10, 10, 10, 0.6)'}
              strokeWidth={isHovered ? 2 : 0.6}
              style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
              onMouseEnter={() =>
                setHoveredPoint({
                  index: i,
                  actual: act,
                  predicted: pred,
                  error: (pred - act).toFixed(2),
                  x: cx,
                  y: cy
                })
              }
              onMouseLeave={() => setHoveredPoint(null)}
            />
          );
        })}

        {/* Hover Tooltip inside SVG */}
        {hoveredPoint && (
          <g
            transform={`translate(${
              hoveredPoint.x > width - 140 ? hoveredPoint.x - 130 : hoveredPoint.x + 10
            }, ${
              hoveredPoint.y < 60 ? hoveredPoint.y + 10 : hoveredPoint.y - 50
            })`}
          >
            <rect
              width="120"
              height="46"
              rx="6"
              fill="#0f172a"
              stroke="rgba(233, 170, 36, 0.5)"
              strokeWidth="1"
              filter="drop-shadow(0 4px 10px rgba(0,0,0,0.5))"
            />
            <text x="8" y="15" fontSize="10" fill="#cbd5e1" fontWeight="600">
              Actual: <tspan fill="#f8fafc">₹{hoveredPoint.actual}L</tspan>
            </text>
            <text x="8" y="28" fontSize="10" fill="#cbd5e1" fontWeight="600">
              Pred: <tspan fill="#e9aa24">₹{hoveredPoint.predicted}L</tspan>
            </text>
            <text x="8" y="40" fontSize="9.5" fill="#94a3b8">
              Residual: {hoveredPoint.error > 0 ? `+₹${hoveredPoint.error}L` : `-₹${Math.abs(hoveredPoint.error)}L`}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
