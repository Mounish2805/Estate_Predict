import React, { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import LocalityDetail from './LocalityDetail';
import { marketService } from '../services/api';

export default function PriceInsights({ onStartValuation, onViewReport }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLocality, setSelectedLocality] = useState(null);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError('');
      const d = await marketService.getPriceInsights();
      setData(d);
    } catch (err) {
      setError(err.message || 'Unable to load market insights.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (selectedLocality) {
    return (
      <LocalityDetail
        localityName={selectedLocality}
        onBack={() => setSelectedLocality(null)}
        onStartValuation={onStartValuation}
        onViewReport={onViewReport}
      />
    );
  }

  const overview = data?.overview || (data?.city ? {
    city_average_appreciation: `+${data.yoy_appreciation_pct || 14.2}% YoY`,
    city_average_appreciation_sub: `${data.city || 'Hyderabad'} residential market`,
    most_in_demand_locality: data.top_performing_zones?.[0]?.locality || 'Kokapet',
    most_in_demand_yoy: data.top_performing_zones?.[0]?.growth ? `+${data.top_performing_zones[0].growth}` : '+18.5% YoY',
    prime_micro_market: 'Jubilee Hills',
    prime_micro_market_price: '₹15,800 / sq.ft.',
  } : null);

  const localitiesList = data?.localities?.length
    ? data.localities
    : (data?.top_performing_zones?.length
      ? data.top_performing_zones.map((z, idx) => ({
          id: idx + 1,
          locality: z.locality,
          avg_price_sqft: parseInt((z.avg_price || '9000').replace(/[^0-9]/g, ''), 10) || 9000,
          yoy_growth: parseFloat((z.growth || '12').replace(/[^0-9.]/g, '')) || 12.0,
          market_demand: 'High',
          segment: 'IT Corridor'
        }))
      : []);

  return (
    <div className="insights-page">
      <div className="insights-container">
        {/* Header */}
        <div className="insights-header">
          <div className="insights-eyebrow">
            <Icon name="chart" size={14} />
            <span>REAL ESTATE MARKET INTELLIGENCE</span>
          </div>
          <h1 className="insights-title">Hyderabad Property Price Insights</h1>
          <p className="insights-subtitle">
            Historical property-price trends across Hyderabad micro-markets.
          </p>
        </div>

        {error ? (
          <div className="insights-error-box">
            <h3>Unable to load market insights</h3>
            <p>{error}</p>
            <button type="button" className="insights-retry-btn" onClick={fetchInsights}>
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="insights-loading-box">
            <p>Loading Hyderabad Market Intelligence…</p>
          </div>
        ) : (
          <>
            {/* 3 Summary Cards */}
            {overview && (
              <div className="insights-summary-grid">
                <div className="insights-summary-card">
                  <div className="insights-card-label">CITY AVERAGE APPRECIATION</div>
                  <div className="insights-card-value highlight-gold">
                    {overview.city_average_appreciation}
                  </div>
                  <div className="insights-card-sub">{overview.city_average_appreciation_sub}</div>
                </div>

                <div className="insights-summary-card">
                  <div className="insights-card-label">MOST IN-DEMAND LOCALITY</div>
                  <div className="insights-card-value">
                    {overview.most_in_demand_locality}
                  </div>
                  <div className="insights-card-sub">{overview.most_in_demand_yoy}</div>
                </div>

                <div className="insights-summary-card">
                  <div className="insights-card-label">PRIME MICRO-MARKET</div>
                  <div className="insights-card-value">
                    {overview.prime_micro_market}
                  </div>
                  <div className="insights-card-sub">{overview.prime_micro_market_price}</div>
                </div>
              </div>
            )}

            {/* Locality Price Insights Table */}
            <div className="insights-table-section">
              <div className="insights-table-header-row">
                <div className="insights-table-title-area">
                  <h2>Hyderabad Locality Price Insights</h2>
                  <p>Average rates & demand dynamics across Hyderabad residential hubs · Click a locality to view detailed trend</p>
                </div>
                {data?.source && (
                  <div className="insights-source-tag">
                    Source: {data.source} · {data.period}
                  </div>
                )}
              </div>

              {localitiesList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#737873' }}>
                  No market insights available.
                </div>
              ) : (
                <div className="insights-table-wrapper">
                  <table className="insights-table">
                    <thead>
                      <tr>
                        <th>LOCALITY</th>
                        <th>AVG PRICE / SQ.FT.</th>
                        <th>YOY GROWTH</th>
                        <th>MARKET DEMAND</th>
                        <th>SEGMENT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {localitiesList.map((item) => {
                        const demandKey = (item.market_demand || '').toLowerCase().replace(/\s+/g, '-');
                        return (
                          <tr
                            key={item.id || item.locality}
                            className="clickable-row"
                            onClick={() => setSelectedLocality(item.locality)}
                            title={`View ${item.locality} market insights`}
                          >
                            <td className="insights-col-locality">
                              <span>{item.locality}</span>
                              <span className="insights-row-arrow">→</span>
                            </td>
                            <td className="insights-col-price">
                              ₹{Number(item.avg_price_sqft).toLocaleString('en-IN')}
                            </td>
                            <td>
                              <span className="insights-growth-badge">
                                +{Number(item.yoy_growth).toFixed(1)}%
                              </span>
                            </td>
                            <td>
                              <span className={`insights-demand-pill ${demandKey}`}>
                                {item.market_demand}
                              </span>
                            </td>
                            <td>
                              <span className="insights-segment-label">{item.segment}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="insights-footer-note">
                <Icon name="shield" size={14} />
                <span>
                  Market intelligence data reflects macro residential averages and does not alter property-specific ML predictive valuations.
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
