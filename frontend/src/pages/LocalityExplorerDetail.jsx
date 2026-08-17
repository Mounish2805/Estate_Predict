import React, { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import ConnectivitySection from '../components/ConnectivitySection';
import NearbyEssentials from '../components/NearbyEssentials';
import MajorHubs from '../components/MajorHubs';
import PropertyContext from '../components/PropertyContext';
import { localityService } from '../services/api';

export default function LocalityExplorerDetail({ localityName, onBack, onPredictProperty }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const d = await localityService.getLocalityDetail(localityName);
      setData(d);
    } catch (err) {
      setError(err.message || 'Failed to fetch locality details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [localityName]);

  if (loading) {
    return (
      <div className="explorer-page">
        <div className="explorer-container">
          <div className="explorer-top-bar">
            <button type="button" className="explorer-back-btn" onClick={onBack}>
              <Icon name="arrowLeft" size={16} />
              <span>Back to Localities</span>
            </button>
          </div>
          <div className="explorer-loading-box">
            <p>Loading overview for {localityName}…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="explorer-page">
        <div className="explorer-container">
          <div className="explorer-top-bar">
            <button type="button" className="explorer-back-btn" onClick={onBack}>
              <Icon name="arrowLeft" size={16} />
              <span>Back to Localities</span>
            </button>
          </div>
          <div className="explorer-error-box">
            <h3>Unable to load locality details</h3>
            <p>{error || 'Data unavailable for this locality.'}</p>
            <button type="button" className="explorer-retry-btn" onClick={fetchDetail}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="explorer-page">
      <div className="explorer-container">
        {/* Back Navigation */}
        <div className="explorer-top-bar">
          <button type="button" className="explorer-back-btn" onClick={onBack}>
            <Icon name="arrowLeft" size={16} />
            <span>Back to Localities</span>
          </button>
          {data.source && (
            <div className="explorer-source-tag">
              Source: {data.source} · {data.period}
            </div>
          )}
        </div>

        {/* Locality Header */}
        <div className="explorer-header">
          <div className="explorer-eyebrow">
            <Icon name="home" size={14} />
            <span>EXPLORE HYDERABAD LOCALITIES</span>
          </div>
          <h1 className="explorer-title">{data.name}</h1>
          <div className="explorer-region">
            {data.region} · {data.segment}
          </div>
        </div>

        {/* Content Flow */}
        <div className="explorer-content-flow">
          {/* About the Locality */}
          <div className="explorer-section-card">
            <div className="explorer-section-header">
              <Icon name="shield" size={16} />
              <h3>ABOUT THE LOCALITY</h3>
            </div>
            <p className="explorer-about-text">{data.description}</p>
          </div>

          {/* Connectivity */}
          <ConnectivitySection connectivity={data.connectivity} />

          {/* Nearby Essentials: Hospitals & Schools */}
          <NearbyEssentials hospitals={data.hospitals} schools={data.schools} />

          {/* Major Hubs */}
          <MajorHubs hubs={data.major_hubs} />

          {/* Property Context */}
          <PropertyContext propertyContext={data.property_context} />

          {/* Ready to Value Action Card */}
          <div className="explorer-cta-card">
            <div className="explorer-cta-inner">
              <div className="explorer-cta-text">
                <span className="explorer-cta-badge">ESTATEPREDICT VALUATION</span>
                <h2>READY TO VALUE A PROPERTY IN {data.name.toUpperCase()}?</h2>
                <p>
                  Get an instant, data-backed ML valuation for your property using accurate square footage, configuration, and amenities.
                </p>
              </div>
              <button
                type="button"
                className="explorer-cta-btn"
                onClick={() => onPredictProperty && onPredictProperty(data.name)}
              >
                <Icon name="chart" size={18} />
                <span>PREDICT A PROPERTY</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
