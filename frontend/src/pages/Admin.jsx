import React, { useEffect, useState } from 'react';
import Logo from '../components/Logo';
import Icon from '../components/Icon';
import ActualVsPredictedChart from '../components/ActualVsPredictedChart';
import PredictionErrorDistributionChart from '../components/PredictionErrorDistributionChart';
import { adminService } from '../services/api';

function formatDate(isoStr) {
  if (!isoStr) return '--';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '--';
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return '--';
  }
}

export default function Admin({ user, initialTab = 'overview', onNavigate, onLogout, onBackHome }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'overview' | 'model' | 'users' | 'predictions'
  const [searchQuery, setSearchQuery] = useState('');

  const [metricsState, setMetricsState] = useState({
    loading: true,
    data: null,
    error: null
  });

  const [usersState, setUsersState] = useState({
    loading: true,
    data: null,
    error: null
  });

  const [predictionsState, setPredictionsState] = useState({
    loading: true,
    data: null,
    error: null
  });

  useEffect(() => {
    // 1. Fetch model metrics
    adminService
      .getModelMetrics()
      .then((data) => {
        setMetricsState({ loading: false, data, error: null });
      })
      .catch((err) => {
        setMetricsState({
          loading: false,
          data: null,
          error: err.message || 'Metrics unavailable'
        });
      });

    // 2. Fetch users list
    adminService
      .getUsers()
      .then((data) => {
        setUsersState({ loading: false, data, error: null });
      })
      .catch((err) => {
        setUsersState({
          loading: false,
          data: null,
          error: err.message || 'Unable to load users.'
        });
      });

    // 3. Fetch prediction activity
    adminService
      .getPredictions()
      .then((data) => {
        setPredictionsState({ loading: false, data, error: null });
      })
      .catch((err) => {
        setPredictionsState({
          loading: false,
          data: null,
          error: err.message || 'Unable to load prediction activity.'
        });
      });
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    if (tab === 'model') {
      const el = document.getElementById('model-performance-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'users') {
      window.history.pushState({}, '', '/admin/users');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'predictions') {
      window.history.pushState({}, '', '/admin/predictions');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.history.pushState({}, '', '/admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const username = user?.username || 'Mounish';
  const userInitial = username.charAt(0).toUpperCase();

  const metrics = metricsState.data?.metrics;
  const evaluation = metricsState.data?.evaluation;

  // Filtered users for Users tab
  const rawUsers = usersState.data?.users || [];
  const filteredUsers = rawUsers.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const uname = (u.username || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    return uname.includes(q) || email.includes(q);
  });

  // Filtered predictions for Predictions tab
  const rawPredictions = predictionsState.data?.predictions || [];
  const filteredPredictions = rawPredictions.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const uname = (p.username || '').toLowerCase();
    const loc = (p.locality || '').toLowerCase();
    const ptype = (p.property_type || '').toLowerCase();
    return uname.includes(q) || loc.includes(q) || ptype.includes(q);
  });

  return (
    <div className="admin-dashboard-container">
      {/* 1. ADMIN HEADER / NAVIGATION */}
      <header className="admin-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <Logo nav />
          <nav className="admin-nav-links">
            <button
              type="button"
              className={`admin-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => handleTabChange('overview')}
            >
              Overview
            </button>
            <button
              type="button"
              className={`admin-nav-btn ${activeTab === 'model' ? 'active' : ''}`}
              onClick={() => handleTabChange('model')}
            >
              Model Performance
            </button>
            <button
              type="button"
              className={`admin-nav-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => handleTabChange('users')}
            >
              Users
            </button>
            <button
              type="button"
              className={`admin-nav-btn ${activeTab === 'predictions' ? 'active' : ''}`}
              onClick={() => handleTabChange('predictions')}
            >
              Predictions
            </button>
          </nav>
        </div>

        <div className="admin-nav-right">
          <div className="admin-badge-indicator">
            <Icon name="shield" size={13} />
            <span>Administrator</span>
          </div>

          <div className="admin-user-pill">
            <span className="admin-user-avatar">{userInitial}</span>
            <span>{username}</span>
          </div>

          <button
            type="button"
            className="admin-exit-btn"
            onClick={onBackHome || (() => onNavigate && onNavigate('home'))}
            title="Exit admin dashboard and return to EstatePredict client application"
          >
            Client Portal →
          </button>

          <button
            type="button"
            className="nav-logout-btn"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </header>

      {/* 2. MAIN DASHBOARD CONTENT */}
      <main className="admin-main">
        {activeTab === 'users' ? (
          /* ================================================================
             USERS TAB CONTENT
             ================================================================ */
          <div className="admin-users-view">
            {/* PAGE HEADER */}
            <section className="admin-header">
              <div>
                <span className="admin-eyebrow">Administration</span>
                <h1 className="admin-title">Registered Users</h1>
                <p className="admin-subtitle">
                  View registered accounts, status, and administrative privileges.
                </p>
              </div>
              <div className="admin-status-indicator">
                <span className="status-dot"></span>
                <span>System Operational</span>
              </div>
            </section>

            {/* SUMMARY CARDS */}
            <section className="admin-overview-grid">
              {/* Card 1: Total Users */}
              <div className="admin-stat-card">
                <div className="admin-stat-card-label">
                  <span>Total Users</span>
                  <Icon name="shield" size={16} />
                </div>
                <div className="admin-stat-card-value">
                  {usersState.loading ? '--' : usersState.data?.summary?.total_users ?? '--'}
                </div>
                <div className="admin-stat-card-sub">Registered accounts</div>
              </div>

              {/* Card 2: Active Users */}
              <div className="admin-stat-card">
                <div className="admin-stat-card-label">
                  <span>Active Users</span>
                  <span style={{ color: '#10b981', display: 'flex', alignItems: 'center' }}>
                    <span className="status-dot" style={{ marginRight: '6px' }}></span>
                  </span>
                </div>
                <div className="admin-stat-card-value" style={{ color: '#34d399' }}>
                  {usersState.loading ? '--' : usersState.data?.summary?.active_users ?? '--'}
                </div>
                <div className="admin-stat-card-sub">Active status</div>
              </div>

              {/* Card 3: Administrators */}
              <div className="admin-stat-card">
                <div className="admin-stat-card-label">
                  <span>Administrators</span>
                  <Icon name="shield" size={16} />
                </div>
                <div className="admin-stat-card-value" style={{ color: '#f2bd3f' }}>
                  {usersState.loading ? '--' : usersState.data?.summary?.administrators ?? '--'}
                </div>
                <div className="admin-stat-card-sub">Staff & Superusers</div>
              </div>
            </section>

            {/* USERS TABLE SECTION */}
            <section className="admin-section" style={{ marginTop: '28px' }}>
              <div className="admin-users-header-row">
                <div>
                  <h2 className="admin-section-title" style={{ fontSize: '18px' }}>All Users</h2>
                  <p className="admin-section-desc">
                    Complete list of user credentials and platform roles.
                  </p>
                </div>

                {/* SEARCH INPUT */}
                <div className="admin-search-wrapper">
                  <span className="admin-search-icon">🔍</span>
                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder="Search by username or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* TABLE */}
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Last Login</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersState.loading ? (
                      <tr>
                        <td colSpan={6} className="admin-empty-table-row">
                          Loading user records…
                        </td>
                      </tr>
                    ) : usersState.error ? (
                      <tr>
                        <td colSpan={6} className="admin-empty-table-row" style={{ color: '#ef4444' }}>
                          Unable to load users.
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="admin-empty-table-row">
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const initial = (u.username || 'U').charAt(0).toUpperCase();
                        const isSuperAdmin = u.role === 'Super Administrator';
                        const isAdmin = u.role === 'Administrator';

                        return (
                          <tr key={u.id}>
                            <td>
                              <div className="admin-user-cell">
                                <span className="admin-user-cell-avatar">{initial}</span>
                                <span style={{ fontWeight: 600 }}>{u.username}</span>
                              </div>
                            </td>
                            <td style={{ color: '#cbd5e1' }}>{u.email || '--'}</td>
                            <td>
                              <span
                                className={`admin-role-badge ${
                                  isSuperAdmin
                                    ? 'super-admin'
                                    : isAdmin
                                    ? 'admin'
                                    : 'user'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td>
                              <span className="admin-status-cell">
                                <span
                                  className={`admin-status-dot ${
                                    u.is_active ? 'active' : 'inactive'
                                  }`}
                                ></span>
                                <span>{u.status}</span>
                              </span>
                            </td>
                            <td style={{ color: '#94a3b8' }}>{formatDate(u.date_joined)}</td>
                            <td style={{ color: '#94a3b8' }}>{formatDate(u.last_login)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : activeTab === 'predictions' ? (
          /* ================================================================
             PREDICTIONS TAB CONTENT
             ================================================================ */
          <div className="admin-predictions-view">
            {/* PAGE HEADER */}
            <section className="admin-header">
              <div>
                <span className="admin-eyebrow">Administration</span>
                <h1 className="admin-title">Prediction Activity</h1>
                <p className="admin-subtitle">
                  System valuation logs, volume metrics, and property valuations.
                </p>
              </div>
              <div className="admin-status-indicator">
                <span className="status-dot"></span>
                <span>System Operational</span>
              </div>
            </section>

            {/* SUMMARY CARDS */}
            <section className="admin-overview-grid">
              {/* Card 1: Total Predictions */}
              <div className="admin-stat-card">
                <div className="admin-stat-card-label">
                  <span>Total Predictions</span>
                  <Icon name="chart" size={16} />
                </div>
                <div className="admin-stat-card-value">
                  {predictionsState.loading
                    ? '--'
                    : predictionsState.data?.summary?.total_predictions ?? '--'}
                </div>
                <div className="admin-stat-card-sub">Logged valuations</div>
              </div>

              {/* Card 2: Starred Valuations */}
              <div className="admin-stat-card">
                <div className="admin-stat-card-label">
                  <span>Starred Valuations</span>
                  <span style={{ color: '#f2bd3f' }}>★</span>
                </div>
                <div className="admin-stat-card-value" style={{ color: '#f2bd3f' }}>
                  {predictionsState.loading
                    ? '--'
                    : predictionsState.data?.summary?.starred_predictions ?? '--'}
                </div>
                <div className="admin-stat-card-sub">Bookmarked by users</div>
              </div>

              {/* Card 3: Predictions Today */}
              <div className="admin-stat-card">
                <div className="admin-stat-card-label">
                  <span>Predictions Today</span>
                  <Icon name="clock" size={16} />
                </div>
                <div className="admin-stat-card-value" style={{ color: '#34d399' }}>
                  {predictionsState.loading
                    ? '--'
                    : predictionsState.data?.summary?.predictions_today ?? '--'}
                </div>
                <div className="admin-stat-card-sub">Valuations in last 24h</div>
              </div>
            </section>

            {/* PREDICTIONS TABLE SECTION */}
            <section className="admin-section" style={{ marginTop: '28px' }}>
              <div className="admin-users-header-row">
                <div>
                  <h2 className="admin-section-title" style={{ fontSize: '18px' }}>Recent Predictions</h2>
                  <p className="admin-section-desc">
                    Observational stream of valuation estimates across Hyderabad localities.
                  </p>
                </div>

                {/* SEARCH INPUT */}
                <div className="admin-search-wrapper">
                  <span className="admin-search-icon">🔍</span>
                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder="Search by user, locality, or property type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* TABLE */}
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>User</th>
                      <th>Locality</th>
                      <th>Property Type</th>
                      <th>Predicted Price</th>
                      <th>Starred</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictionsState.loading ? (
                      <tr>
                        <td colSpan={7} className="admin-empty-table-row">
                          Loading prediction activity…
                        </td>
                      </tr>
                    ) : predictionsState.error ? (
                      <tr>
                        <td colSpan={7} className="admin-empty-table-row" style={{ color: '#ef4444' }}>
                          Unable to load prediction activity.
                        </td>
                      </tr>
                    ) : filteredPredictions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="admin-empty-table-row">
                          No prediction activity available.
                        </td>
                      </tr>
                    ) : (
                      filteredPredictions.map((p) => {
                        const initial = (p.username || 'U').charAt(0).toUpperCase();

                        return (
                          <tr key={p.id}>
                            <td style={{ color: '#64748b', fontFamily: 'monospace' }}>#{p.id}</td>
                            <td>
                              <div className="admin-user-cell">
                                <span className="admin-user-cell-avatar">{initial}</span>
                                <span style={{ fontWeight: 600 }}>{p.username}</span>
                              </div>
                            </td>
                            <td style={{ fontWeight: 500, color: '#f1f5f9' }}>{p.locality}</td>
                            <td style={{ color: '#cbd5e1' }}>{p.property_type}</td>
                            <td style={{ color: '#f2bd3f', fontWeight: 700 }}>
                              ₹{p.predicted_price_lakhs.toFixed(2)} Lakhs
                            </td>
                            <td>
                              {p.is_starred ? (
                                <span style={{ color: '#f2bd3f', fontSize: '15px' }} title="Bookmarked">
                                  ★
                                </span>
                              ) : (
                                <span style={{ color: '#475569' }}>—</span>
                              )}
                            </td>
                            <td style={{ color: '#94a3b8' }}>{formatDate(p.created_at)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : (
          /* ================================================================
             OVERVIEW & MODEL PERFORMANCE TABS
             ================================================================ */
          <div>
            {/* PAGE HEADER */}
            <section className="admin-header">
              <div>
                <span className="admin-eyebrow">Administration</span>
                <h1 className="admin-title">EstatePredict Admin Dashboard</h1>
                <p className="admin-subtitle">
                  Monitor the platform and keep track of model performance.
                </p>
              </div>
              <div className="admin-status-indicator">
                <span className="status-dot"></span>
                <span>System Operational</span>
              </div>
            </section>

            {/* 3. OVERVIEW STATISTIC CARDS */}
            <section className="admin-overview-grid">
              {/* Card 1: Total Users */}
              <div className="admin-stat-card">
                <div className="admin-stat-card-label">
                  <span>Total Users</span>
                  <Icon name="shield" size={16} />
                </div>
                <div className="admin-stat-card-value">
                  {usersState.loading ? '--' : usersState.data?.summary?.total_users ?? '--'}
                </div>
                <div className="admin-stat-card-sub">Registered accounts</div>
              </div>

              {/* Card 2: Total Predictions */}
              <div className="admin-stat-card">
                <div className="admin-stat-card-label">
                  <span>Total Predictions</span>
                  <Icon name="chart" size={16} />
                </div>
                <div className="admin-stat-card-value">
                  {predictionsState.loading
                    ? '--'
                    : predictionsState.data?.summary?.total_predictions ?? '--'}
                </div>
                <div className="admin-stat-card-sub">Logged valuations</div>
              </div>

              {/* Card 3: Model Status */}
              <div className="admin-stat-card">
                <div className="admin-stat-card-label">
                  <span>Model Status</span>
                  <span style={{ color: '#10b981', display: 'flex', alignItems: 'center' }}>
                    <span className="status-dot" style={{ marginRight: '6px' }}></span>
                  </span>
                </div>
                <div className="admin-stat-card-value" style={{ color: '#34d399', fontSize: '24px' }}>
                  Active
                </div>
                <div className="admin-stat-card-sub">Inference pipeline ready</div>
              </div>

              {/* Card 4: Model Version */}
              <div className="admin-stat-card">
                <div className="admin-stat-card-label">
                  <span>Model Version</span>
                  <Icon name="sliders" size={16} />
                </div>
                <div className="admin-stat-card-value" style={{ fontSize: '24px' }}>
                  Current
                </div>
                <div className="admin-stat-card-sub">hyderabad_house_prices</div>
              </div>
            </section>

            {/* 4. MODEL PERFORMANCE SECTION */}
            <section id="model-performance-section" className="admin-section">
              <div className="admin-section-header">
                <div>
                  <h2 className="admin-section-title">Model Performance</h2>
                  <p className="admin-section-desc">
                    Monitor the performance of the house price prediction model.
                  </p>
                </div>
              </div>

              {/* Notice Callout */}
              {metricsState.loading ? (
                <div className="admin-placeholder-notice">
                  <span className="notice-icon">ℹ</span>
                  <span>Loading real model evaluation metrics…</span>
                </div>
              ) : metricsState.error ? (
                <div
                  className="admin-placeholder-notice"
                  style={{
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    background: 'rgba(239, 68, 68, 0.05)'
                  }}
                >
                  <span className="notice-icon" style={{ color: '#ef4444' }}>⚠</span>
                  <span>{metricsState.error}</span>
                </div>
              ) : (
                <div
                  className="admin-placeholder-notice"
                  style={{
                    borderColor: 'rgba(16, 185, 129, 0.3)',
                    background: 'rgba(16, 185, 129, 0.05)'
                  }}
                >
                  <span className="notice-icon" style={{ color: '#10b981' }}>✓</span>
                  <span>
                    Evaluated on {metricsState.data?.evaluated_samples || 600} held-out test properties ({metricsState.data?.evaluation_method || 'Holdout Test Split'})
                  </span>
                </div>
              )}

              {/* Metric Cards Grid */}
              <div className="admin-metrics-grid">
                {/* 1. R² Score */}
                <div className="admin-metric-card">
                  <div className="admin-metric-title">
                    <span>R² Score</span>
                    <span style={{ color: '#94a3b8', fontSize: '11px' }}>Goodness of Fit</span>
                  </div>
                  <div
                    className="admin-metric-placeholder"
                    style={{
                      color: metricsState.error ? '#ef4444' : metrics ? '#f8fafc' : '#64748b',
                      fontSize: metricsState.error ? '14px' : '24px'
                    }}
                  >
                    {metricsState.loading
                      ? '--'
                      : metricsState.error
                      ? 'Metrics unavailable'
                      : metrics?.r2 !== undefined
                      ? metrics.r2
                      : '--'}
                  </div>
                  <div className="admin-metric-desc">Target: &gt; 0.85</div>
                </div>

                {/* 2. MAE */}
                <div className="admin-metric-card">
                  <div className="admin-metric-title">
                    <span>MAE</span>
                    <span style={{ color: '#94a3b8', fontSize: '11px' }}>Mean Absolute Error</span>
                  </div>
                  <div
                    className="admin-metric-placeholder"
                    style={{
                      color: metricsState.error ? '#ef4444' : metrics ? '#f8fafc' : '#64748b',
                      fontSize: metricsState.error ? '14px' : '24px'
                    }}
                  >
                    {metricsState.loading
                      ? '--'
                      : metricsState.error
                      ? 'Metrics unavailable'
                      : metrics?.mae !== undefined
                      ? `₹${metrics.mae} Lakhs`
                      : '--'}
                  </div>
                  <div className="admin-metric-desc">In ₹ Lakhs</div>
                </div>

                {/* 3. RMSE */}
                <div className="admin-metric-card">
                  <div className="admin-metric-title">
                    <span>RMSE</span>
                    <span style={{ color: '#94a3b8', fontSize: '11px' }}>Root Mean Squared</span>
                  </div>
                  <div
                    className="admin-metric-placeholder"
                    style={{
                      color: metricsState.error ? '#ef4444' : metrics ? '#f8fafc' : '#64748b',
                      fontSize: metricsState.error ? '14px' : '24px'
                    }}
                  >
                    {metricsState.loading
                      ? '--'
                      : metricsState.error
                      ? 'Metrics unavailable'
                      : metrics?.rmse !== undefined
                      ? `₹${metrics.rmse} Lakhs`
                      : '--'}
                  </div>
                  <div className="admin-metric-desc">Error standard deviation</div>
                </div>

                {/* 4. MAPE */}
                <div className="admin-metric-card">
                  <div className="admin-metric-title">
                    <span>MAPE</span>
                    <span style={{ color: '#94a3b8', fontSize: '11px' }}>Percentage Error</span>
                  </div>
                  <div
                    className="admin-metric-placeholder"
                    style={{
                      color: metricsState.error ? '#ef4444' : metrics ? '#f8fafc' : '#64748b',
                      fontSize: metricsState.error ? '14px' : '24px'
                    }}
                  >
                    {metricsState.loading
                      ? '--'
                      : metricsState.error
                      ? 'Metrics unavailable'
                      : metrics?.mape_percentage || (metrics?.mape !== undefined ? `${(metrics.mape * 100).toFixed(2)}%` : '--')}
                  </div>
                  <div className="admin-metric-desc">Mean percentage variance</div>
                </div>
              </div>

              {/* Evaluation Details Area */}
              <div className="admin-eval-details-card">
                <div className="admin-eval-details-header">
                  <span className="admin-eval-details-title">Evaluation Details</span>
                  <span className="admin-eval-details-tag">Model & Validation Pipeline Metadata</span>
                </div>
                <div className="admin-eval-details-grid">
                  <div className="admin-eval-item">
                    <span className="admin-eval-label">Evaluation Samples</span>
                    <span className="admin-eval-val">
                      {metricsState.loading || metricsState.error ? '--' : metricsState.data?.evaluated_samples ?? '--'}
                    </span>
                  </div>
                  <div className="admin-eval-item">
                    <span className="admin-eval-label">Evaluation Method</span>
                    <span className="admin-eval-val">
                      {metricsState.loading || metricsState.error ? '--' : metricsState.data?.evaluation_method ?? '--'}
                    </span>
                  </div>
                  <div className="admin-eval-item">
                    <span className="admin-eval-label">Features</span>
                    <span className="admin-eval-val">
                      {metricsState.loading || metricsState.error ? '--' : metricsState.data?.feature_count ?? '--'}
                    </span>
                  </div>
                  <div className="admin-eval-item">
                    <span className="admin-eval-label">Target Variable</span>
                    <span className="admin-eval-val">
                      {metricsState.loading || metricsState.error ? '--' : metricsState.data?.target_variable ?? '--'}
                    </span>
                  </div>
                  <div className="admin-eval-item">
                    <span className="admin-eval-label">Model Type</span>
                    <span className="admin-eval-val">
                      {metricsState.loading || metricsState.error ? '--' : metricsState.data?.model_type ?? '--'}
                    </span>
                  </div>
                  <div className="admin-eval-item">
                    <span className="admin-eval-label">Model File</span>
                    <span className="admin-eval-val" style={{ fontFamily: 'monospace' }}>
                      {metricsState.loading || metricsState.error ? '--' : metricsState.data?.model_file ?? '--'}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. REAL MODEL EVALUATION CHARTS */}
            <section className="admin-charts-grid">
              {/* Chart 1: Actual vs Predicted */}
              <div className="admin-chart-panel">
                <div>
                  <h3 className="admin-section-title" style={{ fontSize: '16px' }}>
                    Actual vs Predicted
                  </h3>
                  <p className="admin-section-desc">
                    Regression scatter plot across {evaluation?.actual?.length || 600} held-out test valuations
                  </p>
                </div>

                {metricsState.loading ? (
                  <div className="admin-chart-placeholder-box">
                    <div className="chart-placeholder-icon">
                      <Icon name="chart" size={32} />
                    </div>
                    <p className="chart-placeholder-text">Loading evaluation data…</p>
                  </div>
                ) : metricsState.error ? (
                  <div className="admin-chart-placeholder-box">
                    <p className="chart-placeholder-text" style={{ color: '#ef4444' }}>
                      Evaluation data unavailable
                    </p>
                  </div>
                ) : (
                  <ActualVsPredictedChart
                    actual={evaluation?.actual}
                    predicted={evaluation?.predicted}
                  />
                )}
              </div>

              {/* Chart 2: Prediction Error Distribution */}
              <div className="admin-chart-panel">
                <div>
                  <h3 className="admin-section-title" style={{ fontSize: '16px' }}>
                    Prediction Error Distribution
                  </h3>
                  <p className="admin-section-desc">
                    Residual error histogram (predicted − actual) across {evaluation?.errors?.length || 600} test properties
                  </p>
                </div>

                {metricsState.loading ? (
                  <div className="admin-chart-placeholder-box">
                    <div className="chart-placeholder-icon">
                      <Icon name="target" size={32} />
                    </div>
                    <p className="chart-placeholder-text">Loading evaluation data…</p>
                  </div>
                ) : metricsState.error ? (
                  <div className="admin-chart-placeholder-box">
                    <p className="chart-placeholder-text" style={{ color: '#ef4444' }}>
                      Evaluation data unavailable
                    </p>
                  </div>
                ) : (
                  <PredictionErrorDistributionChart
                    errors={evaluation?.errors}
                  />
                )}
              </div>
            </section>

            {/* 6. RECENT ACTIVITY SECTION */}
            <section className="admin-activity-panel">
              <div>
                <h2 className="admin-section-title">Recent Activity</h2>
                <p className="admin-section-desc">
                  Audit trail of system events, predictions, and administrator actions.
                </p>
              </div>

              <div className="admin-empty-state">
                <Icon name="clock" size={24} />
                <p className="empty-state-text">No recent activity available.</p>
                <p className="empty-state-sub">
                  Live platform events will automatically populate as valuations are requested.
                </p>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
