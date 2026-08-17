import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import ValuationReportView from './components/ValuationReportView';
import Login from './pages/Login';
import Home from './pages/Home';
import Predict from './pages/Predict';
import MyValuations from './pages/MyValuations';
import WhatIfValuation from './pages/WhatIfValuation';
import PriceInsights from './pages/PriceInsights';
import ExploreLocalities from './pages/ExploreLocalities';
import CompareProperties from './pages/CompareProperties';
import Admin from './pages/Admin';
import { defaults } from './utils/constants';
import { authService } from './services/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  const [formState, setFormState] = useState(defaults);
  const [currentView, setCurrentView] = useState(() => {
    return window.location.pathname.startsWith('/admin') ? 'admin' : 'home';
  });
  const [directWhatIfTarget, setDirectWhatIfTarget] = useState(null);
  const [directReportTarget, setDirectReportTarget] = useState(null);

  const setFormField = (key, value) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const navigateTo = (view) => {
    if (view === 'admin' || view === 'admin/users' || view === 'admin/predictions') {
      if (!user?.is_admin) {
        setCurrentView('home');
        if (window.location.pathname.startsWith('/admin')) {
          window.history.pushState({}, '', '/');
        }
      } else {
        setCurrentView('admin');
        const targetPath =
          view === 'admin/users'
            ? '/admin/users'
            : view === 'admin/predictions'
            ? '/admin/predictions'
            : '/admin';
        window.history.pushState({}, '', targetPath);
      }
    } else {
      setCurrentView(view);
      if (window.location.pathname.startsWith('/admin')) {
        window.history.pushState({}, '', '/');
      }
    }
    setDirectWhatIfTarget(null);
    setDirectReportTarget(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    authService
      .getCurrentUser()
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
          // If loaded on /admin or /admin/users, verify admin permissions
          if (window.location.pathname.startsWith('/admin')) {
            if (data.user.is_admin) {
              setCurrentView('admin');
            } else {
              setCurrentView('home');
              window.history.replaceState({}, '', '/');
            }
          }
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith('/admin')) {
        if (user?.is_admin) {
          setCurrentView('admin');
        } else {
          setCurrentView('home');
          window.history.replaceState({}, '', '/');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    if (window.location.pathname.startsWith('/admin')) {
      if (userData?.is_admin) {
        setCurrentView('admin');
      } else {
        setCurrentView('home');
        window.history.replaceState({}, '', '/');
      }
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setCurrentView('home');
    if (window.location.pathname.startsWith('/admin')) {
      window.history.replaceState({}, '', '/');
    }
  };

  if (checking) {
    return (
      <div className="home-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: '#EAE6DF', fontSize: '18px', fontWeight: 600 }}>Loading EstatePredict...</div>
      </div>
    );
  }

  if (!user && (currentView === 'login' || (currentView !== 'home' && currentView !== 'insights' && currentView !== 'localities' && currentView !== 'compare'))) {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onLogin={handleLoginSuccess}
        onNavigate={navigateTo}
      />
    );
  }

  const hasActiveSubView = Boolean(directWhatIfTarget || directReportTarget);

  if (currentView === 'admin') {
    if (user?.is_admin) {
      return (
        <Admin
          user={user}
          initialTab={
            window.location.pathname.includes('/predictions')
              ? 'predictions'
              : window.location.pathname.includes('/users')
              ? 'users'
              : 'overview'
          }
          onNavigate={navigateTo}
          onLogout={handleLogout}
          onBackHome={() => navigateTo('home')}
        />
      );
    }
    return <Home onStartValuation={() => navigateTo(user ? 'predict' : 'login')} />;
  }

  return (
    <div className="home-page">
      <Navbar
        user={user}
        currentView={currentView}
        hasActiveSubView={hasActiveSubView}
        onNavigate={navigateTo}
        onLogout={handleLogout}
      />

      {directWhatIfTarget ? (
        <WhatIfValuation
          record={directWhatIfTarget}
          onBack={() => setDirectWhatIfTarget(null)}
        />
      ) : directReportTarget ? (
        <div className="valuations-page">
          <div className="valuations-container">
            <ValuationReportView
              record={directReportTarget}
              onBack={() => setDirectReportTarget(null)}
              onExploreWhatIf={(rec) => {
                setDirectReportTarget(null);
                setDirectWhatIfTarget(rec);
              }}
            />
          </div>
        </div>
      ) : currentView === 'compare' ? (
        <CompareProperties onStartValuation={() => navigateTo('predict')} />
      ) : currentView === 'localities' ? (
        <ExploreLocalities
          onPredictProperty={(loc) => {
            setFormField('locality', loc);
            navigateTo('predict');
          }}
        />
      ) : currentView === 'insights' ? (
        <PriceInsights
          onStartValuation={(loc) => {
            setFormField('locality', loc);
            navigateTo('predict');
          }}
          onViewReport={(rec) => {
            setDirectReportTarget(rec);
          }}
        />
      ) : currentView === 'valuations' ? (
        <MyValuations onStartValuation={() => navigateTo('predict')} />
      ) : currentView === 'predict' ? (
        <Predict
          formState={formState}
          setFormField={setFormField}
          onExploreWhatIf={(rec) => setDirectWhatIfTarget(rec)}
        />
      ) : (
        <Home onStartValuation={() => navigateTo(user ? 'predict' : 'login')} />
      )}

      <footer>
        <span>© 2026 ESTATEPREDICT</span>
      </footer>
    </div>
  );
}

