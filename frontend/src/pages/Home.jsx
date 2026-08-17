import React from 'react';
import Icon from '../components/Icon';

export default function Home({ onStartValuation }) {
  return (
    <>
      <section className="cinema-hero">
        <div className="cinema-hero-bg"></div>
        <div className="cinema-hero-overlay"></div>
        <div className="cinema-hero-content">
          <div className="cinema-badge">
            <Icon name="shield" size={15} />
            <span>Hyderabad Property Valuation</span>
          </div>
          <h1 className="cinema-title">
            Find Better Homes<br />
            in <span>Hyderabad</span>
          </h1>
          <p className="cinema-desc">
            Get a data-backed estimate for your Hyderabad property using its location, size, features and amenities.
          </p>
          <div className="cinema-actions">
            <button
              type="button"
              className="cinema-cta-btn"
              onClick={onStartValuation}
            >
              <Icon name="home" size={18} />
              <span>START VALUATION</span>
            </button>
          </div>
          <div className="cinema-support-row">
            <div className="cinema-support-item">
              <Icon name="shield" size={17} />
              <span>Hyderabad Property Valuation</span>
            </div>
            <div className="cinema-support-divider"></div>
            <div className="cinema-support-item">
              <Icon name="chart" size={17} />
              <span>Data-Backed Estimates</span>
            </div>
            <div className="cinema-support-divider"></div>
            <div className="cinema-support-item">
              <Icon name="target" size={17} />
              <span>ML-Based Prediction</span>
            </div>
          </div>
        </div>
      </section>

      <section id="about-section" className="why">
        <div className="eyebrow">WHY ESTATEPREDICT?</div>
        <h2>Powerful Insights, Smarter Decisions</h2>
        <div className="tiny-line"></div>
        <div className="benefits">
          {[
            ['target', 'Accurate Valuation', 'Get precise property price predictions using advanced ML models.'],
            ['chart', 'Market Insights', 'Analyze real estate trends and make data-driven decisions.'],
            ['shield', 'Trusted & Reliable', 'Built for real estate professionals and property investors.'],
            ['clock', 'Save Time', 'Instant predictions that help you close deals faster.']
          ].map(([icon, title, desc]) => (
            <div className="benefit" key={title}>
              <Icon name={icon} size={38} />
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
