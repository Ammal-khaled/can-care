import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('patients');
  const [search, setSearch] = useState('');

  const loggedInRole = 'Admin';

  const users = [
    { id: 'P-001', name: 'Ahmad Saleh', role: 'Patient', age: 45, gender: 'Male', bloodType: 'A+', diagnosis: 'Cancer' },
    { id: 'P-002', name: 'Sara Mahmoud', role: 'Patient', age: 32, gender: 'Female', bloodType: 'O-', diagnosis: 'Recovered' },
    { id: 'D-003', name: 'Dr. Omar Khaled', role: 'Doctor', age: 41, gender: 'Male', department: 'Oncology', specialization: 'Chemotherapy' },
    { id: 'N-004', name: 'Lina Hassan', role: 'Nurse', age: 29, gender: 'Female', department: 'Oncology', shift: 'Morning' },
  ];

  const roleMap = { doctors: 'Doctor', nurses: 'Nurse', patients: 'Patient' };

  const filteredUsers = users.filter(
    (u) => u.role === roleMap[activeTab] && u.name.toLowerCase().includes(search.toLowerCase())
  );

  const columnsMap = {
    patients: ['Name', 'Age', 'Gender', 'Blood Type', 'Diagnosis', 'Action'],
    doctors: ['Name', 'Age', 'Gender', 'Department', 'Specialization', 'Action'],
    nurses: ['Name', 'Age', 'Gender', 'Department', 'Shift', 'Action'],
  };

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <h1>Admin Profile</h1>
        <span className="role-badge admin">{loggedInRole}</span>
      </div>

      {/* Admin Info */}
      <div className="profile-card">
        <h2>Admin Information</h2>
        <div className="admin-info">
          <div className="admin-info-item"><span>Name</span><p>System Admin</p></div>
          <div className="admin-info-item"><span>Email</span><p>admin@cancare.com</p></div>
          <div className="admin-info-item"><span>Role</span><p>Administrator</p></div>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        className="profile-search"
        placeholder="Search by name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Tabs */}
      <div className="profile-tabs">
        {['doctors', 'nurses', 'patients'].map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="profile-card">
        <table className="users-table">
          <thead>
            <tr>
              {columnsMap[activeTab].map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? filteredUsers.map((user) => (
              <tr key={user.id}>
                {activeTab === 'patients' && <>
                  <td>{user.name}</td>
                  <td>{user.age}</td>
                  <td>{user.gender}</td>
                  <td>{user.bloodType}</td>
                  <td>{user.diagnosis}</td>
                </>}
                {activeTab === 'doctors' && <>
                  <td>{user.name}</td>
                  <td>{user.age}</td>
                  <td>{user.gender}</td>
                  <td>{user.department}</td>
                  <td>{user.specialization}</td>
                </>}
                {activeTab === 'nurses' && <>
                  <td>{user.name}</td>
                  <td>{user.age}</td>
                  <td>{user.gender}</td>
                  <td>{user.department}</td>
                  <td>{user.shift}</td>
                </>}
                <td>
                  <button
                    className="view-btn"
                   onClick={() => navigate(`/users/${user.id}`, { state: { user } })}

                  >
                    View Full Profile
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={columnsMap[activeTab].length} className="empty-state">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Profile;
