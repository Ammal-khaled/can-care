
// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';

import Login from './components/Login';
import ChiefRoutes from './Chief/ChiefRoutes';
import ClerkRoutes from './Clerk/ClerkRoutes';
import { AppProvider } from './Clerk/context/AppContext';   // << add

const DEMO_USER_KEY = 'cancare-demo-user';

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedDemoUser = localStorage.getItem(DEMO_USER_KEY);

    if (storedDemoUser) {
      try {
        const demoUser = JSON.parse(storedDemoUser);
        setUser(demoUser);
        setRole(demoUser.role);
        setLoading(false);
        return undefined;
      } catch (err) {
        localStorage.removeItem(DEMO_USER_KEY);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // TEMP: role assignment (replace later)
      if (currentUser?.email === 'chief@example.com') setRole('admin');
      else if (currentUser) setRole('clerk');
      else setRole(null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDemoLogin = (selectedRole) => {
    const demoUser = {
      email: selectedRole === 'admin' ? 'chief@example.com' : 'clerk@example.com',
      role: selectedRole,
      mode: 'demo'
    };

    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
    setUser(demoUser);
    setRole(selectedRole);
  };

  const handleLogout = async () => {
    localStorage.removeItem(DEMO_USER_KEY);

    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (err) {
      console.error('Firebase sign out failed:', err);
    } finally {
      setUser(null);
      setRole(null);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <Login onDemoLogin={handleDemoLogin} />;
  if (!role) return <div>Loading...</div>;

  return (
    <AppProvider>
      <Router>
        {role === 'admin' && <ChiefRoutes onLogout={handleLogout} />}
        {role === 'clerk' && <ClerkRoutes onLogout={handleLogout} />}
      </Router>
    </AppProvider>
  );
}

export default App;
