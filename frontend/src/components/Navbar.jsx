import React, { useState, useEffect, useRef } from 'react';
import Logo from './Logo';
import Icon from './Icon';

export default function Navbar({ currentView, hasActiveSubView, onNavigate, onLogout, user }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef(null);

  const displayName = user?.username || user?.name || user?.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();
  const email = user?.email || '';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const handleLogoutClick = () => {
    setDropdownOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <header className="navbar">
      <Logo nav onClick={() => onNavigate && onNavigate('home')} />
      <nav>
        <button
          type="button"
          className={currentView === 'home' && !hasActiveSubView ? 'active' : ''}
          onClick={() => onNavigate('home')}
        >
          Home
        </button>
        <button
          type="button"
          className={currentView === 'predict' && !hasActiveSubView ? 'active' : ''}
          onClick={() => onNavigate('predict')}
        >
          Predict Price
        </button>
        <button
          type="button"
          className={currentView === 'valuations' || hasActiveSubView ? 'active' : ''}
          onClick={() => onNavigate('valuations')}
        >
          My Valuations
        </button>
        <button
          type="button"
          className={currentView === 'compare' && !hasActiveSubView ? 'active' : ''}
          onClick={() => onNavigate('compare')}
        >
          Compare Properties
        </button>
        <button
          type="button"
          className={currentView === 'insights' && !hasActiveSubView ? 'active' : ''}
          onClick={() => onNavigate('insights')}
        >
          Price Insights
        </button>
        <button
          type="button"
          className={currentView === 'localities' && !hasActiveSubView ? 'active' : ''}
          onClick={() => onNavigate('localities')}
        >
          Explore Localities
        </button>
        {user?.is_admin && (
          <button
            type="button"
            className={currentView === 'admin' && !hasActiveSubView ? 'active' : ''}
            onClick={() => onNavigate('admin')}
          >
            Admin
          </button>
        )}
      </nav>
      <div className="nav-right">
        {user ? (
          <div className="nav-user-menu" ref={menuRef}>
            <button
              type="button"
              className={`nav-user-btn ${dropdownOpen ? 'active' : ''}`}
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              <span className="nav-user-avatar">{initial}</span>
              <span className="nav-user-name">{displayName}</span>
              <span className={`nav-user-caret ${dropdownOpen ? 'open' : ''}`}>
                <Icon name="chevronDown" size={13} />
              </span>
            </button>

            {dropdownOpen && (
              <div className="nav-user-dropdown">
                <div className="nav-user-dropdown-header">
                  <div className="nav-user-dropdown-name">{displayName}</div>
                  {email && <div className="nav-user-dropdown-email">{email}</div>}
                </div>
                <div className="nav-user-dropdown-divider" />
                <button
                  type="button"
                  className="nav-user-dropdown-item nav-user-logout-btn"
                  onClick={handleLogoutClick}
                >
                  <Icon name="logout" size={14} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button type="button" className="nav-logout-btn" onClick={() => onNavigate('login')}>
            Login
          </button>
        )}
      </div>
    </header>
  );
}
