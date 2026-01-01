
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
const Doctors = () => {
  const { doctors, patients, appointments, nurses, addDoctor, editDoctor, deleteDoctor } = useApp();

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ type: '', doctor: null, warn: '' });

  // NEW: in-page patient details modal state
  const [viewPatient, setViewPatient] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const filteredDoctors = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return doctors;
    return doctors.filter(d =>
      d.name?.toLowerCase().includes(s) ||
      d.id?.toLowerCase().includes(s) ||
      (d.specialization || d.specialty || '').toLowerCase().includes(s)
    );
  }, [doctors, search]);

  const countPatientsFor = (doc) => {
    const byId   = patients.filter(p => p.doctorId === doc.id).length;
    const legacy = patients.filter(p => !p.doctorId && p.doctorName === doc.name).length;
    return byId + legacy;
  };
  const countAppointmentsFor = (doc) => {
    const byId   = appointments.filter(a => a.doctorId === doc.id).length;
    const legacy = appointments.filter(a => !a.doctorId && a.doctor === doc.name).length;
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

  const handleAddDoctor = (d) => { addDoctor(d); setModal({ type: '', doctor: null, warn: '' }); };
  const handleEditDoctor = (d) => { editDoctor(d); setModal({ type: '', doctor: null, warn: '' }); };
  const handleDeleteDoctor = (id) => {
    const doc = doctors.find(x => x.id === id);
    const pc = countPatientsFor(doc);
    const ac = countAppointmentsFor(doc);
    if (pc > 0 || ac > 0) {
      setModal(m => ({ ...m, warn: `Cannot delete. This doctor still has ${pc} patient(s) and ${ac} appointment(s).` }));
      return;
    }
    deleteDoctor(id);
    setModal({ type: '', doctor: null, warn: '' });
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <h1>Doctors</h1>
        <p>Manage doctors and see their specialties and patient count.</p>
      </div>

      <div className="users-actions">
        <input
          type="text"
          placeholder="Search by name, ID, or specialty"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="add-btn" onClick={() => setModal({ type: 'add', doctor: null, warn: '' })}>+ Add Doctor</button>
      </div>

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr><th>ID</th><th>Name</th><th>Specialty</th><th>Patients</th><th>Phone</th><th>Actions</th></tr>
          </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="6" className="empty-state">Loading...</td></tr>
          ) : filteredDoctors.length ? (
            filteredDoctors.map(d => (
              <tr key={d.id}>
                <td>{d.id}</td><td>{d.name}</td>
                <td>{d.specialization || d.specialty || '—'}</td>
                <td>{countPatientsFor(d)}</td>
                <td>{d.phone || '—'}</td>
                <td className="table-actions">
                  <button className="view-btn"  onClick={() => setModal({ type: 'view', doctor: d, warn: '' })}>View</button>
                  <button className="edit-btn"  onClick={() => setModal({ type: 'edit', doctor: d, warn: '' })}>Edit</button>
                  <button className="delete-btn" onClick={() => setModal({ type: 'delete', doctor: d, warn: '' })}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="6" className="empty-state">No doctors found</td></tr>
          )}
        </tbody>
        </table>
      </div>

      {(modal.type === 'add' || modal.type === 'edit') && (
        <DoctorModal
          type={modal.type}
          doctor={modal.doctor}
          onSave={modal.type === 'add' ? handleAddDoctor : handleEditDoctor}
          onClose={() => setModal({ type: '', doctor: null, warn: '' })}
        />
      )}

      {modal.type === 'view' && (
        <ViewDoctorModal
          doctor={modal.doctor}
          patientsForDoctor={[
            ...patients.filter(p => p.doctorId === modal.doctor.id),
            ...patients.filter(p => !p.doctorId && p.doctorName === modal.doctor.name),
          ]}
          appointmentCount={countAppointmentsFor(modal.doctor)}
          onClose={() => setModal({ type: '', doctor: null, warn: '' })}
          // NEW: clean callback to open patient modal instead of navigate
          onPatientClick={(p) => setViewPatient(p)}
        />
      )}

      {modal.type === 'delete' && (
        <DeleteDoctorModal
          doctor={modal.doctor}
          inUsePatients={countPatientsFor(modal.doctor)}
          inUseAppointments={countAppointmentsFor(modal.doctor)}
          warn={modal.warn}
          onDelete={() => handleDeleteDoctor(modal.doctor.id)}
          onClose={() => setModal({ type: '', doctor: null, warn: '' })}
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
const DoctorModal = ({ type, doctor, onSave, onClose }) => {
  const isEdit = type === 'edit';
  const [form, setForm] = useState({
    id: isEdit ? doctor?.id : '',
    name: isEdit ? doctor?.name : '',
    specialization: isEdit ? (doctor?.specialization || doctor?.specialty || '') : '',
    department: isEdit ? (doctor?.department || '') : '',
    city: isEdit ? (doctor?.city || '') : '',
    phone: isEdit ? (doctor?.phone || '') : '',
    dob: isEdit ? (doctor?.dob || '') : '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const validPhone = (p) => (!p || /^\d{9,12}$/.test(p));
  const handleSave = () => {
    if (!form.name.trim()) return alert('Doctor name is required.');
    if (!form.specialization.trim()) return alert('Specialization is required.');
    if (!validPhone(form.phone)) return alert('Phone must be 9–12 digits.');
    const payload = {
      id: form.id,
      name: form.name.trim(),
      specialization: form.specialization.trim(),
      specialty: form.specialization.trim(), // compatibility
      department: form.department?.trim() || '',
      city: form.city?.trim() || '',
      phone: form.phone?.trim() || '',
      dob: form.dob || '',
    };
    onSave(payload);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{isEdit ? 'Edit Doctor' : 'Add Doctor'}</h2>
        {isEdit && <input value={form.id} disabled />}
        <input name="name"           placeholder="Full Name"          value={form.name}           onChange={handleChange} />
        <input name="specialization" placeholder="Specialization"     value={form.specialization} onChange={handleChange} />
        <input name="department"     placeholder="Department (optional)" value={form.department} onChange={handleChange} />
        <input name="city"           placeholder="City (optional)"       value={form.city}       onChange={handleChange} />
        <input name="phone"          placeholder="Phone (9–12 digits)"   value={form.phone}      onChange={handleChange} />
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

const ViewDoctorModal = ({ doctor, patientsForDoctor, appointmentCount, onClose, onPatientClick }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Doctor Details</h2>
      <p><strong>ID:</strong> {doctor.id}</p>
      <p><strong>Name:</strong> {doctor.name}</p>
      <p><strong>Specialization:</strong> {doctor.specialization || doctor.specialty || '—'}</p>
      <p><strong>Department:</strong> {doctor.department || '—'}</p>
      <p><strong>City:</strong> {doctor.city || '—'}</p>
      <p><strong>Phone:</strong> {doctor.phone || '—'}</p>
      <p><strong>DOB:</strong> {doctor.dob || '—'} {doctor.dob ? `(${calculateAge(doctor.dob)} yrs)` : ''}</p>
      <p><strong>Patients:</strong> {patientsForDoctor.length}</p>
      <p><strong>Appointments:</strong> {appointmentCount}</p>

      {!!patientsForDoctor.length && (
        <ul style={{ marginTop: 8 }}>
          {patientsForDoctor.map(p => (
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

const DeleteDoctorModal = ({ doctor, inUsePatients, inUseAppointments, warn, onDelete, onClose }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Delete Doctor</h2>
      <p>Delete <strong>{doctor.name}</strong> ({doctor.id})?</p>
      {(inUsePatients > 0 || inUseAppointments > 0) && (
        <p style={{ color: '#b54708', background: '#fff6e6', padding: '8px 10px', borderRadius: 8 }}>
          {warn || `This doctor has ${inUsePatients} patient(s) and ${inUseAppointments} appointment(s). Reassign or remove them first.`}
        </p>
      )}
      <div className="modal-actions">
        <button className="danger" onClick={onDelete} disabled={inUsePatients > 0 || inUseAppointments > 0}>Delete</button>
        <button className="secondary" onClick={onClose}>Cancel</button>
      </div>
    </div>
  </div>
);

export default Doctors;
