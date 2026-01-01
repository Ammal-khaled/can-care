import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppLayout from './AppLayout';
import Dashboard from './Dashboard';
import Profile from './Profile/Profile';
import Patients from './Users/Patients';
import Doctors from './Users/Doctors';
import Nurses from './Users/Nurses';
import Appointments from './Appointments';
import Notifications from './Notifications';
import Community from './Community';
import UserProfile from './Profile/UserProfile';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const ChiefRoutes = () => {
  const location = useLocation();

  const pageTitles = {
    '/': 'Dashboard',
    '/profile': 'Profile',
    '/patients': 'Patients',
    '/doctors': 'Doctors',
    '/nurses': 'Nurses',
    '/appointments': 'Appointments',
    '/notifications': 'Notifications',
    '/community': 'Community',
  };

  return (
    <AppLayout
      role="admin"
      pageTitle={pageTitles[location.pathname]}
      onLogout={() => signOut(auth)}
    >
      <Routes>
        <Route path="/" element={<Dashboard role="admin" />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/nurses" element={<Nurses />} />
        <Route path="/users/:id" element={<UserProfile />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/community" element={<Community />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AppLayout>
  );
};

export default ChiefRoutes;
