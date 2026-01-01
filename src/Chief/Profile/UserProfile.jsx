import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './UserProfile.css';

const UserProfile = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const user = state?.user;

  /* ---------------- HOOKS (ALWAYS FIRST) ---------------- */
  const [doctorInCharge, setDoctorInCharge] = useState(
    user?.doctorInCharge || ''
  );

  const [notes, setNotes] = useState(
    user?.medicalRecords?.notes || []
  );

  const [newNote, setNewNote] = useState('');

  /* ---------------- GUARD ---------------- */
  if (!user) {
    return (
      <div className="profile-page">
        <p>User data not found.</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  /* ---------------- HELPERS ---------------- */
  const addNote = () => {
    if (!newNote.trim()) return;

    const note = {
      author: 'Admin',
      date: new Date().toISOString(),
      text: newNote.trim(),
    };

    setNotes((prev) => [...prev, note]);
    setNewNote('');
  };

  const formatDate = (date) =>
    new Date(date).toLocaleString();

  /* ---------------- RENDER ---------------- */
  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <h1>{user.name}</h1>
        <span className="role-badge">{user.role}</span>
      </div>

      {/* Basic Info */}
      <div className="profile-card">
        <h2>Basic Information</h2>
        <div className="info-grid">
          <Info label="ID" value={user.id} />
          <Info label="Age" value={user.age} />
          <Info label="Gender" value={user.gender} />

          {user.role === 'Patient' && (
            <>
              <Info label="Status" value={user.status} />
              <Info label="Join Date" value={user.joinDate} />
            </>
          )}

          {user.role === 'Doctor' && (
            <>
              <Info label="Department" value={user.department} />
              <Info label="Specialization" value={user.specialization} />
            </>
          )}

          {user.role === 'Nurse' && (
            <>
              <Info label="Department" value={user.department} />
              <Info label="Shift" value={user.shift} />
            </>
          )}
        </div>
      </div>

      {/* Doctor in Charge (editable by admin only) */}
      {user.role === 'Patient' && (
        <div className="profile-card">
          <h2>Doctor in Charge</h2>
          <select
            value={doctorInCharge}
            onChange={(e) => setDoctorInCharge(e.target.value)}
          >
            <option value="">Select Doctor</option>
            <option>Dr. Omar Khaled</option>
            <option>Dr. Lina Yousef</option>
          </select>
        </div>
      )}

      {/* Medical Records */}
      {user.role === 'Patient' && user.medicalRecords && (
        <div className="profile-card">
          <h2>Medical Records</h2>

          <Info
            label="Diagnosis"
            value={user.medicalRecords.diagnosis || '-'}
          />

          <Info
            label="Medications"
            value={
              user.medicalRecords.medications?.length
                ? user.medicalRecords.medications.join(', ')
                : 'None'
            }
          />

          <Info
            label="Appointments"
            value={
              user.medicalRecords.appointments?.length
                ? user.medicalRecords.appointments.join(', ')
                : 'None'
            }
          />

          <Info
            label="Lab Tests"
            value={
              user.medicalRecords.labTests?.length
                ? user.medicalRecords.labTests.join(', ')
                : 'None'
            }
          />
        </div>
      )}

      {/* Chief Notes */}
      {user.role === 'Patient' && (
        <div className="profile-card">
          <h2>Chief Notes</h2>

          {notes.length > 0 ? (
            notes.map((note, index) => (
              <div key={index} className="note">
                <div className="note-meta">
                  <strong>{note.author}</strong>
                  <span>{formatDate(note.date)}</span>
                </div>
                <p>{note.text}</p>
              </div>
            ))
          ) : (
            <p className="empty-text">No notes yet.</p>
          )}

          <textarea
            placeholder="Add a note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />

          <button className="primary-btn" onClick={addNote}>
            Add Note
          </button>
        </div>
      )}

      <button className="back-btn" onClick={() => navigate(-1)}>
        Back
      </button>
    </div>
  );
};

/* ---------------- SMALL COMPONENT ---------------- */

const Info = ({ label, value }) => (
  <div className="info-item">
    <span>{label}</span>
    <p>{value || '-'}</p>
  </div>
);

export default UserProfile;
