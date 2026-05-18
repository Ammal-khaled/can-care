import React, { useState } from 'react';
import './Login.css';
import { auth, db } from '../firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const Login = ({ onDemoLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError('Invalid email or password');
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        email,
        role: 'clerk',
        createdAt: new Date(),
      });

      setLoading(false);
      setIsRegister(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleModeChange = (nextMode) => {
    setError('');
    setIsRegister(nextMode === 'register');
  };

  return (
    <main className="login-page">
      <section className="login-shell" aria-label="CanCare login">
        <div className="login-panel auth-panel">
          <div className="brand-row">
            <div className="brand-mark" aria-hidden="true">C</div>
            <div>
              <p className="eyebrow">Portfolio demo · fictional healthcare data</p>
              <h1>CanCare Admin</h1>
            </div>
          </div>

          <div className="intro-copy">
            <h2>{isRegister ? 'Create dashboard access.' : 'Choose how to explore.'}</h2>
            <p>
              {isRegister
                ? 'Register an optional Firebase account for the web dashboard. Demo access stays available for review.'
                : 'Use demo access to review the Chief/Admin and Registration Desk workflows without real credentials.'}
            </p>
          </div>

          <div className="demo-access" aria-label="Demo access">
            <div className="demo-header">
              <span>Recommended</span>
              <p>No real patient data is used.</p>
            </div>
            <div className="demo-actions">
              <button
                type="button"
                className="demo-card admin-demo"
                onClick={() => onDemoLogin('admin')}
                disabled={loading}
              >
                <span className="demo-icon">✦</span>
                <span>
                  <strong>Enter as Chief / Admin</strong>
                  <small>Oversight, notifications, staff, and community management</small>
                </span>
              </button>
              <button
                type="button"
                className="demo-card clerk-demo"
                onClick={() => onDemoLogin('clerk')}
                disabled={loading}
              >
                <span className="demo-icon">⌁</span>
                <span>
                  <strong>Enter as Clerk</strong>
                  <small>Registration, patient intake, and appointment workflow</small>
                </span>
              </button>
            </div>
          </div>

          <div className="divider"><span>or continue with Firebase account</span></div>

          {!isRegister ? (
            <form className="auth-form" onSubmit={handleLogin}>
              <label className="field-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                disabled={loading}
              />

              <label className="field-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />

              {error && <p className="error-text">{error}</p>}

              <button className="submit-btn" type="submit" disabled={loading}>
                {loading ? <span className="spinner" aria-label="Loading" /> : 'Login'}
              </button>

              <p className="mode-switch">
                Need a Firebase account?{' '}
                <button type="button" onClick={() => handleModeChange('register')}>
                  Sign Up
                </button>
              </p>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleRegister}>
              <label className="field-label" htmlFor="register-email">Email</label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                disabled={loading}
              />

              <label className="field-label" htmlFor="register-password">Password</label>
              <input
                id="register-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                disabled={loading}
              />

              {error && <p className="error-text">{error}</p>}

              <button className="submit-btn" type="submit" disabled={loading}>
                {loading ? <span className="spinner" aria-label="Loading" /> : 'Register'}
              </button>

              <p className="mode-switch">
                Already have an account?{' '}
                <button type="button" onClick={() => handleModeChange('login')}>
                  Sign In
                </button>
              </p>
            </form>
          )}
        </div>

        <aside className="login-panel story-panel">
          <div className="story-badge">Web Admin + Registration Desk</div>
          <h2>Cancer care operations, organized.</h2>
          <p>
            Admin and registration workflows for patient intake, appointments,
            care team coordination, notifications, and community updates.
          </p>

          <div className="preview-board" aria-hidden="true">
            <div className="preview-card large-card">
              <span className="preview-label">Product preview</span>
              <strong>Appointment coordination</strong>
              <p>Schedule and track care visits</p>
              <div className="preview-lines">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="preview-grid">
              <div className="preview-card">
                <span>Team workspace</span>
                <strong>Care team overview</strong>
                <p>Manage doctors and nurses</p>
              </div>
              <div className="preview-card green">
                <span>Alerts</span>
                <strong>Notification center</strong>
                <p>Review requests and alerts</p>
              </div>
              <div className="preview-card purple">
                <span>Support hub</span>
                <strong>Community updates</strong>
                <p>Publish support content</p>
              </div>
              <div className="preview-card blue">
                <span>Intake flow</span>
                <strong>Registration workflow</strong>
                <p>Organize demo access paths</p>
              </div>
            </div>
          </div>

          <p className="privacy-note">Dashboard details are available after demo access.</p>

          <div className="story-footer">
            <span>Chief/Admin oversight</span>
            <span>Registration workflow</span>
            <span>Fictional demo records</span>
          </div>
        </aside>
      </section>
    </main>
  );
};

export default Login;
