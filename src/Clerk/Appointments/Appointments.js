import React, { useMemo, useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Appointments.css';
import { useApp } from '../context/AppContext';

const Appointments = () => {
  const {
    patients, doctors, appointments,
    patientById, doctorById,
    availableSlots, addAppointment, editAppointment, removeAppointment, genId
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [modal, setModal] = useState({ type: '', appointment: null, err: '' });

  // debounce search for smooth typing
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchTerm), 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return appointments.filter(a => {
      const patientName = patientById[a.patientId]?.name || '';
      const doctorName  = doctorById[a.doctorId]?.name  || '';
      const match =
        patientName.toLowerCase().includes(s) ||
        doctorName.toLowerCase().includes(s) ||
        a.date.includes(s);

      if (selectedDate) {
        return match && a.date === selectedDate;
      }
      return match;
    });
  }, [appointments, search, selectedDate, patientById, doctorById]);

  const slotsForDoctor = (doctorId) => {
    const day = selectedDate || new Date().toISOString().split('T')[0];
    return availableSlots(doctorId, day);
  };

  const openModal  = (type, appointment = null) => setModal({ type, appointment, err: '' });
  const closeModal = () => setModal({ type: '', appointment: null, err: '' });

  const handleSave = (form) => {
    try {
      if (modal.type === 'add') addAppointment(form);
      else editAppointment(form);
      closeModal();
    } catch (e) {
      setModal(m => ({ ...m, err: e.message || 'Failed to save appointment' }));
    }
  };

  const handleDelete = (id) => { removeAppointment(id); closeModal(); };

  return (
    <div className="appointments-page">
      <div className="appointments-header">
        <h2>Appointments</h2>
        <button
          className="add-btn"
          onClick={() =>
            openModal('add', {
              id: genId('A'),
              patientId: patients[0]?.id || '',
              doctorId: doctors[0]?.id || '',
              date: selectedDate || new Date().toISOString().split('T')[0],
              time: '',
              status: 'Scheduled',
            })
          }
        >
          Add Appointment
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-wrapper">
        <input
          className="search-input"
          placeholder="Search by patient, doctor or date..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Calendar + Slots */}
      <div className="appointments-calendar-section">
        <Calendar value={selectedDate ? new Date(selectedDate) : null} onChange={d => setSelectedDate(d.toISOString().split('T')[0])} className="calendar" />

        <div className="doctor-slots">
          <h3>Available Slots</h3>
          {doctors.map((doc) => {
            const slots = slotsForDoctor(doc.id);
            return (
              <div key={doc.id} className="doctor-slot">
                <strong>{doc.name}</strong>
                <div className="slots">
                  {slots.length ? slots.map(slot => (
                    <span
                      key={slot}
                      className="slot"
                      style={{ cursor: 'pointer' }}
                      title="Book this slot"
                      onClick={() =>
                        openModal('add', {
                          id: genId('A'),
                          patientId: patients[0]?.id || '',
                          doctorId: doc.id,
                          date: selectedDate || new Date().toISOString().split('T')[0],
                          time: slot,
                          status: 'Scheduled',
                        })
                      }
                    >
                      {slot}
                    </span>
                  )) : (
                    <span className="slot none">No slots available</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date filter */}
      <div className="appointments-filters">
        <div className="date-filter-wrapper">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button className="clear-date-btn" onClick={() => setSelectedDate('')} disabled={!selectedDate}>×</button>
        </div>
      </div>

      {/* Table */}
      <div className="appointments-table-wrapper">
        <table className="appointments-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? filtered.map(a => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>{patientById[a.patientId]?.name || '—'}</td>
                <td>{doctorById[a.doctorId]?.name || '—'}</td>
                <td>{a.date}</td>
                <td>{a.time}</td>
                <td><span className={`status ${a.status.toLowerCase()}`}>{a.status}</span></td>
                <td className="actions">
                  <button className="edit" onClick={() => openModal('edit', a)}>Edit</button>
                  <button className="delete" onClick={() => openModal('delete', a)}>Delete</button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="7" className="empty">No appointments found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {(modal.type === 'add' || modal.type === 'edit') && (
        <AppointmentModal
          type={modal.type}
          appointment={modal.appointment}
          onSave={handleSave}
          onClose={closeModal}
          patients={patients}
          doctors={doctors}
          availableSlots={availableSlots}
          errorMessage={modal.err}
        />
      )}
      {modal.type === 'delete' && (
        <DeleteModal
          appointment={modal.appointment}
          patientName={patientById[modal.appointment.patientId]?.name}
          doctorName={doctorById[modal.appointment.doctorId]?.name}
          onDelete={() => handleDelete(modal.appointment.id)}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

// ---------- Modals (unchanged) ----------
const AppointmentModal = ({ type, appointment = {}, onSave, onClose, patients, doctors, availableSlots, errorMessage }) => {
  const [form, setForm] = useState({
    id: appointment?.id || '',
    patientId: appointment?.patientId || patients[0]?.id || '',
    doctorId: appointment?.doctorId || doctors[0]?.id || '',
    date: appointment?.date || '',
    time: appointment?.time || '',
    status: appointment?.status || 'Scheduled',
  });

  const slots = useMemo(() => {
    if (!form.doctorId || !form.date) return [];
    return availableSlots(form.doctorId, form.date);
  }, [form.doctorId, form.date, availableSlots]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{type === 'add' ? 'Add' : 'Edit'} Appointment</h2>
        <label>Patient</label>
        <select name="patientId" value={form.patientId} onChange={handleChange}>
          {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <label>Doctor</label>
        <select name="doctorId" value={form.doctorId} onChange={handleChange}>
          {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <label>Date</label>
        <input type="date" name="date" value={form.date} onChange={handleChange} />

        <label>Time</label>
        <select name="time" value={form.time} onChange={handleChange}>
          <option value="">Select time</option>
          {slots.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <label>Status</label>
        <select name="status" value={form.status} onChange={handleChange}>
          <option>Scheduled</option>
          <option>Completed</option>
          <option>Cancelled</option>
        </select>

        {!!errorMessage && <div style={{ color: '#f44336', fontSize: 13, marginTop: 4 }}>{errorMessage}</div>}

        <div className="modal-actions">
          <button onClick={() => onSave(form)}>Save</button>
          <button className="secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const DeleteModal = ({ appointment, patientName, doctorName, onDelete, onClose }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Delete Appointment</h2>
      <p>Delete appointment for <strong>{patientName}</strong> with {doctorName} on {appointment.date}?</p>
      <div className="modal-actions">
        <button onClick={onDelete}>Delete</button>
        <button className="secondary" onClick={onClose}>Cancel</button>
      </div>
    </div>
  </div>
);

export default Appointments;
