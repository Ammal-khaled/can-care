
import React, { useEffect, useMemo, useState } from 'react';
import './Users.css';
import { useApp } from '../context/AppContext';

/* ---------- Utilities ---------- */
const calculateAge = (dob) => {
  if (!dob) return '—';
  const d = new Date(dob); if (isNaN(d)) return '—';
  const t = new Date();
  let a = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--;
  return a;
};

/* ---------- Small patient view modal (inline) ---------- */
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

/* ---------- Page ---------- */
const Nurses = () => {
  const { nurses, patients, doctors, addNurse, editNurse, deleteNurse } = useApp(); // include doctors for name resolution

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ type: '', nurse: null, warn: '' });

  // NEW: in-page patient details modal state
  const [viewPatient, setViewPatient] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const filteredNurses = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return nurses;
    return nurses.filter(n =>
      n.name?.toLowerCase().includes(s) ||
      n.id?.toLowerCase().includes(s) ||
      (n.department || '').toLowerCase().includes(s)
    );
  }, [nurses, search]);

  const countPatientsFor = (nurse) => {
    const byId   = patients.filter(p => p.nurseId === nurse.id).length;
    const legacy = patients.filter(p => !p.nurseId && p.nurseName === nurse.name).length;
    return byId + legacy;
  };

  // Resolve names for PatientViewModal
  const resolveDoctorName = (p) => {
    if (p?.doctorId) {
      const d = doctors.find(doc => doc.id === p.doctorId);
      if (d?.name) return d.name;
    }
    return p?.doctorName || p?.doctor || '—';
  };
  const resolveNurseName = (p) => {
    if (p?.nurseId) {
      const n = nurses.find(nu => nu.id === p.nurseId);
      if (n?.name) return n.name;
    }
    return p?.nurseName || '—';
  };

  const handleAddNurse   = (n) => { addNurse(n); setModal({ type: '', nurse: null, warn: '' }); };
  const handleEditNurse  = (n) => { editNurse(n); setModal({ type: '', nurse: null, warn: '' }); };
  const handleDeleteNurse = (id) => {
    const nu = nurses.find(x => x.id === id);
    const pc = countPatientsFor(nu);
    if (pc > 0) {
      setModal(m => ({ ...m, warn: `Cannot delete. This nurse still has ${pc} assigned patient(s).` }));
      return;
    }
    deleteNurse(id);
    setModal({ type: '', nurse: null, warn: '' });
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <h1>Nurses</h1>
        <p>Manage nurses and see the number of patients under them.</p>
      </div>

      <div className="users-actions">
        <input
          type="text"
          placeholder="Search by name, ID, or department"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="add-btn" onClick={() => setModal({ type: 'add', nurse: null, warn: '' })}>+ Add Nurse</button>
      </div>

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr><th>ID</th><th>Name</th><th>Department</th><th>Patients</th><th>Phone</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="empty-state">Loading...</td></tr>
            ) : filteredNurses.length ? (
              filteredNurses.map(n => (
                <tr key={n.id}>
                  <td>{n.id}</td><td>{n.name}</td><td>{n.department || '—'}</td>
                  <td>{countPatientsFor(n)}</td>
                  <td>{n.phone || '—'}</td>
                  <td className="table-actions">
                    <button className="view-btn"  onClick={() => setModal({ type: 'view', nurse: n, warn: '' })}>View</button>
                    <button className="edit-btn"  onClick={() => setModal({ type: 'edit', nurse: n, warn: '' })}>Edit</button>
                    <button className="delete-btn" onClick={() => setModal({ type: 'delete', nurse: n, warn: '' })}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" className="empty-state">No nurses found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {(modal.type === 'add' || modal.type === 'edit') && (
        <NurseModal
          type={modal.type}
          nurse={modal.nurse}
          onSave={modal.type === 'add' ? handleAddNurse : handleEditNurse}
          onClose={() => setModal({ type: '', nurse: null, warn: '' })}
        />
      )}

      {modal.type === 'view' && (
        <ViewNurseModal
          nurse={modal.nurse}
          patientsForNurse={[
            ...patients.filter(p => p.nurseId === modal.nurse.id),
            ...patients.filter(p => !p.nurseId && p.nurseName === modal.nurse.name),
          ]}
          onClose={() => setModal({ type: '', nurse: null, warn: '' })}
          // NEW: clean callback to open patient modal instead of navigate
          onPatientClick={(p) => setViewPatient(p)}
        />
      )}

      {modal.type === 'delete' && (
        <DeleteNurseModal
          nurse={modal.nurse}
          inUsePatients={countPatientsFor(modal.nurse)}
          warn={modal.warn}
          onDelete={() => handleDeleteNurse(modal.nurse.id)}
          onClose={() => setModal({ type: '', nurse: null, warn: '' })}
        />
      )}

      {/* In-page Patient View (no redirect) */}
      {viewPatient && (
        <PatientViewModal
          patient={viewPatient}
          doctorName={resolveDoctorName(viewPatient)}
          nurseName={resolveNurseName(viewPatient)}
          onClose={() => setViewPatient(null)}
        />
      )}
    </div>
  );
};

/* -------- Modals -------- */
const NurseModal = ({ type, nurse, onSave, onClose }) => {
  const isEdit = type === 'edit';
  const [form, setForm] = useState({
    id: isEdit ? nurse?.id : '',
    name: isEdit ? nurse?.name : '',
    department: isEdit ? (nurse?.department || '') : '',
    phone: isEdit ? (nurse?.phone || '') : '',
    dob: isEdit ? (nurse?.dob || '') : '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const validPhone = (p) => (!p || /^\d{9,12}$/.test(p));
  const handleSave = () => {
    if (!form.name.trim()) return alert('Nurse name is required.');
    if (!form.department.trim()) return alert('Department is required.');
    if (!validPhone(form.phone)) return alert('Phone must be 9–12 digits.');
    const payload = { id: form.id, name: form.name.trim(), department: form.department.trim(), phone: form.phone?.trim() || '', dob: form.dob || '' };
    onSave(payload);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{isEdit ? 'Edit Nurse' : 'Add Nurse'}</h2>
        {isEdit && <input value={form.id} disabled />}
        <input name="name"       placeholder="Full Name"        value={form.name}       onChange={handleChange} />
        <input name="department" placeholder="Department/Shift" value={form.department} onChange={handleChange} />
        <input name="phone"      placeholder="Phone (9–12 digits)" value={form.phone} onChange={handleChange} />
        <label>Date of Birth (optional)</label>
        <input type="date" name="dob" value={form.dob} onChange={handleChange} />
        <div className="modal-actions">
          <button onClick={handleSave}>{isEdit ? 'Save' : 'Add'}</button>
          <button className="secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const ViewNurseModal = ({ nurse, patientsForNurse, onClose, onPatientClick }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Nurse Details</h2>
      <p><strong>ID:</strong> {nurse.id}</p>
      <p><strong>Name:</strong> {nurse.name}</p>
      <p><strong>Department:</strong> {nurse.department || '—'}</p>
      <p><strong>Phone:</strong> {nurse.phone || '—'}</p>
      <p><strong>DOB:</strong> {nurse.dob || '—'} {nurse.dob ? `(${calculateAge(nurse.dob)} yrs)` : ''}</p>
      <p><strong>Patients Assigned:</strong> {patientsForNurse.length}</p>

      {!!patientsForNurse.length && (
        <ul>
          {patientsForNurse.map(p => (
            <li key={p.id}>
              {/* Open the small patient view modal in the same page */}
              <button className="link-btn" onClick={() => onPatientClick(p)}>
                {p.name} ({p.id})
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="modal-actions">
        <button className="secondary" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

const DeleteNurseModal = ({ nurse, inUsePatients, warn, onDelete, onClose }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Delete Nurse</h2>
      <p>Delete <strong>{nurse.name}</strong> ({nurse.id})?</p>
      {inUsePatients > 0 && (
        <p style={{ color: '#b54708', background: '#fff6e6', padding: '8px 10px', borderRadius: 8 }}>
          {warn || `This nurse has ${inUsePatients} patient(s). Reassign or remove them first.`}
        </p>
      )}
      <div className="modal-actions">
        <button className="danger" onClick={onDelete} disabled={inUsePatients > 0}>Delete</button>
        <button className="secondary" onClick={onClose}>Cancel</button>
      </div>
    </div>
  </div>
);

export default Nurses;
