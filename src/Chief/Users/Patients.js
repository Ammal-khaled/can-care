import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Users.css';

const Patients = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [patients, setPatients] = useState([
    {
      id: 'P-001',
      name: 'Ahmad Saleh',
      age: 45,
      gender: 'Male',
      phone: '0781234567',
      address: 'Amman, Jordan',
      status: 'In Treatment',
      joinDate: '2024-10-12',
      doctorInCharge: 'Dr. Omar Khaled',
      medicalRecords: {
        diagnosis: 'Cancer',
        medications: ['Medication A', 'Medication B'],
        appointments: ['2025-12-20', '2026-01-05'],
        labTests: ['Blood Test – 12/12/2025'],
        notes: [
          {
            author: 'Admin',
            date: '2025-01-10',
            text: 'Patient requires close monitoring.',
          },
        ],
      },
    },
    {
      id: 'P-002',
      name: 'Sara Mahmoud',
      age: 32,
      gender: 'Female',
      phone: '0799876543',
      address: 'Zarqa, Jordan',
      status: 'Active',
      joinDate: '2024-11-03',
      doctorInCharge: 'Dr. Lina Yousef',
      medicalRecords: {
        diagnosis: 'Recovered',
        medications: [],
        appointments: [],
        labTests: [],
        notes: [],
      },
    },
  ]);

  const [modal, setModal] = useState({ type: '', patient: null });

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (type, patient = null) => {
    setModal({ type, patient });
  };

 
  const handleEditPatient = (updatedPatient) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === updatedPatient.id ? { ...p, ...updatedPatient } : p
      )
    );
    setModal({ type: '', patient: null });
  };

  const handleDeletePatient = (id) => {
    setPatients(patients.filter((p) => p.id !== id));
    setModal({ type: '', patient: null });
  };

  return (
    <div className="users-page">
      {/* Header */}
      <div className="users-header">
        <h1>Patients</h1>
        <p>Manage registered patients and access their medical profiles.</p>
      </div>

      {/* Dashboard */}
      <div className="users-cards">
        <div className="users-card">
          <h3>Total Patients</h3>
          <span>{patients.length}</span>
        </div>
        <div className="users-card">
          <h3>Active</h3>
          <span>{patients.filter(p => p.status === 'Active').length}</span>
        </div>
        <div className="users-card">
          <h3>In Treatment</h3>
          <span>{patients.filter(p => p.status === 'In Treatment').length}</span>
        </div>
        <div className="users-card">
          <h3>Discharged</h3>
          <span>{patients.filter(p => p.status === 'Discharged').length}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="users-actions">
        <input
          type="text"
          placeholder="Search by name or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        </div>
      {/* Table */}
      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Age</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="empty-state">
                  Loading patients...
                </td>
              </tr>
            ) : filteredPatients.length > 0 ? (
              filteredPatients.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.age}</td>
                  <td>
                    <span className={`status ${p.status.toLowerCase().replace(' ', '-')}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="table-actions">
                    <button
                      className="view-btn"
                      onClick={() =>
                        navigate(`/users/${p.id}`, {
                          state: {
                            user: {
                              ...p,
                              role: 'Patient',
                            },
                          },
                        })
                      }
                    >
                      View
                    </button>
                    <button className="edit-btn" onClick={() => openModal('edit', p)}>
                      Edit
                    </button>
                    <button className="delete-btn" onClick={() => openModal('delete', p)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-state">
                  No patients found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
     
      {modal.type === 'edit' && (
        <PatientModal
          type="Edit"
          patient={modal.patient}
          onSave={handleEditPatient}
          onClose={() => openModal('', null)}
        />
      )}

      {modal.type === 'delete' && (
        <DeleteModal
          patient={modal.patient}
          onDelete={() => handleDeletePatient(modal.patient.id)}
          onClose={() => openModal('', null)}
        />
      )}
    </div>
  );
};

/* ---------------- MODALS ---------------- */

const PatientModal = ({ type, patient = {}, onSave, onClose }) => {
  const [form, setForm] = useState({
    id: patient.id || '',
    name: patient.name || '',
    age: patient.age || '',
    status: patient.status || 'Active',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{type} Patient</h2>
        <input name="id" value={form.id} onChange={handleChange} placeholder="Patient ID" />
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" />
        <input name="age" value={form.age} onChange={handleChange} placeholder="Age" />
        <select name="status" value={form.status} onChange={handleChange}>
          <option>Active</option>
          <option>In Treatment</option>
          <option>Discharged</option>
        </select>
        <div className="modal-actions">
          <button onClick={() => onSave(form)}>{type}</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const DeleteModal = ({ patient, onDelete, onClose }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Delete Patient</h2>
      <p>
        Delete <strong>{patient.name}</strong>?
      </p>
      <div className="modal-actions">
        <button onClick={onDelete}>Delete</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  </div>
);

export default Patients;
