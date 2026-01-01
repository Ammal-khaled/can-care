import React, { useMemo, useState, useEffect } from 'react';
import './Users.css';
import { useApp } from '../context/AppContext';

const calculateAge = (dob) => {
  if (!dob) return '-';
  const d = new Date(dob); if (isNaN(d)) return '-';
  const t = new Date();
  let a = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--;
  return a;
};

const Patients = () => {
  const {
    patients, doctors, nurses, doctorById, addPatient, editPatient, deletePatient,
  } = useApp();

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ type: '', patient: null });

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const filteredPatients = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return patients;
    return patients.filter(p => p.name?.toLowerCase().includes(s) || p.id?.toLowerCase().includes(s));
  }, [patients, search]);

  const docName  = (p) => p.doctorId ? (doctorById[p.doctorId]?.name || '—') : '—';
  const nurseName = (p) => p.nurseId ? (nurses.find(n => n.id === p.nurseId)?.name || '—') : '—';

  const handleAddPatient  = (patient) => { addPatient(patient);  setModal({ type: '', patient: null }); };
  const handleEditPatient = (patient) => { editPatient(patient); setModal({ type: '', patient: null }); };
  const handleDeletePatient = (id) => { deletePatient(id);      setModal({ type: '', patient: null }); };

  return (
    <div className="users-page">
      <div className="users-header">
        <h1>Patients</h1>
        <p>Manage registered patients and access their medical profiles.</p>
      </div>

      <div className="users-actions">
        <input
          type="text"
          placeholder="Search by name or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="add-btn" onClick={() => setModal({ type: 'add', patient: null })}>+ Add Patient</button>
      </div>

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>Age</th><th>Status</th><th>Doctor</th><th>Nurse</th><th>Phone</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="empty-state">Loading...</td></tr>
            ) : filteredPatients.length ? (
              filteredPatients.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{calculateAge(p.dob)}</td>
                  <td><span className={`status ${String(p.status || 'Unknown').toLowerCase().replace(/\s+/g,'-')}`}>{p.status || 'Unknown'}</span></td>
                  <td>{docName(p)}</td>
                  <td>{nurseName(p)}</td>
                  <td>{p.phone || '—'}</td>
                  <td className="table-actions">
                    <button className="view-btn"  onClick={() => setModal({ type: 'view', patient: p })}>View</button>
                    <button className="edit-btn"  onClick={() => setModal({ type: 'edit', patient: p })}>Edit</button>
                    <button className="delete-btn" onClick={() => setModal({ type: 'delete', patient: p })}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="8" className="empty-state">No patients found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {(modal.type === 'add' || modal.type === 'edit') && (
        <PatientModal
          type={modal.type}
          patient={modal.patient}
          doctors={doctors}
          nurses={nurses}
          onSave={modal.type === 'add' ? handleAddPatient : handleEditPatient}
          onClose={() => setModal({ type: '', patient: null })}
        />
      )}

      {modal.type === 'view' && (
        <PatientViewModal
          patient={modal.patient}
          doctorName={docName(modal.patient)}
          nurseName={nurseName(modal.patient)}
          onClose={() => setModal({ type: '', patient: null })}
        />
      )}

      {modal.type === 'delete' && (
        <DeleteModal
          patient={modal.patient}
          onDelete={() => handleDeletePatient(modal.patient.id)}
          onClose={() => setModal({ type: '', patient: null })}
        />
      )}
    </div>
  );
};

/* -------- Modals -------- */
const PatientModal = ({ type, patient, doctors, nurses, onSave, onClose }) => {
  const isEdit = type === 'edit';
  const [form, setForm] = useState({
    id: isEdit ? patient?.id : '',
    name: isEdit ? patient?.name : '',
    dob: isEdit ? patient?.dob : '',
    status: isEdit ? (patient?.status || 'Active') : 'Active',
    gender: isEdit ? (patient?.gender || '') : '',
    phone: isEdit ? (patient?.phone || '') : '',
    doctorId: isEdit ? (patient?.doctorId || doctors[0]?.id || '') : (doctors[0]?.id || ''),
    nurseId: isEdit ? (patient?.nurseId || nurses[0]?.id || '')   : (nurses[0]?.id || ''),
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSave = () => {
    if (!form.name.trim()) return alert('Name is required.');
    if (!form.doctorId)    return alert('Please select a doctor.');
    if (!form.nurseId)     return alert('Please select a nurse.');
    onSave(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{isEdit ? 'Edit Patient' : 'Add Patient'}</h2>
        {isEdit && <input value={form.id} disabled />}
        <input name="name"  placeholder="Full Name" value={form.name}  onChange={handleChange} />
        <label>Date of Birth</label>
        <input type="date" name="dob" value={form.dob} onChange={handleChange} />
        <label>Status</label>
        <select name="status" value={form.status} onChange={handleChange}>
          <option>Active</option><option>In Treatment</option><option>Recovered</option><option>Discharged</option><option>Unknown</option>
        </select>
        <label>Gender</label>
        <select name="gender" value={form.gender} onChange={handleChange}>
          <option value="">Select Gender</option><option>Female</option><option>Male</option>
        </select>
        <input name="phone"  placeholder="Phone" value={form.phone}  onChange={handleChange} />
        <label>Doctor</label>
        <select name="doctorId" value={form.doctorId} onChange={handleChange}>
          {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <label>Nurse</label>
        <select name="nurseId" value={form.nurseId} onChange={handleChange}>
          {nurses.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
        </select>
        <div className="modal-actions">
          <button onClick={handleSave}>{isEdit ? 'Save' : 'Add'}</button>
          <button className="secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const PatientViewModal = ({ patient, doctorName, nurseName, onClose }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Patient Details</h2>
      <p><strong>ID:</strong> {patient.id}</p>
      <p><strong>Name:</strong> {patient.name}</p>
      <p><strong>Age:</strong> {calculateAge(patient.dob)}</p>
      <p><strong>Status:</strong> {patient.status || 'Unknown'}</p>
      <p><strong>Gender:</strong> {patient.gender || '—'}</p>
      <p><strong>Phone:</strong> {patient.phone || '—'}</p>
      <p><strong>Doctor:</strong> {doctorName}</p>
      <p><strong>Nurse:</strong> {nurseName}</p>
      <div className="modal-actions">
        <button className="secondary" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

const DeleteModal = ({ patient, onDelete, onClose }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Delete Patient</h2>
      <p>Delete <strong>{patient.name}</strong> ({patient.id})?</p>
      <div className="modal-actions">
        <button className="danger" onClick={onDelete}>Delete</button>
        <button className="secondary" onClick={onClose}>Cancel</button>
      </div>
    </div>
  </div>
);

export default Patients;
