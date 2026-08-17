import React, { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import LocalityCard from '../components/LocalityCard';
import LocalityExplorerDetail from './LocalityExplorerDetail';
import { localityService } from '../services/api';

export default function ExploreLocalities({ onPredictProperty }) {
  const [localities, setLocalities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLocality, setSelectedLocality] = useState(null);

  const fetchList = async () => {
    try {
      setLoading(true);
      setError('');
      const list = await localityService.getLocalities();
      setLocalities(list);
    } catch (err) {
      setError(err.message || 'Unable to load localities directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  if (selectedLocality) {
    return (
      <LocalityExplorerDetail
        localityName={selectedLocality}
        onBack={() => setSelectedLocality(null)}
        onPredictProperty={onPredictProperty}
      />
    );
  }

  return (
    <div className="explorer-page">
      <div className="explorer-container">
        {/* Header */}
        <div className="explorer-header">
          <div className="explorer-eyebrow">
            <Icon name="home" size={14} />
            <span>EXPLORE HYDERABAD LOCALITIES</span>
          </div>
          <h1 className="explorer-title">Hyderabad Localities</h1>
          <p className="explorer-subtitle">
            Explore key residential localities and understand their connectivity, nearby essentials, major hubs, and property context.
          </p>
        </div>

        {error ? (
          <div className="explorer-error-box">
            <h3>Unable to load localities directory</h3>
            <p>{error}</p>
            <button type="button" className="explorer-retry-btn" onClick={fetchList}>
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="explorer-loading-box">
            <p>Loading Hyderabad Localities…</p>
          </div>
        ) : localities.length === 0 ? (
          <div className="explorer-loading-box">
            <p>No localities available.</p>
          </div>
        ) : (
          <div className="locality-cards-grid">
            {localities.map((loc) => (
              <LocalityCard
                key={loc.name}
                locality={loc}
                onSelect={(name) => setSelectedLocality(name)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
