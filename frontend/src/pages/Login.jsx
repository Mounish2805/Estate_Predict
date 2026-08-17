import React, { useState } from 'react';
import Logo from '../components/Logo';
import Icon from '../components/Icon';
import { authService } from '../services/api';

export default function Login({ onLogin, onLoginSuccess, onNavigate }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [register, setRegister] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const loginCallback = onLoginSuccess || onLogin;
    try {
      if (register) {
        if (!name.trim() || !email.trim() || !password) {
          setError('Please complete all required fields.');
          setBusy(false);
          return;
        }
        const data = await authService.register(name.trim(), email.trim(), password);
        if (typeof loginCallback === 'function') {
          loginCallback(data.user || { username: name.trim(), email: email.trim() });
        }
      } else {
        if (!email.trim() || !password) {
          setError('Please complete all required fields.');
          setBusy(false);
          return;
        }
        const data = await authService.login(email.trim(), password);
        if (typeof loginCallback === 'function') {
          loginCallback(data.user || { username: data.user?.username || email.trim(), email: email.trim() });
        }
      }
    } catch (err) {
      setError(err.message || 'Unable to continue.');
    } finally {
      setBusy(false);
    }
  };

  const handleLogoClick = () => {
    if (register) {
      setRegister(false);
    }
    setError('');
    if (typeof onNavigate === 'function') {
      onNavigate('home');
    } else {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="login-page">
      <section className="login-city"></section>
      <section className="login-panel">
        <div className="login-inner">
          <Logo onClick={handleLogoClick} />
          <h1>{register ? 'Create Account' : 'Login'}</h1>
          <div className="gold-line"></div>
          <form onSubmit={submit}>
            {register && (
              <label>
                Name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Choose your name"
                  autoComplete="name"
                  required
                />
              </label>
            )}
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mail@website.com"
                autoComplete="email"
                required
              />
            </label>
            <label>
              Password
              <div className="input-icon">
                <Icon name="lock" />
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  autoComplete={register ? 'new-password' : 'current-password'}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label="Show password"
                >
                  <Icon name={show ? 'eyeoff' : 'eye'} />
                </button>
              </div>
            </label>
            {!register && (
              <div className="login-options">
                <label className="check">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span></span>Remember me
                </label>
                <button type="button" className="link">
                  Forgot password?
                </button>
              </div>
            )}
            {error && <div className="error">{error}</div>}
            <button className="gold-btn" disabled={busy}>
              {busy ? 'Please wait…' : register ? 'Create Account' : 'Login'}
            </button>
          </form>
          {!register && (
            <>
              <div className="or">
                <span></span>
                <em>Or sign in with</em>
                <span></span>
              </div>
              <button
                type="button"
                className="google-btn"
                onClick={() => setError('Google sign-in is not configured in the supplied Django backend.')}
              >
                <span className="google-g">G</span>Sign in with Google
              </button>
            </>
          )}
          <div className="account-switch">
            {register ? 'Already have an account?' : 'Not registered yet?'}{' '}
            <button
              type="button"
              onClick={() => {
                setRegister(!register);
                setError('');
              }}
            >
              {register ? 'Login' : 'Create an Account'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
