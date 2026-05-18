// src/pages/Appointments.js
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import './style/Appointments.css';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const Appointments = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const handledActionRef = useRef('');
 
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    searchParams.get('filter') === 'today' ? new Date() : null
  );

  const [appointments, setAppointments] = useState([
    {
      id: 'A-001',
      patient: 'Ahmad Saleh',
      doctor: 'Dr. Omar Khaled',
      date: '2025-12-20',
      time: '10:00 AM',
      status: 'Pending',
    },
    {
      id: 'A-002',
      patient: 'Sara Mahmoud',
      doctor: 'Dr. Lina Yousef',
      date: '2025-12-21',
      time: '02:00 PM',
      status: 'Confirmed',
    },
  ]);

  const [modal, setModal] = useState({ type: '', appointment: null });

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  useEffect(() => {
    if (searchParams.get('filter') === 'today') {
      setSelectedDate(new Date());
    }
    if (searchParams.get('status')) {
      setSelectedDate(null);
    }

    const actionKey = searchParams.toString();
    if (searchParams.get('action') === 'book' && handledActionRef.current !== actionKey) {
      handledActionRef.current = actionKey;
      setSelectedDate(searchParams.get('date') ? new Date(searchParams.get('date')) : new Date());
      openModal('add', {
        doctor: searchParams.get('doctor') || '',
        date: searchParams.get('date') || new Date().toISOString().split('T')[0],
        status: 'Pending',
      });
    }
  }, [searchParams]);

 
  // Calendar selection filter
const filteredAppointments = appointments.filter(
  (a) =>
    (a.patient.toLowerCase().includes(search.toLowerCase()) ||
      a.doctor.toLowerCase().includes(search.toLowerCase()) ||
      a.date.includes(search)) &&
    (!selectedDate || new Date(a.date).toDateString() === selectedDate.toDateString()) &&
    (!searchParams.get('status') || a.status.toLowerCase() === searchParams.get('status').toLowerCase())
);


  const nextAppointments = appointments
    .filter(a => new Date(a.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  const openModal = (type, appointment = null) => {
    setModal({ type, appointment });
  };

  const activeFilterLabel =
    searchParams.get('filter') === 'today'
      ? 'Today'
      : searchParams.get('status') === 'cancelled'
        ? 'Cancelled'
        : searchParams.get('action') === 'book'
          ? 'Booking context'
          : '';

  const clearWorkflowFilter = () => {
    setSearchParams({});
    setSearch('');
    setSelectedDate(null);
  };

  const handleSaveAppointment = (appt) => {
    if (modal.type === 'add') {
      setAppointments([...appointments, appt]);
    } else if (modal.type === 'edit') {
      setAppointments((prev) =>
        prev.map((a) => (a.id === appt.id ? { ...a, ...appt } : a))
      );
    }
    setModal({ type: '', appointment: null });
  };

  const handleDeleteAppointment = (id) => {
    setAppointments(appointments.filter((a) => a.id !== id));
    setModal({ type: '', appointment: null });
  };

  return (
    <div className="appointments-page">
      <h1>Appointments</h1>
      <p>Manage all appointments for patients and doctors.</p>

      {/* Actions */}
      <div className="appointments-actions">
        <input
          type="text"
          placeholder="Search by patient, doctor, or date"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={() => openModal('add')}>Add Appointment</button>
      </div>

      {activeFilterLabel && (
        <div className="workflow-filter-chip appointments-filter-chip">
          <span>Filtered by: {activeFilterLabel}</span>
          <button type="button" onClick={clearWorkflowFilter}>Clear filter</button>
        </div>
      )}

      {/* Calendar & Next Appointments */}
      <div className="appointments-calendar-section">
        <Calendar
          value={selectedDate}
          onChange={setSelectedDate}
          className="calendar"
        />
        <div className="next-appointments">
          <h3>Next Appointments</h3>
          {nextAppointments.length > 0 ? (
            <ul>
              {nextAppointments.map((a) => (
                <li key={a.id}>
                  <strong>{a.patient}</strong> with {a.doctor} <br />
                  {a.date} at {a.time} - <span className={`status ${a.status.toLowerCase()}`}>{a.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No upcoming appointments</p>
          )}
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
            {loading ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  Loading appointments...
                </td>
              </tr>
            ) : filteredAppointments.length > 0 ? (
              filteredAppointments.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.patient}</td>
                  <td>{a.doctor}</td>
                  <td>{a.date}</td>
                  <td>{a.time}</td>
                  <td>
                    <span className={`status ${a.status.toLowerCase()}`}>{a.status}</span>
                  </td>
                  <td>
                    <button onClick={() => openModal('edit', a)}>Edit</button>
                    <button onClick={() => openModal('delete', a)}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="empty-state">
                  No appointments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {modal.type === 'add' || modal.type === 'edit' ? (
        <AppointmentModal
          type={modal.type}
          appointment={modal.appointment}
          onSave={handleSaveAppointment}
          onClose={() => openModal('', null)}
        />
      ) : null}

      {modal.type === 'delete' && (
        <DeleteModal
          appointment={modal.appointment}
          onDelete={() => handleDeleteAppointment(modal.appointment.id)}
          onClose={() => openModal('', null)}
        />
      )}
    </div>
  );
};

/* ---------------- MODALS ---------------- */

const AppointmentModal = ({ type, appointment = {}, onSave, onClose }) => {
  const appt = appointment || {};
  const [form, setForm] = useState({
    id: appt.id || `A-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    patient: appt.patient || '',
    doctor: appt.doctor || '',
    date: appt.date || '',
    time: appt.time || '',
    status: appt.status || 'Pending',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{type === 'add' ? 'Add' : 'Edit'} Appointment</h2>
        <input name="patient" value={form.patient} onChange={handleChange} placeholder="Patient Name" />
        <input name="doctor" value={form.doctor} onChange={handleChange} placeholder="Doctor Name" />
        <input type="date" name="date" value={form.date} onChange={handleChange} />
        <input type="time" name="time" value={form.time} onChange={handleChange} />
        <select name="status" value={form.status} onChange={handleChange}>
          <option>Pending</option>
          <option>Confirmed</option>
          <option>Completed</option>
          <option>Cancelled</option>
        </select>
        <div className="modal-actions">
          <button onClick={() => onSave(form)}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const DeleteModal = ({ appointment, onDelete, onClose }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Delete Appointment</h2>
      <p>
        Delete <strong>{appointment.patient}</strong> with {appointment.doctor} on {appointment.date}?
      </p>
      <div className="modal-actions">
        <button onClick={onDelete}>Delete</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  </div>
);

export default Appointments;
