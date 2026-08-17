import React from 'react';

export default function Logo({ nav = false, onClick }) {
  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else {
      if (window.location.pathname !== '/') {
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  };

  return (
    <div
      className={nav ? 'brand nav-brand' : 'brand'}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick(e);
        }
      }}
    >
      <div className="brand-mark">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div>
        <div className="brand-name">
          <b>ESTATE</b>
          <strong>PREDICT</strong>
        </div>
        <div className="tagline">Know the Value. Make the Right Move.</div>
      </div>
    </div>
  );
}
