import React from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import './ClerkLayout.css';

const ClerkAppLayout = ({ onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();  // needed for redirect

  const pageTitles = {
    '/clerk/dashboard': 'Dashboard',
    '/clerk/patients': 'Patients',
    '/clerk/doctors': 'Doctors',
    '/clerk/nurses': 'Nurses',
    '/clerk/appointments': 'Appointments',
  };

  const pageTitle = pageTitles[location.pathname] || 'CanCare';

  const handleLogout = async () => {
    try {
      if (onLogout) {
        await onLogout();
      }
      navigate('/');  // redirect to login page
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="clerk-app-layout">
      {/* Sidebar */}
      <aside className="clerk-sidebar">
        <div className="clerk-logo">CanCare</div>
        <p className="clerk-scope">Registration desk workspace</p>

        <nav className="clerk-nav">
          <NavLink to="/clerk/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
            Dashboard
          </NavLink>
          <NavLink to="/clerk/patients" className={({ isActive }) => isActive ? 'active' : ''}>
            Patients
          </NavLink>
          <NavLink to="/clerk/doctors" className={({ isActive }) => isActive ? 'active' : ''}>
            Doctors
          </NavLink>
          <NavLink to="/clerk/nurses" className={({ isActive }) => isActive ? 'active' : ''}>
            Nurses
          </NavLink>
          <NavLink to="/clerk/appointments" className={({ isActive }) => isActive ? 'active' : ''}>
            Appointments
          </NavLink>
        </nav>
      </aside>

      {/* Main area */}
      <div className="clerk-main">
        {/* NAVBAR */}
        <header className="clerk-navbar">
          <div>
            <h3>{pageTitle}</h3>
            <span>Portfolio demo · fictional healthcare data</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </header>

        {/* PAGE CONTENT */}
        <main className="clerk-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ClerkAppLayout;
