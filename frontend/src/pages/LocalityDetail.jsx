import React, { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import LocalityPriceChart from '../components/LocalityPriceChart';
import { formatPrice } from '../utils/formatters';
import { marketService } from '../services/api';

export default function LocalityDetail({ localityName, onBack, onStartValuation, onViewReport }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLocality = async () => {
    try {
      setLoading(true);
      setError('');
      const d = await marketService.getLocalityInsights(localityName);
      setData(d);
    } catch (err) {
      setError(err.message || 'Failed to fetch locality insights.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocality();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [localityName]);

  if (loading) {
    return (
      <div className="insights-page">
        <div className="locality-detail-container">
          <div className="locality-detail-top-bar">
            <button type="button" className="locality-back-btn" onClick={onBack}>
              ← Back to Price Insights
            </button>
          </div>
          <div className="insights-loading-box">
            <p>Loading market intelligence for {localityName}…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="insights-page">
        <div className="locality-detail-container">
          <div className="locality-detail-top-bar">
            <button type="button" className="locality-back-btn" onClick={onBack}>
              ← Back to Price Insights
            </button>
          </div>
          <div className="insights-error-box">
            <h3>Unable to load locality insights</h3>
            <p>{error || 'Data unavailable for this locality.'}</p>
            <button type="button" className="insights-retry-btn" onClick={fetchLocality}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const userVal = data.user_valuation;
  const hasValuation = Boolean(userVal);

  return (
    <div className="insights-page">
      <div className="locality-detail-container">
        {/* Back Navigation */}
        <div className="locality-detail-top-bar">
          <button type="button" className="locality-back-btn" onClick={onBack}>
            ← Back to Price Insights
          </button>
          {data.source && (
            <div className="insights-source-tag">
              Source: {data.source} · {data.period}
            </div>
          )}
        </div>

        {/* Header */}
        <div className="locality-detail-header">
          <div className="insights-eyebrow">
            <Icon name="chart" size={14} />
            <span>REAL ESTATE MARKET INTELLIGENCE</span>
          </div>
          <h1 className="locality-title">{data.locality}</h1>
          <div className="locality-region">Hyderabad · {data.region || 'West Hyderabad'}</div>
        </div>

        {/* Market Snapshot - 4 Summary Cards */}
        <div className="locality-snapshot-grid">
          <div className="locality-snapshot-card">
            <div className="locality-snapshot-label">AVERAGE PRICE / SQ.FT.</div>
            <div className="locality-snapshot-value highlight-gold">
              ₹{Number(data.avg_price_sqft).toLocaleString('en-IN')}
            </div>
            <div className="locality-snapshot-sub">Current Market Reference</div>
          </div>

          <div className="locality-snapshot-card">
            <div className="locality-snapshot-label">YOY GROWTH</div>
            <div className="locality-snapshot-value">
              +{Number(data.yoy_growth).toFixed(1)}%
            </div>
            <div className="locality-snapshot-sub">Annual appreciation rate</div>
          </div>

          <div className="locality-snapshot-card">
            <div className="locality-snapshot-label">PRICE RANGE</div>
            <div className="locality-snapshot-value" style={{ fontSize: 'clamp(18px,1.8vw,22px)' }}>
              {data.min_price_sqft && data.max_price_sqft
                ? `₹${Number(data.min_price_sqft).toLocaleString('en-IN')} – ₹${Number(data.max_price_sqft).toLocaleString('en-IN')}`
                : 'Data unavailable'}
            </div>
            <div className="locality-snapshot-sub">Typical rate spread</div>
          </div>

          <div className="locality-snapshot-card">
            <div className="locality-snapshot-label">MARKET SEGMENT</div>
            <div className="locality-snapshot-value" style={{ fontSize: 'clamp(18px,1.8vw,22px)' }}>
              {data.segment || 'Residential'}
            </div>
            <div className="locality-snapshot-sub">{data.market_demand} Demand</div>
          </div>
        </div>

        {/* Historical Price Trend */}
        <div className="locality-trend-section">
          <div className="locality-section-header">
            <h2>PRICE TREND</h2>
            <p>Historical average price / sq.ft. across recent quarters</p>
          </div>
          <LocalityPriceChart historicalPrices={data.historical_prices} />
        </div>

        {/* Market Position */}
        <div className="locality-position-section">
          <div className="locality-section-header">
            <h2>MARKET POSITION</h2>
            <p>Macro position within Hyderabad residential market</p>
          </div>
          <p className="locality-position-text">
            <strong>{data.locality}</strong> is an established <strong>{data.segment.toLowerCase()}</strong> hub in {data.region || 'Hyderabad'}. Current market reference rates average <strong>₹{Number(data.avg_price_sqft).toLocaleString('en-IN')} / sq.ft.</strong>, having demonstrated a <strong>+{Number(data.yoy_growth).toFixed(1)}% YoY growth</strong> with <strong>{data.market_demand.toLowerCase()} buyer demand</strong> across recent residential transactions.
          </p>
        </div>

        {/* EstatePredict Connection */}
        <div className="locality-connection-section">
          <div className="locality-connection-header">
            <div>
              <div className="locality-connection-badge">
                <Icon name="target" size={14} />
                <span>ESTATEPREDICT CONNECTION</span>
              </div>
              <h3 style={{ fontFamily: 'Georgia,serif', fontSize: 20, color: '#183A37', margin: '4px 0 0' }}>
                {hasValuation ? `Your Latest Valuation in ${data.locality}` : `Valuation Comparison for ${data.locality}`}
              </h3>
            </div>
          </div>

          {hasValuation ? (
            <div className="locality-connection-grid">
              {/* Left Column: Property Specs & Valuation */}
              <div className="locality-prop-box">
                <div className="locality-prop-box-title">
                  {formatPrice(userVal.predicted_price_lakhs)}
                </div>
                <div className="locality-prop-box-specs">
                  {userVal.bedrooms} BHK {userVal.property_type} · {Number(userVal.area_sqft).toLocaleString('en-IN')} sq.ft. · {userVal.furnished}
                </div>

                <div className="locality-rates-row">
                  <div className="locality-rate-item">
                    <span>ESTATEPREDICT RATE</span>
                    <span>₹{Number(userVal.price_per_sqft).toLocaleString('en-IN')} / sq.ft.</span>
                  </div>
                  <div className="locality-rate-item">
                    <span>LOCALITY REFERENCE</span>
                    <span>₹{Number(data.avg_price_sqft).toLocaleString('en-IN')} / sq.ft.</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Rate Difference & View Report */}
              <div className="locality-diff-panel">
                <div>
                  <div className="locality-diff-heading">ESTIMATED RATE VS LOCALITY REFERENCE</div>
                  <div className="locality-diff-badge-row">
                    <div className={`locality-diff-pct ${userVal.diff_vs_reference_pct < 0 ? 'below' : userVal.diff_vs_reference_pct > 0 ? 'above' : 'equal'}`}>
                      {userVal.diff_vs_reference_pct > 0
                        ? `+${userVal.diff_vs_reference_pct.toFixed(1)}%`
                        : userVal.diff_vs_reference_pct < 0
                        ? `${userVal.diff_vs_reference_pct.toFixed(1)}%`
                        : '0.0%'}
                    </div>
                  </div>
                  <div className="locality-diff-explanation">
                    Your estimated rate is approximately {Math.abs(userVal.diff_vs_reference_pct).toFixed(1)}% {userVal.diff_vs_reference_pct < 0 ? 'below' : userVal.diff_vs_reference_pct > 0 ? 'above' : 'aligned with'} the current locality reference.
                  </div>
                </div>

                <button
                  type="button"
                  className="locality-view-report-btn"
                  onClick={() => onViewReport && onViewReport(userVal)}
                >
                  <span>View Report</span>
                  <Icon name="chevronRight" size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="locality-empty-conn-box">
              <div className="locality-empty-conn-text">
                <h4>No saved valuation for this locality yet.</h4>
                <p>Run a valuation on your property in {data.locality} to compare your ML estimate against market benchmarks.</p>
              </div>
              <button
                type="button"
                className="locality-start-val-btn"
                onClick={() => onStartValuation && onStartValuation(data.locality)}
              >
                <Icon name="chart" size={16} />
                <span>START VALUATION</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
