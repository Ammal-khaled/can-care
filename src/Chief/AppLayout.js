import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './style/AppLayout.css';

const AppLayout = ({ role, pageTitle, onLogout, children }) => {
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/' },
    { name: 'Profile', path: '/profile' },
    ...(role === 'admin'
      ? [
          { name: 'Patients', path: '/patients' },
          { name: 'Doctors', path: '/doctors' },
          { name: 'Nurses', path: '/nurses' },
        ]
      : []),
    { name: 'Appointments', path: '/appointments' },
    { name: 'Notifications', path: '/notifications' },
    { name: 'Community', path: '/Community' },
  ];

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="layout-sidebar">
        <div className="logo">CanCare</div>

        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={location.pathname === link.path ? 'active' : ''}
          >
            {link.name}
          </Link>
        ))}
      </aside>

      {/* Main */}
      <div className="layout-main">
        {/* Navbar */}
        <header className="layout-navbar">
          <h3>{pageTitle}</h3>
          <button onClick={onLogout}>Logout</button>
        </header>

        {/* Page content */}
        <div className="layout-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
