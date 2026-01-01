import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Users.css';

const Nurses = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [nurses, setNurses] = useState([
    {
      id: 'N-001',
      name: 'Nurse Huda Ali',
      age: 28,
      gender: 'Female',
      department: 'Oncology',
      shift: 'Morning',
      status: 'Active',
      joinDate: '2023-03-12',
    },
    {
      id: 'N-002',
      name: 'Nurse Omar Yassin',
      age: 35,
      gender: 'Male',
      department: 'Hematology',
      shift: 'Night',
      status: 'Active',
      joinDate: '2022-11-01',
    },
  ]);

  const [modal, setModal] = useState({ type: '', nurse: null });

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  const filteredNurses = nurses.filter(
    (n) =>
      n.name.toLowerCase().includes(search.toLowerCase()) ||
      n.id.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (type, nurse = null) => {
    setModal({ type, nurse });
  };

  const handleAddNurse = (newNurse) => {
    setNurses([...nurses, newNurse]);
    setModal({ type: '', nurse: null });
  };

  const handleEditNurse = (updatedNurse) => {
    setNurses((prev) =>
      prev.map((n) =>
        n.id === updatedNurse.id ? { ...n, ...updatedNurse } : n
      )
    );
    setModal({ type: '', nurse: null });
  };

  const handleDeleteNurse = (id) => {
    setNurses(nurses.filter((n) => n.id !== id));
    setModal({ type: '', nurse: null });
  };

  // Dashboard cards
  const totalNurses = nurses.length;
  const activeNurses = nurses.filter(n => n.status === 'Active').length;
  const morningShift = nurses.filter(n => n.shift === 'Morning').length;
  const nightShift = nurses.filter(n => n.shift === 'Night').length;

  return (
    <div className="users-page">
      {/* Header */}
      <div className="users-header">
        <h1>Nurses</h1>
        <p>Manage registered nurses and their shifts.</p>
      </div>

      {/* Dashboard Cards */}
      <div className="users-cards">
        <div className="users-card">
          <h3>Total Nurses</h3>
          <span>{totalNurses}</span>
        </div>
        <div className="users-card">
          <h3>Active</h3>
          <span>{activeNurses}</span>
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
              <th>Shift</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  Loading nurses...
                </td>
              </tr>
            ) : filteredNurses.length > 0 ? (
              filteredNurses.map((n) => (
                <tr key={n.id}>
                  <td>{n.id}</td>
                  <td>{n.name}</td>
                  <td>{n.department}</td>
                  <td>{n.shift}</td>
                  <td>
                    <span className={`status ${n.status.toLowerCase()}`}>
                      {n.status}
                    </span>
                  </td>
                  <td className="table-actions">
                    <button
                      className="view-btn"
                      onClick={() =>
                        navigate(`/users/${n.id}`, { state: { role: 'Nurse' } })
                      }
                    >
                      View
                    </button>
                    <button className="edit-btn" onClick={() => openModal('edit', n)}>
                      Edit
                    </button>
                    <button className="delete-btn" onClick={() => openModal('delete', n)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="empty-state">
                  No nurses found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {modal.type === 'add' && (
        <NurseModal type="Add" onSave={handleAddNurse} onClose={() => openModal('', null)} />
      )}
      {modal.type === 'edit' && (
        <NurseModal type="Edit" nurse={modal.nurse} onSave={handleEditNurse} onClose={() => openModal('', null)} />
      )}
      {modal.type === 'delete' && (
        <DeleteModal
          nurse={modal.nurse}
          onDelete={() => handleDeleteNurse(modal.nurse.id)}
          onClose={() => openModal('', null)}
        />
      )}
    </div>
  );
};

/* ---------------- MODALS ---------------- */

const NurseModal = ({ type, nurse = {}, onSave, onClose }) => {
  const [form, setForm] = useState({
    id: nurse.id || '',
    name: nurse.name || '',
    department: nurse.department || '',
    shift: nurse.shift || 'Morning',
    status: nurse.status || 'Active',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{type} Nurse</h2>
        <input name="id" value={form.id} onChange={handleChange} placeholder="ID" />
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" />
        <input name="department" value={form.department} onChange={handleChange} placeholder="Department" />
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

const DeleteModal = ({ nurse, onDelete, onClose }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Delete Nurse</h2>
      <p>
        Delete <strong>{nurse.name}</strong>?
      </p>
      <div className="modal-actions">
        <button onClick={onDelete}>Delete</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  </div>
);

export default Nurses;
