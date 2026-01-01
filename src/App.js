
// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

import Login from './components/Login';
import ChiefRoutes from './Chief/ChiefRoutes';
import ClerkRoutes from './Clerk/ClerkRoutes';
import { AppProvider } from './Clerk/context/AppContext';   // << add

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // TEMP: role assignment (replace later)
      if (currentUser?.email === 'chief@example.com') setRole('admin');
      else setRole('clerk');
    });
    return () => unsubscribe();
  }, []);

  if (!user) return <Login />;
  if (!role) return <div>Loading...</div>;

  return (
    <AppProvider>
      <Router>
        {role === 'admin' && <ChiefRoutes />}
        {role === 'clerk' && <ClerkRoutes />}
      </Router>
    </AppProvider>
  );
}

export default App;
