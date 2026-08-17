import React, { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import ComparisonSelector from '../components/ComparisonSelector';
import ComparisonTable from '../components/ComparisonTable';
import ComparisonSummary from '../components/ComparisonSummary';
import { valuationService } from '../services/api';

export default function CompareProperties({ onStartValuation }) {
  const [valuations, setValuations] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]); // array of up to 2 IDs
  const [isComparing, setIsComparing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchValuations = async () => {
    try {
      setLoading(true);
      setError('');
      const list = await valuationService.getValuations();
      setValuations(list);
      // Auto-select first two if available
      if (list.length >= 2) {
        setSelectedIds([list[0].id, list[1].id]);
      } else if (list.length === 1) {
        setSelectedIds([list[0].id]);
      }
    } catch (err) {
      setError(err.message || 'Unable to load saved valuations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValuations();
  }, []);

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length < 2) {
        return [...prev, id];
      }
      // Replace the second selection if 2 are already selected
      return [prev[0], id];
    });
  };

  const propA = valuations.find((v) => v.id === selectedIds[0]);
  const propB = valuations.find((v) => v.id === selectedIds[1]);

  return (
    <div className="compare-page">
      <div className="compare-container">
        {/* Header */}
        <div className="compare-header">
          <div className="compare-eyebrow">
            <Icon name="sliders" size={14} />
            <span>VALUATION COMPARISON</span>
          </div>
          <h1 className="compare-title">Compare Properties</h1>
          <p className="compare-subtitle">
            Compare your saved property valuations side by side.
          </p>
        </div>

        {error ? (
          <div className="compare-error-box">
            <h3>Unable to load valuations for comparison</h3>
            <p>{error}</p>
            <button type="button" className="compare-retry-btn" onClick={fetchValuations}>
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="compare-loading-box">
            <p>Loading your saved valuations…</p>
          </div>
        ) : valuations.length < 2 ? (
          <div className="compare-empty-state">
            <div className="compare-empty-icon">
              <Icon name="home" size={32} />
            </div>
            <h2>Save at least two property valuations to compare them.</h2>
            <p>
              Compare Properties allows you to evaluate price differences and feature sets between your saved valuations.
            </p>
            <button
              type="button"
              className="compare-empty-cta"
              onClick={onStartValuation}
            >
              <Icon name="chart" size={16} />
              <span>START VALUATION</span>
            </button>
          </div>
        ) : isComparing ? (
          <div className="compare-results-view">
            {/* Top Action Bar */}
            <div className="compare-top-actions">
              <button
                type="button"
                className="compare-change-btn"
                onClick={() => setIsComparing(false)}
              >
                <Icon name="arrowLeft" size={16} />
                <span>CHANGE PROPERTIES</span>
              </button>

              <div className="compare-active-count">
                Comparing 2 Saved Valuations
              </div>
            </div>

            {/* Comparison Side-by-Side Table */}
            <ComparisonTable propA={propA} propB={propB} />

            {/* Difference & Summary */}
            <ComparisonSummary propA={propA} propB={propB} />
          </div>
        ) : (
          <ComparisonSelector
            valuations={valuations}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onCompare={() => setIsComparing(true)}
          />
        )}
      </div>
    </div>
  );
}
