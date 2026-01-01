import React, { useState } from 'react';
import './Login.css';
import { auth, db } from '../firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const Login = () => {
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

      // Store user in Firestore with default role = 'clerk'
      await setDoc(doc(db, 'users', user.uid), {
        email,
        role: 'clerk',
        createdAt: new Date()
      });

      setLoading(false);
      setIsRegister(false); // switch to login form
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className={`container ${isRegister ? 'active' : ''}`}>
        {/* CURVED BACKGROUNDS */}
        <div className="curved-shape"></div>
        <div className="curved-shape2"></div>

        {/* INFO CONTENT */}
        <div className={`info-content Login ${isRegister ? '' : 'show'}`}>
          <h2>WELCOME BACK!</h2>
          <p>We are happy to have you with us again.</p>
        </div>
        <div className={`info-content Register ${isRegister ? 'show' : ''}`}>
          <h2>WELCOME!</h2>
          <p>We’re delighted to have you here.</p>
        </div>

        {/* LOGIN FORM */}
        <div className={`form-box Login ${isRegister ? '' : 'show'}`}>
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <div className="input-box">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
              <label>Email</label>
            </div>
            <div className="input-box">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <label>Password</label>
            </div>

            {error && <p className="error-text">{error}</p>}

            <div className="input-box">
              <button className="btn" type="submit" disabled={loading}>
                {loading ? <span className="spinner"></span> : 'Login'}
              </button>
            </div>

            <p className="regi-link">
              Don’t have an account?{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => setIsRegister(true)}
              >
                Sign Up
              </button>
            </p>
          </form>
        </div>

        {/* REGISTER FORM */}
        <div className={`form-box Register ${isRegister ? 'show' : ''}`}>
          <h2>Register</h2>
          <form onSubmit={handleRegister}>
            <div className="input-box">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
              <label>Email</label>
            </div>
            <div className="input-box">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <label>Password</label>
            </div>

            {error && <p className="error-text">{error}</p>}

            <div className="input-box">
              <button className="btn" type="submit" disabled={loading}>
                {loading ? <span className="spinner"></span> : 'Register'}
              </button>
            </div>

            <p className="regi-link">
              Already have an account?{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => setIsRegister(false)}
              >
                Sign In
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
