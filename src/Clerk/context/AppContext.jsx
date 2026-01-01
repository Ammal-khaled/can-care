
// src/context/AppContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

/* ---------- Helpers ---------- */
const toISO = (d) => (d instanceof Date ? d.toISOString().split('T')[0] : d);
const genId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;

const LS = {
  patients: 'ls_patients',
  doctors: 'ls_doctors',
  nurses: 'ls_nurses',
  appointments: 'ls_appointments',
  doctorSlots: 'ls_doctor_slots',
};

/* ---------- Initial Data (you can edit these freely) ---------- */
const initialPatients = [
  { id: 'P-001', name: 'Ahmad Saleh', dob: '1979-05-12', status: 'In Treatment', gender: 'Male', phone: '0781234567', doctorId: 'D-001', nurseId: 'N-001' },
  { id: 'P-002', name: 'Sara Mahmoud', dob: '1993-08-21', status: 'Active',       gender: 'Female', phone: '0799876543', doctorId: 'D-002', nurseId: 'N-002' },
];

const initialDoctors = [
  { id: 'D-001', name: 'Dr. Omar Khaled', specialization: 'Oncology',   department: 'Dermatology', city: 'Amman', phone: '0781112223', dob: '1975-03-12' },
  { id: 'D-002', name: 'Dr. Lina Yousef', specialization: 'Hematology', department: 'Neurology',   city: 'Amman', phone: '0794445556', dob: '1980-09-28' },
];

const initialNurses = [
  { id: 'N-001', name: 'Nurse Hanan', department: 'Oncology',  phone: '0782223334', dob: '1985-06-10' },
  { id: 'N-002', name: 'Nurse Rania', department: 'Hematology', phone: '0795556667', dob: '1990-12-05' },
];

const initialAppointments = [
  { id: 'A-001', patientId: 'P-001', doctorId: 'D-001', date: '2025-12-20', time: '10:00 AM', status: 'Scheduled' },
  { id: 'A-002', patientId: 'P-002', doctorId: 'D-002', date: '2025-12-21', time: '02:00 PM', status: 'Completed' },
];

/* Template slots per doctor (by doctor name) */
const initialDoctorSlots = {
  'Dr. Omar Khaled': ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'],
  'Dr. Lina Yousef': ['10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '04:00 PM'],
};

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

/* ---------- Provider ---------- */
export const AppProvider = ({ children }) => {
  // State with localStorage persistence
  const [patients, setPatients] = useState(() => JSON.parse(localStorage.getItem(LS.patients) || 'null') || initialPatients);
  const [doctors,  setDoctors]  = useState(() => JSON.parse(localStorage.getItem(LS.doctors)  || 'null') || initialDoctors);
  const [nurses,   setNurses]   = useState(() => JSON.parse(localStorage.getItem(LS.nurses)   || 'null') || initialNurses);
  const [appointments, setAppointments] = useState(() => JSON.parse(localStorage.getItem(LS.appointments) || 'null') || initialAppointments);
  const [doctorSlots, setDoctorSlots]   = useState(() => JSON.parse(localStorage.getItem(LS.doctorSlots) || 'null') || initialDoctorSlots);

  useEffect(() => localStorage.setItem(LS.patients, JSON.stringify(patients)), [patients]);
  useEffect(() => localStorage.setItem(LS.doctors,  JSON.stringify(doctors)),  [doctors]);
  useEffect(() => localStorage.setItem(LS.nurses,   JSON.stringify(nurses)),   [nurses]);
  useEffect(() => localStorage.setItem(LS.appointments, JSON.stringify(appointments)), [appointments]);
  useEffect(() => localStorage.setItem(LS.doctorSlots,   JSON.stringify(doctorSlots)), [doctorSlots]);

  // Fast lookups
  const patientById = useMemo(() => Object.fromEntries(patients.map(p => [p.id, p])), [patients]);
  const doctorById  = useMemo(() => Object.fromEntries(doctors.map(d => [d.id, d])), [doctors]);
  const nurseById   = useMemo(() => Object.fromEntries(nurses.map(n => [n.id, n])),   [nurses]);

  // Availability helper (doctorId + dateISO) -> open slot names
  const availableSlots = (doctorId, dateISO) => {
    const doctor = doctorById[doctorId];
    if (!doctor) return [];
    const all = doctorSlots[doctor.name] || [];
    const taken = appointments
      .filter(a => a.doctorId === doctorId && a.date === toISO(dateISO))
      .map(a => a.time);
    return all.filter(s => !taken.includes(s));
  };

  // Double-booking guard
  const willClash = ({ id, doctorId, date, time }) =>
    appointments.some(a => a.doctorId === doctorId && a.date === toISO(date) && a.time === time && a.id !== id);

  /* ---------- CRUD ---------- */
  // Patients
  const addPatient    = (p) => setPatients(prev => [...prev, p.id ? p : { ...p, id: genId('P') }]);
  const editPatient   = (p) => setPatients(prev => prev.map(x => x.id === p.id ? p : x));
  const deletePatient = (id) => setPatients(prev => prev.filter(x => x.id !== id));

  // Doctors
  const addDoctor     = (d) => setDoctors(prev => [...prev, d.id ? d : { ...d, id: genId('D') }]);
  const editDoctor    = (d) => setDoctors(prev => prev.map(x => x.id === d.id ? d : x));
  const deleteDoctor  = (id) => setDoctors(prev => prev.filter(x => x.id !== id));

  // Nurses
  const addNurse      = (n) => setNurses(prev => [...prev, n.id ? n : { ...n, id: genId('N') }]);
  const editNurse     = (n) => setNurses(prev => prev.map(x => x.id === n.id ? n : x));
  const deleteNurse   = (id) => setNurses(prev => prev.filter(x => x.id !== id));

  // Appointments
  const addAppointment   = (a) => {
    const appt = a.id ? a : { ...a, id: genId('A') };
    if (willClash(appt)) throw new Error('This slot is already booked for the selected doctor.');
    setAppointments(prev => [appt, ...prev]);
  };
  const editAppointment  = (a) => {
    if (willClash(a)) throw new Error('This slot is already booked for the selected doctor.');
    setAppointments(prev => prev.map(x => x.id === a.id ? a : x));
  };
  const removeAppointment = (id) => setAppointments(prev => prev.filter(x => x.id !== id));

  const api = {
    // data
    patients, doctors, nurses, appointments, doctorSlots,
    // lookups
    patientById, doctorById, nurseById,
    // helpers
    availableSlots, genId,
    // CRUD
    addPatient, editPatient, deletePatient,
    addDoctor,  editDoctor,  deleteDoctor,
    addNurse,   editNurse,   deleteNurse,
    addAppointment, editAppointment, removeAppointment,
  };

  return <AppContext.Provider value={api}>{children}</AppContext.Provider>;
};
