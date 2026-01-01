import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Users.css';

const Doctors = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [doctors, setDoctors] = useState([
    {
      id: 'D-001',
      name: 'Dr. Omar Khaled',
      age: 41,
      gender: 'Male',
      department: 'Oncology',
      specialization: 'Radiation Oncology',
      shift: 'Morning',
      status: 'Active',
      joinDate: '2022-01-15',
    },
    {
      id: 'D-002',
      name: 'Dr. Lina Saeed',
      age: 38,
      gender: 'Female',
      department: 'Hematology',
      specialization: 'Blood Disorders',
      shift: 'Night',
      status: 'Active',
      joinDate: '2021-06-10',
    },
  ]);

  const [modal, setModal] = useState({ type: '', doctor: null });

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  const filteredDoctors = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (type, doctor = null) => {
    setModal({ type, doctor });
  };

 

  const handleEditDoctor = (updatedDoctor) => {
    setDoctors((prev) =>
      prev.map((d) =>
        d.id === updatedDoctor.id ? { ...d, ...updatedDoctor } : d
      )
    );
    setModal({ type: '', doctor: null });
  };

  const handleDeleteDoctor = (id) => {
    setDoctors(doctors.filter((d) => d.id !== id));
    setModal({ type: '', doctor: null });
  };

  // Dashboard card counts
  const totalDoctors = doctors.length;
  const activeDoctors = doctors.filter(d => d.status === 'Active').length;
  const morningShift = doctors.filter(d => d.shift === 'Morning').length;
  const nightShift = doctors.filter(d => d.shift === 'Night').length;

  return (
    <div className="users-page">
      {/* Header */}
      <div className="users-header">
        <h1>Doctors</h1>
        <p>Manage registered doctors and their details.</p>
      </div>

      {/* Dashboard Cards */}
      <div className="users-cards">
        <div className="users-card">
          <h3>Total Doctors</h3>
          <span>{totalDoctors}</span>
        </div>
        <div className="users-card">
          <h3>Active</h3>
          <span>{activeDoctors}</span>
        </div>
        <div className="users-card">
          <h3>Morning Shift</h3>
          <span>{morningShift}</span>
        </div>
        <div className="users-card">
          <h3>Night Shift</h3>
          <span>{nightShift}</span>
        </div>
      </div>

      {/* Search & Add */}
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
              <th>Department</th>
              <th>Specialization</th>
              <th>Shift</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="empty-state">
                  Loading doctors...
                </td>
              </tr>
            ) : filteredDoctors.length > 0 ? (
              filteredDoctors.map((d) => (
                <tr key={d.id}>
                  <td>{d.id}</td>
                  <td>{d.name}</td>
                  <td>{d.department}</td>
                  <td>{d.specialization}</td>
                  <td>{d.shift}</td>
                  <td>
                    <span className={`status ${d.status.toLowerCase()}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="table-actions">
                    <button
                      className="view-btn"
                      onClick={() =>
                        navigate(`/users/${d.id}`, { state: { role: 'Doctor' } })
                      }
                    >
                      View
                    </button>
                    <button className="edit-btn" onClick={() => openModal('edit', d)}>
                      Edit
                    </button>
                    <button className="delete-btn" onClick={() => openModal('delete', d)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="empty-state">
                  No doctors found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {modal.type === 'edit' && (
        <DoctorModal type="Edit" doctor={modal.doctor} onSave={handleEditDoctor} onClose={() => openModal('', null)} />
      )}
      {modal.type === 'delete' && (
        <DeleteModal
          doctor={modal.doctor}
          onDelete={() => handleDeleteDoctor(modal.doctor.id)}
          onClose={() => openModal('', null)}
        />
      )}
    </div>
  );
};

/* ---------------- MODALS ---------------- */

const DoctorModal = ({ type, doctor = {}, onSave, onClose }) => {
  const [form, setForm] = useState({
    id: doctor.id || '',
    name: doctor.name || '',
    department: doctor.department || '',
    specialization: doctor.specialization || '',
    shift: doctor.shift || 'Morning',
    status: doctor.status || 'Active',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{type} Doctor</h2>
        <input name="id" value={form.id} onChange={handleChange} placeholder="ID" />
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" />
        <input name="department" value={form.department} onChange={handleChange} placeholder="Department" />
        <input name="specialization" value={form.specialization} onChange={handleChange} placeholder="Specialization" />
        <select name="shift" value={form.shift} onChange={handleChange}>
          <option>Morning</option>
          <option>Night</option>
        </select>
        <select name="status" value={form.status} onChange={handleChange}>
          <option>Active</option>
          <option>Inactive</option>
        </select>
        <div className="modal-actions">
          <button onClick={() => onSave(form)}>{type}</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const DeleteModal = ({ doctor, onDelete, onClose }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Delete Doctor</h2>
      <p>
        Delete <strong>{doctor.name}</strong>?
      </p>
      <div className="modal-actions">
        <button onClick={onDelete}>Delete</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  </div>
);

export default Doctors;
