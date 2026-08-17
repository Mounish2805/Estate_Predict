import React, { useState } from 'react';
import Icon from './Icon';
import { formatPrice, formatDate } from '../utils/formatters';
import { valuationService } from '../services/api';

export default function ValuationReportView({ record, onBack, onExploreWhatIf }) {
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const locality = record.locality || record.Locality;
  const propertyType = record.property_type || record.Property_Type || record.propertyType;
  const area = Number(record.area_sqft || record.Area_sqft || record.area || 0);
  const bedrooms = record.bedrooms || record.Bedrooms;
  const bathrooms = record.bathrooms || record.Bathrooms;
  const furnishedVal = record.furnished || record.Furnished;
  const age = record.property_age !== undefined
    ? record.property_age
    : (record.Property_Age !== undefined ? record.Property_Age : record.age);
  const lakhs = record.predicted_price_lakhs;
  const inr = record.predicted_price_inr;
  const pricePerSqFt = area > 0 && inr ? Math.round(Number(inr) / area) : null;
  const dateStr = formatDate(record.created_at);
  const predictionId = record.id || record.prediction_id;

  const handleDownload = async () => {
    if (!predictionId || downloadBusy || emailBusy) return;
    setDownloadBusy(true);
    setActionError('');
    setEmailSuccess('');
    try {
      await valuationService.downloadPredictionPdf(predictionId);
    } catch (err) {
      setActionError(err.message || 'Failed to download prediction report.');
    } finally {
      setDownloadBusy(false);
    }
  };

  const handleSendEmail = async () => {
    if (!predictionId || downloadBusy || emailBusy) return;
    setEmailBusy(true);
    setActionError('');
    setEmailSuccess('');
    try {
      const res = await valuationService.sendPredictionEmail(predictionId);
      setEmailSuccess(res.message || 'Prediction report sent to your registered email.');
    } catch (err) {
      setActionError(err.message || 'Failed to send email. Please check your account email address.');
    } finally {
      setEmailBusy(false);
    }
  };

  return (
    <div className="saved-report-container">
      <div className="saved-report-top-bar">
        {onBack ? (
          <button type="button" className="saved-report-back-btn" onClick={onBack}>
            <Icon name="arrowLeft" size={16} />
            <span>Back to My Valuations</span>
          </button>
        ) : <div />}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {dateStr && <div className="saved-report-date-badge">Assessed on {dateStr}</div>}
          {onExploreWhatIf && (
            <button
              type="button"
              className="val-card-view-btn"
              onClick={() => onExploreWhatIf(record)}
              style={{ padding: '8px 16px', background: '#C89B5D', color: '#FFFFFF' }}
            >
              <Icon name="sliders" size={15} />
              <span>Explore What-If</span>
            </button>
          )}
        </div>
      </div>

      <div className="valuation-result-panel">
        <div className="valuation-primary-card">
          <div className="valuation-primary-header">
            <span className="valuation-badge">
              <Icon name="chart" size={14} /> ML ESTIMATED VALUATION
            </span>
            <span className="valuation-locality">{locality}, Hyderabad</span>
          </div>
          <div className="valuation-primary-body">
            <div className="valuation-label">ESTIMATED MARKET VALUE</div>
            <div className="valuation-price-large">{formatPrice(lakhs)}</div>
            <div className="valuation-raw-inr">
              ₹{Number(inr).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {predictionId && (
          <div className="valuation-export-actions">
            <button
              type="button"
              className="val-export-btn val-btn-download"
              onClick={handleDownload}
              disabled={downloadBusy || emailBusy}
              aria-label="Download Prediction PDF"
            >
              <Icon name={downloadBusy ? 'refresh' : 'download'} size={16} />
              <span>{downloadBusy ? 'Generating PDF…' : 'Download Prediction'}</span>
            </button>

            <button
              type="button"
              className="val-export-btn val-btn-email"
              onClick={handleSendEmail}
              disabled={downloadBusy || emailBusy}
              aria-label="Send Prediction to Email"
            >
              <Icon name={emailBusy ? 'refresh' : 'mail'} size={16} />
              <span>{emailBusy ? 'Sending Email…' : 'Send to Email'}</span>
            </button>
          </div>
        )}

        {emailSuccess && (
          <div className="valuation-feedback-banner success">
            <Icon name="check" size={16} />
            <span>{emailSuccess}</span>
          </div>
        )}

        {actionError && (
          <div className="valuation-feedback-banner error">
            <Icon name="shield" size={16} />
            <span>{actionError}</span>
          </div>
        )}

        <div className="valuation-details-grid">
          {pricePerSqFt && (
            <div className="valuation-detail-card">
              <div className="val-detail-label">PRICE PER SQ.FT.</div>
              <div className="val-detail-val">
                ₹{pricePerSqFt.toLocaleString('en-IN')} <small>/ sq.ft.</small>
              </div>
            </div>
          )}
          <div className="valuation-detail-card">
            <div className="val-detail-label">PROPERTY LOCALITY</div>
            <div className="val-detail-val">{locality || '—'}</div>
          </div>
          <div className="valuation-detail-card">
            <div className="val-detail-label">PROPERTY TYPE</div>
            <div className="val-detail-val">{propertyType || '—'}</div>
          </div>
          <div className="valuation-detail-card">
            <div className="val-detail-label">AREA</div>
            <div className="val-detail-val">{area.toLocaleString('en-IN')} sq.ft.</div>
          </div>
          <div className="valuation-detail-card">
            <div className="val-detail-label">CONFIGURATION</div>
            <div className="val-detail-val">{bedrooms} BHK · {bathrooms} Bath</div>
          </div>
          <div className="valuation-detail-card">
            <div className="val-detail-label">FURNISHING</div>
            <div className="val-detail-val">{furnishedVal || '—'}</div>
          </div>
          <div className="valuation-detail-card">
            <div className="val-detail-label">PROPERTY AGE</div>
            <div className="val-detail-val">{age} {Number(age) === 1 ? 'Year' : 'Years'}</div>
          </div>
        </div>

        <div className="valuation-disclaimer">
          <Icon name="shield" size={15} />
          <span>
            This is an ML-based estimate using the property characteristics and location provided. It should not be treated as an official property valuation.
          </span>
        </div>
      </div>
    </div>
  );
}
