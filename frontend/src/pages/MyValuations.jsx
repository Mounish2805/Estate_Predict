import React, { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import ValuationReportView from '../components/ValuationReportView';
import WhatIfValuation from './WhatIfValuation';
import { formatPrice, formatDate } from '../utils/formatters';
import { valuationService } from '../services/api';

export default function MyValuations({ onStartValuation }) {
  const [valuations, setValuations] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'starred'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [whatIfTarget, setWhatIfTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);

  const fetchValuations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await valuationService.getValuations();
      setValuations(data);
    } catch (err) {
      setError(err.message || 'Unable to load valuation history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValuations();
  }, []);

  const handleToggleStar = async (item, e) => {
    e.stopPropagation();
    const nextState = !item.is_starred;
    // Optimistic UI update
    setValuations((prev) =>
      prev.map((v) => (v.id === item.id ? { ...v, is_starred: nextState } : v))
    );
    if (selectedReport && selectedReport.id === item.id) {
      setSelectedReport((prev) => ({ ...prev, is_starred: nextState }));
    }

    try {
      await valuationService.toggleStar(item.id, nextState);
    } catch (err) {
      // Revert on error
      setValuations((prev) =>
        prev.map((v) => (v.id === item.id ? { ...v, is_starred: item.is_starred } : v))
      );
      if (selectedReport && selectedReport.id === item.id) {
        setSelectedReport((prev) => ({ ...prev, is_starred: item.is_starred }));
      }
    }
  };

  const handleDeleteValuation = async () => {
    if (!deleteTarget) return;
    setActionBusy(true);
    try {
      await valuationService.deleteValuation(deleteTarget.id);
      setValuations((prev) => prev.filter((v) => v.id !== deleteTarget.id));
      if (selectedReport && selectedReport.id === deleteTarget.id) {
        setSelectedReport(null);
      }
      if (whatIfTarget && whatIfTarget.id === deleteTarget.id) {
        setWhatIfTarget(null);
      }
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || 'Failed to delete valuation.');
    } finally {
      setActionBusy(false);
    }
  };

  const starredCount = valuations.filter((v) => v.is_starred).length;
  const filteredList =
    filter === 'starred'
      ? valuations.filter((v) => v.is_starred)
      : valuations;

  if (whatIfTarget) {
    return (
      <WhatIfValuation
        record={whatIfTarget}
        onBack={() => setWhatIfTarget(null)}
      />
    );
  }

  if (selectedReport) {
    return (
      <div className="valuations-page">
        <div className="valuations-container">
          <ValuationReportView
            record={selectedReport}
            onBack={() => setSelectedReport(null)}
            onExploreWhatIf={(rec) => setWhatIfTarget(rec)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="valuations-page">
      <div className="valuations-container">
        <div className="valuations-header">
          <div className="valuations-header-top">
            <div className="valuations-title-area">
              <h1>My Valuations</h1>
              <p className="valuations-subtitle">Your property assessments</p>
            </div>

            <div className="val-tabs" role="tablist">
              <button
                type="button"
                className={`val-tab ${filter === 'starred' ? 'active' : ''}`}
                onClick={() => setFilter('starred')}
                role="tab"
                aria-selected={filter === 'starred'}
              >
                <span>⭐ Starred</span>
                {starredCount > 0 && <span className="val-tab-badge">{starredCount}</span>}
              </button>
              <button
                type="button"
                className={`val-tab ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
                role="tab"
                aria-selected={filter === 'all'}
              >
                <span>All Valuations</span>
                <span className="val-tab-badge">{valuations.length}</span>
              </button>
            </div>
          </div>
        </div>

        {error && <div className="form-error" style={{ marginBottom: 20 }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#737873' }}>
            Loading your valuations…
          </div>
        ) : filteredList.length === 0 ? (
          filter === 'starred' ? (
            <div className="val-empty-state">
              <div className="val-empty-icon">
                <Icon name="star" size={30} />
              </div>
              <div className="val-empty-title">No starred valuations yet.</div>
              <div className="val-empty-desc">
                Star a valuation to keep it here for quick access.
              </div>
              <button
                type="button"
                className="val-empty-cta"
                onClick={() => setFilter('all')}
              >
                <span>VIEW ALL VALUATIONS</span>
              </button>
            </div>
          ) : (
            <div className="val-empty-state">
              <div className="val-empty-icon">
                <Icon name="home" size={30} />
              </div>
              <div className="val-empty-title">No valuations yet.</div>
              <div className="val-empty-desc">
                Start your first property valuation to see it here.
              </div>
              <button
                type="button"
                className="val-empty-cta"
                onClick={onStartValuation}
              >
                <span>START VALUATION</span>
              </button>
            </div>
          )
        ) : (
          <div className="val-cards-grid">
            {filteredList.map((v) => {
              const area = Number(v.area_sqft || 0);
              const priceSqFt =
                area > 0 && v.predicted_price_inr
                  ? Math.round(Number(v.predicted_price_inr) / area)
                  : null;
              const dateStr = formatDate(v.created_at);

              return (
                <div className="val-card" key={v.id}>
                  <div>
                    <div className="val-card-top">
                      <button
                        type="button"
                        className={`val-star-btn ${v.is_starred ? 'starred' : ''}`}
                        onClick={(e) => handleToggleStar(v, e)}
                        aria-label={v.is_starred ? 'Unstar valuation' : 'Star valuation'}
                      >
                        <Icon name="star" size={20} />
                      </button>

                      <div className="val-card-heading">
                        <div className="val-card-title">{v.locality} · {v.bedrooms} BHK</div>
                        <div className="val-card-subtitle">
                          {area.toLocaleString('en-IN')} sq.ft. · {v.furnished}
                        </div>
                      </div>
                    </div>

                    <div className="val-card-price-row">
                      <div className="val-card-price-block">
                        <div className="val-card-price-label">Estimated Value</div>
                        <div className="val-card-price-val">{formatPrice(v.predicted_price_lakhs)}</div>
                      </div>
                      {priceSqFt && (
                        <div className="val-card-sqft-val">
                          ₹{priceSqFt.toLocaleString('en-IN')}
                          <small>/ sq.ft.</small>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="val-card-footer">
                    <div className="val-card-date">{dateStr}</div>
                    <div className="val-card-actions">
                      <button
                        type="button"
                        className="val-card-delete-btn"
                        onClick={() => setDeleteTarget(v)}
                        aria-label="Delete valuation"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        className="val-card-view-btn"
                        onClick={() => setSelectedReport(v)}
                      >
                        <span>View Report</span>
                        <Icon name="chevronRight" size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {deleteTarget && (
        <div
          className="val-delete-modal-overlay"
          onClick={() => !actionBusy && setDeleteTarget(null)}
        >
          <div className="val-delete-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Valuation?</h3>
            <p>
              Are you sure you want to remove this valuation for <strong>{deleteTarget.locality}</strong>? This action cannot be undone.
            </p>
            <div className="val-delete-modal-actions">
              <button
                type="button"
                className="val-modal-cancel"
                disabled={actionBusy}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="val-modal-delete"
                disabled={actionBusy}
                onClick={handleDeleteValuation}
              >
                {actionBusy ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
