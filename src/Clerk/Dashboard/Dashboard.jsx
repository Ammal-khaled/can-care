
// === Top-level imports (working & necessary) ===
import React, { useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./Dashboard.css";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// === Mock data & helpers ===
const doctorSlots = {
  "Dr. Omar Khaled": ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM"],
  "Dr. Lina Yousef": ["10:00 AM", "11:00 AM", "01:00 PM", "03:00 PM"],
};

const initialAppointments = [
  {
    id: "A-001",
    patient: "Ahmad Saleh",
    doctor: "Dr. Omar Khaled",
    date: "2025-12-20",
    time: "10:00 AM",
    status: "Scheduled",
  },
];

const initialPatients = [
  { id: "P-001", name: "Ahmad Saleh", phone: "0790000001" },
  { id: "P-002", name: "Sara Mahmoud", phone: "0790000002" },
];

const initialDoctors = [
  {
    id: "D-001",
    name: "Dr. Omar Khaled",
    department: "Dermatology",
    city: "Amman",
    specialization: "Dermatology",
  },
  {
    id: "D-002",
    name: "Dr. Lina Yousef",
    department: "Neurology",
    city: "Amman",
    specialization: "Neurology",
  },
];

const initialNurses = [
  { id: "N-001", name: "Nurse Rania", department: "Dermatology" },
  { id: "N-002", name: "Nurse Yara", department: "Neurology" },
];

// Waitlist & Transfer initial data
const initialWaitlist = [];
const initialTransfers = [];

// LocalStorage keys
const LS = {
  A: "ls_appts",
  P: "ls_patients",
  D: "ls_doctors",
  N: "ls_nurses",
  C: "ls_clerk",
  W: "ls_waitlist",
  T: "ls_transfers",
};

// Utility helpers
const genId = (p) => `${p}-${Math.random().toString(36).slice(2, 6)}`;
const fmtDay = (d) => d?.toISOString().split("T")[0];
const parseISO = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const inRange = (dateStr, start, end) => {
  const d = parseISO(dateStr);
  return (!start || d >= start) && (!end || d <= end);
};

// Age helpers
const calculateAge = (dob) => {
  if (!dob) return "—";
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};
const calcAge = (dob) => calculateAge(dob);

// === Main localStorage-based dashboard ===
const ClerkDashboardModern = () => {
  // State with persistence
  const [appointments, setAppointments] = useState(
    () => JSON.parse(localStorage.getItem(LS.A) ?? "null") ?? initialAppointments
  );
  const [patients, setPatients] = useState(
    () => JSON.parse(localStorage.getItem(LS.P) ?? "null") ?? initialPatients
  );
  const [doctors, setDoctors] = useState(
    () => JSON.parse(localStorage.getItem(LS.D) ?? "null") ?? initialDoctors
  );
  const [nurses, setNurses] = useState(
    () => JSON.parse(localStorage.getItem(LS.N) ?? "null") ?? initialNurses
  );
  const [clerk, setClerk] = useState(
    () =>
      JSON.parse(localStorage.getItem(LS.C) ?? "null") ?? {
        name: "Clinic Clerk",
        email: "clerk@example.com",
        phone: "0790000000",
      }
  );
  const [waitlist, setWaitlist] = useState(
    () => JSON.parse(localStorage.getItem(LS.W) ?? "null") ?? initialWaitlist
  );
  const [transfers, setTransfers] = useState(
    () => JSON.parse(localStorage.getItem(LS.T) ?? "null") ?? initialTransfers
  );

  // Persist
  useEffect(() => localStorage.setItem(LS.A, JSON.stringify(appointments)), [appointments]);
  useEffect(() => localStorage.setItem(LS.P, JSON.stringify(patients)), [patients]);
  useEffect(() => localStorage.setItem(LS.D, JSON.stringify(doctors)), [doctors]);
  useEffect(() => localStorage.setItem(LS.N, JSON.stringify(nurses)), [nurses]);
  useEffect(() => localStorage.setItem(LS.C, JSON.stringify(clerk)), [clerk]);
  useEffect(() => localStorage.setItem(LS.W, JSON.stringify(waitlist)), [waitlist]);
  useEffect(() => localStorage.setItem(LS.T, JSON.stringify(transfers)), [transfers]);

  // Calendar & timeframe
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dayStr = fmtDay(selectedDate);
  const [timeframe, setTimeframe] = useState("7d"); // today, 7d, 30d, all, custom
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const makeOffset = (days) => new Date(todayStart.getTime() - days * 86400000);
  let rangeStart = null,
    rangeEnd = null;
  if (timeframe === "today") {
    rangeStart = todayStart;
    rangeEnd = new Date(todayStart.getTime() + 86399999);
  } else if (timeframe === "7d") {
    rangeStart = makeOffset(6);
    rangeEnd = new Date(todayStart.getTime() + 86399999);
  } else if (timeframe === "30d") {
    rangeStart = makeOffset(29);
    rangeEnd = new Date(todayStart.getTime() + 86399999);
  } else if (timeframe === "custom") {
    rangeStart = customStart ? parseISO(customStart) : null;
    rangeEnd = customEnd ? parseISO(customEnd) : null;
  }

  // Filters
  const [filters, setFilters] = useState({ specialization: "", city: "", date: "" });

  const filteredDoctors = useMemo(() => {
    return doctors.filter((d) => {
      const spec =
        !filters.specialization ||
        d.specialization?.toLowerCase().includes(filters.specialization.toLowerCase());
      const city =
        !filters.city || d.city?.toLowerCase().includes(filters.city.toLowerCase());
      return spec && city;
    });
  }, [doctors, filters]);

  // Slots helper
  const availableSlots = (docName, dateStr) => {
    const base = doctorSlots[docName] ?? [];
    if (!dateStr) return base;
    const taken = appointments
      .filter((a) => a.doctor === docName && a.date === dateStr)
      .map((a) => a.time);
    return base.filter((s) => !taken.includes(s));
  };

  const getDeptByDoctorName = (docName) =>
    doctors.find((d) => d.name === docName)?.department ?? "Unknown";

  // Time-filtered appointments
  const apptsInTimeframe = useMemo(() => {
    if (timeframe === "all") return appointments;
    return appointments.filter((a) => inRange(a.date, rangeStart, rangeEnd));
  }, [appointments, timeframe, customStart, customEnd]);

  // Dept donut data
  const deptData = useMemo(() => {
    const counts = {};
    apptsInTimeframe.forEach((a) => {
      const dep = getDeptByDoctorName(a.doctor);
      counts[dep] = (counts[dep] ?? 0) + 1;
    });
    if (!Object.keys(counts).length) {
      filteredDoctors.forEach((d) => {
        const key = d.department ?? "Unknown";
        counts[key] = (counts[key] ?? 0) + 1;
      });
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [apptsInTimeframe, doctors, filteredDoctors]);

  // Alerts
  const todaysVisits = appointments.filter((a) => a.date === dayStr);
  const cancelledVisits = apptsInTimeframe.filter((a) => a.status === "Cancelled");

  // CRUD helpers
  const saveAppointment = (ap) => {
    const clash = appointments.some(
      (a) =>
        a.id !== ap.id &&
        a.doctor === ap.doctor &&
        a.date === ap.date &&
        a.time === ap.time
    );
    if (clash) return alert("This slot is already booked for the selected doctor.");
    setAppointments((prev) =>
      prev.some((x) => x.id === ap.id) ? prev.map((x) => (x.id === ap.id ? ap : x)) : [ap, ...prev]
    );
  };

  const updateStatus = (id, status) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    if (status === "Cancelled") {
      const ap = appointments.find((a) => a.id === id);
      if (ap) {
        const dep = getDeptByDoctorName(ap.doctor);
        if (window.confirm(`Add ${ap.patient} to waitlist for ${dep}?`)) {
          setWaitlist((w) => [
            {
              id: genId("W"),
              patient: ap.patient,
              department: dep,
              preferredDate: ap.date,
              notes: `Cancelled ${ap.doctor} ${ap.time}`,
            },
            ...w,
          ]);
        }
      }
    }
  };

  const deleteAppointment = (id) =>
    setAppointments((prev) => prev.filter((a) => a.id !== id));

  const savePatient = (p) =>
    setPatients((prev) =>
      prev.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev]
    );

  const saveDoctor = (d) =>
    setDoctors((prev) =>
      prev.some((x) => x.id === d.id) ? prev.map((x) => (x.id === d.id ? d : x)) : [d, ...prev]
    );

  const saveNurse = (n) =>
    setNurses((prev) =>
      prev.some((x) => x.id === n.id) ? prev.map((x) => (x.id === n.id ? n : x)) : [n, ...prev]
    );

  // UI modals state
  const [editingAppt, setEditingAppt] = useState(null);
  const [editingProfile, setEditingProfile] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editingNurse, setEditingNurse] = useState(null);

  const [showWaitlistModal, setShowWaitlistModal] = useState(null); // null or {entry}
  const [newWaitlist, setNewWaitlist] = useState(null);
  const [newTransfer, setNewTransfer] = useState(null);
  const [assignTransfer, setAssignTransfer] = useState(null); // transfer object for assigning doctor
  const [confirmDelete, setConfirmDelete] = useState(null); // { type, id }

  // NEW: View & Delete states for richer modals
  const [viewPatient, setViewPatient] = useState(null);
  const [viewDoctor, setViewDoctor] = useState(null);
  const [viewNurse, setViewNurse] = useState(null);

  const [deletePatient, setDeletePatient] = useState(null);
  const [deleteDoctor, setDeleteDoctor] = useState(null);
  const [deleteNurse, setDeleteNurse] = useState(null);

  const COLORS = ["#5b8cff", "#8e9afc", "#ff6b6b", "#2ecc71", "#f5a623", "#6c5ce7"];

  // Utilization
  const next7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return fmtDay(d);
  });

  const utilizationRows = useMemo(() => {
    return doctors.map((doc) => {
      const slotsPerDay = (doctorSlots[doc.name] ?? []).length;
      return {
        doctor: doc.name,
        department: doc.department,
        days: next7Days.map((day) => {
          const filled = appointments.filter((a) => a.doctor === doc.name && a.date === day).length;
          const total = slotsPerDay || 1;
          const pct = Math.round((filled / total) * 100);
          return { day, filled, total, pct };
        }),
      };
    });
  }, [doctors, appointments]);

  // Transfer helpers
  const addTransfer = (tr) =>
    setTransfers((prev) => [{ ...tr, id: genId("T"), status: "Pending", assignedDoctorId: null }, ...prev]);

  const setTransferStatus = (id, status) =>
    setTransfers((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));

  const assignTransferDoctor = (id, doctorId) =>
    setTransfers((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, assignedDoctorId: doctorId, status: t.status === "Pending" ? "Assigned" : t.status }
          : t
      )
    );

  // === Render ===
  return (
    <div className="clerk-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p className="subtitle">Hospital clerk workspace</p>
        </div>
        <div className="header-actions">
          <button
            className="make-appointment"
            onClick={() =>
              setEditingAppt({
                id: genId("A"),
                patient: patients[0]?.name ?? "",
                doctor: doctors[0]?.name ?? "",
                date: fmtDay(selectedDate),
                time: "",
                status: "Scheduled",
              })
            }
          >
            Make an appointment
          </button>
          <div className="clerk-card" onClick={() => setEditingProfile(clerk)}>
            <div className="avatar">{(clerk.name ?? "C")[0].toUpperCase()}</div>
            <div>
              <strong>{clerk.name}</strong>
              <span>Edit profile</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top row */}
      <div className="grid-3">
        <div className="card">
          <h3>Calendar</h3>
          <Calendar value={selectedDate} onChange={setSelectedDate} />
        </div>

        {/* Utilization */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="panel-title">
            <h3>Utilization (next 7 days)</h3>
          </div>
          <div className="utilization">
            {/* Header row */}
            <div className="util-row" style={{ fontSize: 12, color: "#666" }}>
              <div className="name">Doctor / Day</div>
              {next7Days.map((d) => (
                <div key={d} className="util-cell" style={{ fontWeight: 600 }}>
                  {d.slice(5)}
                </div>
              ))}
            </div>
            {utilizationRows.map((row) => (
              <div key={row.doctor} className="util-row">
                <div className="name">{row.doctor}</div>
                {row.days.map((cell) => {
                  const level = Math.min(5, Math.floor((cell.pct / 100) * 5));
                  return (
                    <div
                      key={cell.day}
                      className="util-cell"
                      data-level={level}
                      title={`${cell.filled}/${cell.total} (${cell.pct}%)`}
                    >
                      {cell.pct}%
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Search panel */}
        <div className="card search-panel">
          <h3>Search a doctor</h3>
          <div className="row">
            <select
              value={filters.specialization}
              onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
            >
              <option value="">Specialization</option>
              {[...new Set(doctors.map((d) => d.specialization).filter(Boolean))].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })}>
              <option value="">City</option>
              {[...new Set(doctors.map((d) => d.city).filter(Boolean)), ""].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="row">
            <input
              type="date"
              value={filters.date || dayStr}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
          </div>
          <div className="row">
            <button onClick={() => { /* reserved for backend search later */ }}>Search</button>
          </div>

          {/* Quick booking slots */}
          <div style={{ marginTop: 10 }}>
            {filteredDoctors.map((d) => {
              const slots = availableSlots(d.name, filters.date || dayStr);
              return (
                <div key={d.id} style={{ marginBottom: 10 }}>
                  <strong>{d.name}</strong>
                  <div className="slots" style={{ marginTop: 6 }}>
                    {slots.length ? (
                      slots.map((s) => (
                        <span
                          key={s}
                          className="slot"
                          style={{ cursor: "pointer" }}
                          onClick={() =>
                            setEditingAppt({
                              id: genId("A"),
                              patient: patients[0]?.name ?? "",
                              doctor: d.name,
                              date: filters.date || dayStr,
                              time: s,
                              status: "Scheduled",
                            })
                          }
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="slot none">No slots</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Timeframe & quick add */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <strong>Timeframe:</strong>
          <select style={{ borderRadius: "8px" }} value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All</option>
            <option value="custom">Custom</option>
          </select>
          {timeframe === "custom" && (
            <>
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
              <span>to</span>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
            </>
          )}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              className="btn secondary"
              onClick={() => setEditingPatient({ name: "", phone: "" })} // empty name => type: 'add'
            >
              + Add Patient
            </button>
            <button
              className="btn secondary"
              onClick={() => setEditingDoctor({ name: "", department: "", city: "", specialization: "" })}
            >
              + Add Doctor
            </button>
            <button className="btn secondary" onClick={() => setEditingNurse({ name: "", department: "" })}>
              + Add Nurse
            </button>
            <button
              className="btn"
              onClick={() =>
                setNewWaitlist({
                  id: null,
                  patient: "",
                  department: "",
                  preferredDate: fmtDay(new Date()),
                  notes: "",
                })
              }
            >
              + Add Waitlist
            </button>
            <button
              className="btn"
              onClick={() =>
                setNewTransfer({
                  id: null,
                  patient: "",
                  fromDept: "",
                  toDept: "",
                  reason: "",
                })
              }
            >
              + New Transfer
            </button>
          </div>
        </div>
      </div>

      {/* Alerts + Appointments + Donut */}
      <div className="section-grid">
        {/* Alerts */}
        <div className="alerts">
          <div className="alert">
            <h4>Alerts</h4>
            <ul>
              {todaysVisits.length ? (
                todaysVisits.map((v) => (
                  <li key={v.id}>
                    Today: <strong>{v.patient}</strong> with <strong>{v.doctor}</strong> at {v.time}.
                  </li>
                ))
              ) : (
                <li>No visits today.</li>
              )}
            </ul>
          </div>
          <div className="alert danger">
            <h4>Cancelled visits</h4>
            <ul>
              {cancelledVisits.length ? (
                cancelledVisits.map((v) => (
                  <li key={v.id}>
                    {v.patient} — {v.doctor} on {v.date} ({v.time})
                  </li>
                ))
              ) : (
                <li>No cancellations in selected range.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Appointments */}
        <div className="card">
          <div className="appointments-head">
            <h3>Appointments</h3>
            <div>
              <button
                className="btn secondary"
                onClick={() => {
                  setEditingAppt({
                    id: genId("A"),
                    patient: patients[0]?.name ?? "",
                    doctor: doctors[0]?.name ?? "",
                    date: fmtDay(selectedDate),
                    time: "",
                    status: "Scheduled",
                  });
                }}
              >
                + Add
              </button>
            </div>
          </div>
          <div className="appointment-list">
            {apptsInTimeframe.length ? (
              apptsInTimeframe.map((a) => (
                <div className="app-card" key={a.id}>
                  <div className="top">
                    <div className="avatar">{a.doctor.split(" ")[1]?.[0] ?? "D"}</div>
                    <div>
                      <strong>{a.doctor}</strong>
                      <div className="meta">
                        {a.patient} • {a.date} • {a.time}
                      </div>
                    </div>
                  </div>
                  <span className={`status ${a.status.toLowerCase()}`}>{a.status}</span>
                  <div className="actions">
                    {a.status !== "Completed" && (
                      <button className="btn secondary" onClick={() => updateStatus(a.id, "Completed")}>
                        Confirm
                      </button>
                    )}
                    {a.status !== "Cancelled" && (
                      <button className="btn danger" onClick={() => updateStatus(a.id, "Cancelled")}>
                        Cancel
                      </button>
                    )}
                    <button className="btn" onClick={() => setEditingAppt({ ...a })}>
                      Edit
                    </button>
                    <button
                      className="btn danger"
                      onClick={() => setConfirmDelete({ type: "appointment", id: a.id })}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div
                className="app-card"
                style={{ gridColumn: "1/-1", textAlign: "center", color: "#777" }}
              >
                No appointments in selected range.
              </div>
            )}
          </div>
        </div>

        {/* Department Donut */}
        <div className="card" style={{ height: 360 }}>
          <h3>Patient Visit by Department</h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie
                data={deptData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
              >
                {deptData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={["#5b8cff", "#8e9afc", "#ff6b6b", "#2ecc71", "#f5a623", "#6c5ce7"][index % 6]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Waitlist • Transfer • Patient List */}
      <div className="section-grid" style={{ marginTop: 16 }}>
        {/* WAITLIST */}
        <div className="card">
          <div className="panel-title">
            <h3>Waitlist</h3>
            <span className="badge">{waitlist.length}</span>
          </div>
          <div className="list">
            {waitlist.length ? (
              waitlist.map((w) => {
                const deptDocs = doctors.filter((d) => d.department === w.department);
                return (
                  <div className="item" key={w.id}>
                    <h4>
                      {w.patient} <span className="badge">{w.department}</span>
                    </h4>
                    <div className="meta">Preferred: {w.preferredDate ?? "—"}</div>
                    {w.notes && <div className="meta">Notes: {w.notes}</div>}
                    <div className="row-actions">
                      <button className="btn" onClick={() => setShowWaitlistModal({ entry: w })}>
                        Fill slot…
                      </button>
                      <button
                        className="btn danger"
                        onClick={() => setWaitlist((prev) => prev.filter((x) => x.id !== w.id))}
                      >
                        Remove
                      </button>
                    </div>

                    {/* Quick suggestions */}
                    {!!deptDocs.length && (
                      <div style={{ marginTop: 6 }}>
                        <div className="meta">Quick slots:</div>
                        <div className="slots" style={{ marginTop: 6 }}>
                          {deptDocs.slice(0, 2).flatMap((d) => {
                            const day = w.preferredDate ?? dayStr;
                            const slots = availableSlots(d.name, day).slice(0, 2);
                            return slots.map((s) => (
                              <span
                                key={d.name + s}
                                className="slot"
                                style={{ cursor: "pointer" }}
                                title={`Book ${d.name} ${day} ${s}`}
                                onClick={() => {
                                  setEditingAppt({
                                    id: genId("A"),
                                    patient: w.patient,
                                    doctor: d.name,
                                    date: day,
                                    time: s,
                                    status: "Scheduled",
                                  });
                                  setShowWaitlistModal(null);
                                }}
                              >
                                {d.name.split(" ")[1] ?? d.name}: {s}
                              </span>
                            ));
                          })}
                          {!deptDocs.length && <span className="slot none">No doctors in dept</span>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="meta">No patients on waitlist.</div>
            )}
          </div>
        </div>

        {/* TRANSFER QUEUE */}
        <div className="card">
          <div className="panel-title">
            <h3>Transfer Queue</h3>
            <span className="badge">{transfers.length}</span>
          </div>
          <div className="list">
            {transfers.length ? (
              transfers.map((t) => {
                const assigned = t.assignedDoctorId
                  ? doctors.find((d) => d.id === t.assignedDoctorId)?.name
                  : null;
                return (
                  <div className="item" key={t.id}>
                    <h4>
                      {t.patient}
                      <span className="badge">
                        {t.fromDept} → {t.toDept}
                      </span>
                      <span
                        className={`badge ${
                          t.status === "Pending" ? "pending" : t.status === "Assigned" ? "assigned" : "info"
                        }`}
                      >
                        {t.status}
                      </span>
                    </h4>
                    {t.reason && <div className="meta">Reason: {t.reason}</div>}
                    <div className="meta">Assigned: {assigned ?? "—"}</div>
                    <div className="row-actions">
                      <button className="btn" onClick={() => setAssignTransfer(t)}>
                        Assign doctor
                      </button>
                      <button className="btn secondary" onClick={() => setTransferStatus(t.id, "Need Info")}>
                        Need Info
                      </button>
                      <button className="btn" onClick={() => setTransferStatus(t.id, "Approved")}>
                        Approve
                      </button>
                      <button
                        className="btn danger"
                        onClick={() => setTransfers((prev) => prev.filter((x) => x.id !== t.id))}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="meta">No transfer requests.</div>
            )}
          </div>
        </div>

        {/* PATIENT LIST */}
        <div className="card">
          <h3>Patient List</h3>
          <ul className="compact-list">
            {patients.map((p) => (
              <li key={p.id}>
                <span>{p.name}</span>
                <span>
                  {p.phone ?? "-"}
                  {/* NEW: View / Edit / Delete using richer modals */}
                  <button className="btn" onClick={() => setViewPatient(p)} style={{ marginLeft: 8 }}>
                    View
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() => setEditingPatient({ ...p })}
                    style={{ marginLeft: 6 }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn danger"
                    onClick={() => setDeletePatient(p)}
                    style={{ marginLeft: 6 }}
                  >
                    Delete
                  </button>
                </span>
              </li>
            ))}
            {!patients.length && <li>No patients.</li>}
          </ul>
        </div>
      </div>

      {/* ===== Modals ===== */}
      {editingAppt && (
        <AppointmentModal
          initial={editingAppt}
          patients={patients}
          doctors={doctors}
          appointments={appointments}
          onSave={(ap) => {
            saveAppointment(ap);
            // Remove from waitlist for same department after booking
            setWaitlist((prev) =>
              prev.filter(
                (w) =>
                  !(
                    w.patient === ap.patient &&
                    getDeptByDoctorName(ap.doctor) === w.department
                  )
              )
            );
            setEditingAppt(null);
          }}
          onClose={() => setEditingAppt(null)}
        />
      )}

      {editingProfile && (
        <ClerkModal
          initial={clerk}
          onSave={(data) => {
            setClerk(data);
            setEditingProfile(null);
          }}
          onClose={() => setEditingProfile(null)}
        />
      )}

      {/* NEW: Rich Patient/Nurse/Doctor modals */}
      {editingPatient && (
        <PatientModal
          type={editingPatient?.name ? "edit" : "add"}
          patient={editingPatient}
          doctors={doctors}
          nurses={nurses}
          onSave={(p) => {
            if (!p.id) p.id = genId("P");
            setPatients((prev) =>
              prev.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev]
            );
            setEditingPatient(null);
          }}
          onClose={() => setEditingPatient(null)}
        />
      )}
      {viewPatient && (
        <PatientViewModal
          patient={viewPatient}
          doctorName={"—"}
          nurseName={"—"}
          onClose={() => setViewPatient(null)}
        />
      )}
      {deletePatient && (
        <DeletePatientModal
          patient={deletePatient}
          onDelete={() => {
            setPatients((prev) => prev.filter((x) => x.id !== deletePatient.id));
            // Also remove related appointments by patient name
            setAppointments((prev) => prev.filter((a) => a.patient !== deletePatient.name));
            setDeletePatient(null);
          }}
          onClose={() => setDeletePatient(null)}
        />
      )}

      {editingNurse && (
        <NurseModal
          type={editingNurse?.name ? "edit" : "add"}
          nurse={editingNurse}
          onSave={(n) => {
            if (!n.id) n.id = genId("N");
            setNurses((prev) =>
              prev.some((x) => x.id === n.id) ? prev.map((x) => (x.id === n.id ? n : x)) : [n, ...prev]
            );
            setEditingNurse(null);
          }}
          onClose={() => setEditingNurse(null)}
        />
      )}
      {viewNurse && (
        <ViewNurseModal
          nurse={viewNurse}
          patientsForNurse={[]} // no nurse relation in current data – empty list
          onClose={() => setViewNurse(null)}
          navigate={() => { /* noop in this file */ }}
        />
      )}
      {deleteNurse && (
        <DeleteNurseModal
          nurse={deleteNurse}
          inUsePatients={0} // no linkage in current data
          onDelete={() => {
            setNurses((prev) => prev.filter((x) => x.id !== deleteNurse.id));
            setDeleteNurse(null);
          }}
          onClose={() => setDeleteNurse(null)}
        />
      )}

      {editingDoctor && (
        <DoctorModal
          type={editingDoctor?.name ? "edit" : "add"}
          doctor={editingDoctor}
          onSave={(d) => {
            if (!d.id) d.id = genId("D");
            setDoctors((prev) =>
              prev.some((x) => x.id === d.id) ? prev.map((x) => (x.id === d.id ? d : x)) : [d, ...prev]
            );
            setEditingDoctor(null);
          }}
          onClose={() => setEditingDoctor(null)}
        />
      )}
      {viewDoctor && (
        <ViewDoctorModal
          doctor={viewDoctor}
          patientsForDoctor={[]} // no doctor-to-patient relation in this data
          appointmentCount={appointments.filter((a) => a.doctor === viewDoctor.name).length}
          onClose={() => setViewDoctor(null)}
          navigate={() => { /* noop */ }}
        />
      )}
      {deleteDoctor && (
        <DeleteDoctorModal
          doctor={deleteDoctor}
          inUsePatients={0}
          inUseAppointments={appointments.filter((a) => a.doctor === deleteDoctor.name).length}
          onDelete={() => {
            setDoctors((prev) => prev.filter((x) => x.id !== deleteDoctor.id));
            // Optional: also remove appointments with that doctor
            setAppointments((prev) => prev.filter((a) => a.doctor !== deleteDoctor.name));
            setDeleteDoctor(null);
          }}
          onClose={() => setDeleteDoctor(null)}
        />
      )}

      {/* Keep your other modals */}
      {newWaitlist && (
        <WaitlistModal
          initial={newWaitlist}
          onSave={(entry) => {
            setWaitlist((prev) => [{ ...entry, id: genId("W") }, ...prev]);
            setNewWaitlist(null);
          }}
          onClose={() => setNewWaitlist(null)}
        />
      )}
      {showWaitlistModal && (
        <FillFromWaitlistModal
          entry={showWaitlistModal.entry}
          doctors={doctors}
          availableSlots={availableSlots}
          defaultDate={dayStr}
          onPick={(doctorName, date, time) => {
            setEditingAppt({
              id: genId("A"),
              patient: showWaitlistModal.entry.patient,
              doctor: doctorName,
              date,
              time,
              status: "Scheduled",
            });
            setShowWaitlistModal(null);
          }}
          onClose={() => setShowWaitlistModal(null)}
        />
      )}
      {newTransfer && (
        <TransferCreateModal
          initial={newTransfer}
          onSave={(t) => {
            addTransfer(t);
            setNewTransfer(null);
          }}
          onClose={() => setNewTransfer(null)}
        />
      )}
      {assignTransfer && (
        <TransferAssignModal
          transfer={assignTransfer}
          doctors={doctors.filter((d) => d.department === assignTransfer.toDept)}
          onSave={(doctorId) => {
            assignTransferDoctor(assignTransfer.id, doctorId);
            setAssignTransfer(null);
          }}
          onClose={() => setAssignTransfer(null)}
        />
      )}

      {/* Keep ConfirmDialog for Appointment deletes */}
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete ${confirmDelete.type}?`}
          message="This action cannot be undone."
          onConfirm={() => {
            const { type, id } = confirmDelete;
            if (type === "appointment") deleteAppointment(id);
            if (type === "patient") setPatients((prev) => prev.filter((x) => x.id !== id));
            if (type === "doctor") setDoctors((prev) => prev.filter((x) => x.id !== id));
            if (type === "nurse") setNurses((prev) => prev.filter((x) => x.id !== id));
            setConfirmDelete(null);
          }}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};

// ===== Modals (kept / updated) =====
const ClerkModal = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState(initial);
  const [pass, setPass] = useState({ current: "", next: "", confirm: "" });
  const save = () => {
    if (pass.next || pass.confirm || pass.current) {
      if (!pass.current) return alert("Enter current password.");
      if (pass.next !== pass.confirm) return alert("Password confirmation mismatch.");
    }
    onSave(form);
  };
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>My Profile</h2>
        <input
          placeholder="Full Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <hr />
        <input
          type="password"
          placeholder="Current Password"
          value={pass.current}
          onChange={(e) => setPass({ ...pass, current: e.target.value })}
        />
        <input
          type="password"
          placeholder="New Password"
          value={pass.next}
          onChange={(e) => setPass({ ...pass, next: e.target.value })}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={pass.confirm}
          onChange={(e) => setPass({ ...pass, confirm: e.target.value })}
        />
        <div className="modal-actions">
          <button className="btn" onClick={save}>Save</button>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const AppointmentModal = ({
  initial,
  patients,
  doctors,
  appointments,
  onSave,
  onClose,
}) => {
  const [form, setForm] = useState(initial);
  const slots = useMemo(() => {
    if (!form.doctor || !form.date) return [];
    const base = doctorSlots[form.doctor] ?? [];
    const taken = appointments
      .filter((a) => a.id !== form.id && a.doctor === form.doctor && a.date === form.date)
      .map((a) => a.time);
    return base.filter((s) => !taken.includes(s));
  }, [form.doctor, form.date, appointments, form.id]);

  const save = () => {
    if (!form.patient || !form.doctor || !form.date || !form.time)
      return alert("Fill all fields.");
    onSave(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ width: 420 }}>
        <h2>{String(form.id).startsWith("A-") ? "Edit Appointment" : "New Appointment"}</h2>
        <label>Patient</label>
        <select
          value={form.patient}
          onChange={(e) => setForm({ ...form, patient: e.target.value })}
          style={{ width: "100%", marginBottom: 10, padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
        >
          {[form.patient, ...patients.map((p) => p.name)].filter(Boolean).map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
        <label>Doctor</label>
        <select
          value={form.doctor}
          onChange={(e) => setForm({ ...form, doctor: e.target.value })}
          style={{ width: "100%", marginBottom: 10, padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
        >
          {[form.doctor, ...doctors.map((d) => d.name)].filter(Boolean).map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
        <label>Date</label>
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <label>Time</label>
        <select
          value={form.time}
          onChange={(e) => setForm({ ...form, time: e.target.value })}
          style={{ width: "100%", marginBottom: 10, padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
        >
          <option value="">Select time</option>
          {slots.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <label>Status</label>
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          style={{ width: "100%", marginBottom: 10, padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
        >
          {["Scheduled", "Completed", "Cancelled"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <div className="modal-actions">
          <button className="btn" onClick={save}>Save</button>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

/* -------- Patients: Add/Edit + View + Delete -------- */
const PatientModal = ({ type, patient, doctors = [], nurses = [], onSave, onClose }) => {
  const isEdit = type === "edit";
  const [form, setForm] = useState({
    id: isEdit ? patient?.id : "",
    name: isEdit ? patient?.name : "",
    dob: isEdit ? patient?.dob : "",
    status: isEdit ? (patient?.status || "Active") : "Active",
    gender: isEdit ? (patient?.gender || "") : "",
    phone: isEdit ? (patient?.phone || "") : "",
    doctorId: isEdit ? (patient?.doctorId || doctors[0]?.id || "") : (doctors[0]?.id || ""),
    nurseId: isEdit ? (patient?.nurseId || nurses[0]?.id || "") : (nurses[0]?.id || ""),
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSave = () => {
    if (!form.name.trim()) return alert("Name is required.");
    if (!form.doctorId) return alert("Please select a doctor.");
    if (!form.nurseId) return alert("Please select a nurse.");
    onSave(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{isEdit ? "Edit Patient" : "Add Patient"}</h2>
        {isEdit && <input value={form.id} disabled aria-label="Patient ID" />}
        <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} />
        <label>Date of Birth</label>
        <input type="date" name="dob" value={form.dob} onChange={handleChange} />
        <label>Status</label>
        <select name="status" value={form.status} onChange={handleChange}>
          <option>Active</option><option>In Treatment</option><option>Recovered</option>
          <option>Discharged</option><option>Unknown</option>
        </select>
        <label>Gender</label>
        <select name="gender" value={form.gender} onChange={handleChange}>
          <option value="">Select Gender</option><option>Female</option><option>Male</option>
        </select>
        <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
        <label>Doctor</label>
        <select name="doctorId" value={form.doctorId} onChange={handleChange} disabled={!doctors.length}>
          {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <label>Nurse</label>
        <select name="nurseId" value={form.nurseId} onChange={handleChange} disabled={!nurses.length}>
          {nurses.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
        </select>
        <div className="modal-actions">
          <button onClick={handleSave}>{isEdit ? "Save" : "Add"}</button>
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
      <p><strong>Status:</strong> {patient.status || "Unknown"}</p>
      <p><strong>Gender:</strong> {patient.gender || "—"}</p>
      <p><strong>Phone:</strong> {patient.phone || "—"}</p>
      <p><strong>Doctor:</strong> {doctorName}</p>
      <p><strong>Nurse:</strong> {nurseName}</p>
      <div className="modal-actions">
        <button className="secondary" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

const DeletePatientModal = ({ patient, onDelete, onClose }) => (
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

/* -------- Nurses: Add/Edit + View + Delete -------- */
const NurseModal = ({ type, nurse, onSave, onClose }) => {
  const isEdit = type === "edit";
  const [form, setForm] = useState({
    id: isEdit ? nurse?.id : "",
    name: isEdit ? nurse?.name : "",
    department: isEdit ? (nurse?.department || "") : "",
    phone: isEdit ? (nurse?.phone || "") : "",
    dob: isEdit ? (nurse?.dob || "") : "",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const validPhone = (p) => (!p || /^\d{9,12}$/.test(p));
  const handleSave = () => {
    if (!form.name.trim()) return alert("Nurse name is required.");
    if (!form.department.trim()) return alert("Department is required.");
    if (!validPhone(form.phone)) return alert("Phone must be 9–12 digits.");
    const payload = {
      id: form.id,
      name: form.name.trim(),
      department: form.department.trim(),
      phone: form.phone?.trim() || "",
      dob: form.dob || "",
    };
    onSave(payload);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{isEdit ? "Edit Nurse" : "Add Nurse"}</h2>
        {isEdit && <input value={form.id} disabled aria-label="Nurse ID" />}
        <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} />
        <input name="department" placeholder="Department/Shift" value={form.department} onChange={handleChange} />
        <input name="phone" placeholder="Phone (9–12 digits)" value={form.phone} onChange={handleChange} />
        <label>Date of Birth (optional)</label>
        <input type="date" name="dob" value={form.dob} onChange={handleChange} />
        <div className="modal-actions">
          <button onClick={handleSave}>{isEdit ? "Save" : "Add"}</button>
          <button className="secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const ViewNurseModal = ({ nurse, patientsForNurse = [], onClose, navigate }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Nurse Details</h2>
      <p><strong>ID:</strong> {nurse.id}</p>
      <p><strong>Name:</strong> {nurse.name}</p>
      <p><strong>Department:</strong> {nurse.department || "—"}</p>
      <p><strong>Phone:</strong> {nurse.phone || "—"}</p>
      <p><strong>DOB:</strong> {nurse.dob || "—"} {nurse.dob ? `(${calcAge(nurse.dob)} yrs)` : ""}</p>
      <p><strong>Patients Assigned:</strong> {patientsForNurse.length}</p>
      {!!patientsForNurse.length && (
        <ul>
          {patientsForNurse.map((p) => (
            <li key={p.id}>
              <button className="link-btn" onClick={() => navigate(`/users/Patients/${p.id}`, { state: { user: p } })}>
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

const DeleteNurseModal = ({ nurse, inUsePatients = 0, warn, onDelete, onClose }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Delete Nurse</h2>
      <p>Delete <strong>{nurse.name}</strong> ({nurse.id})?</p>
      {inUsePatients > 0 && (
        <p style={{ color: "#b54708", background: "#fff6e6", padding: "8px 10px", borderRadius: 8 }}>
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

/* -------- Doctors: Add/Edit + View + Delete -------- */
const DoctorModal = ({ type, doctor, onSave, onClose }) => {
  const isEdit = type === "edit";
  const [form, setForm] = useState({
    id: isEdit ? doctor?.id : "",
    name: isEdit ? doctor?.name : "",
    specialization: isEdit ? (doctor?.specialization || doctor?.specialty || "") : "",
    department: isEdit ? (doctor?.department || "") : "",
    city: isEdit ? (doctor?.city || "") : "",
    phone: isEdit ? (doctor?.phone || "") : "",
    dob: isEdit ? (doctor?.dob || "") : "",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const validPhone = (p) => (!p || /^\d{9,12}$/.test(p));

  const handleSave = () => {
    if (!form.name.trim()) return alert("Doctor name is required.");
    if (!form.specialization.trim()) return alert("Specialization is required.");
    if (!validPhone(form.phone)) return alert("Phone must be 9–12 digits.");
    const payload = {
      id: form.id,
      name: form.name.trim(),
      specialization: form.specialization.trim(),
      specialty: form.specialization.trim(), // compatibility
      department: form.department?.trim() || "",
      city: form.city?.trim() || "",
      phone: form.phone?.trim() || "",
      dob: form.dob || "",
    };
    onSave(payload);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{isEdit ? "Edit Doctor" : "Add Doctor"}</h2>
        {isEdit && <input value={form.id} disabled aria-label="Doctor ID" />}
        <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} />
        <input name="specialization" placeholder="Specialization" value={form.specialization} onChange={handleChange} />
        <input name="department" placeholder="Department (optional)" value={form.department} onChange={handleChange} />
        <input name="city" placeholder="City (optional)" value={form.city} onChange={handleChange} />
        <input name="phone" placeholder="Phone (9–12 digits)" value={form.phone} onChange={handleChange} />
        <label>Date of Birth (optional)</label>
        <input type="date" name="dob" value={form.dob} onChange={handleChange} />
        <div className="modal-actions">
          <button onClick={handleSave}>{isEdit ? "Save" : "Add"}</button>
          <button className="secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const ViewDoctorModal = ({ doctor, patientsForDoctor = [], appointmentCount = 0, onClose, navigate }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Doctor Details</h2>
      <p><strong>ID:</strong> {doctor.id}</p>
      <p><strong>Name:</strong> {doctor.name}</p>
      <p><strong>Specialization:</strong> {doctor.specialization || doctor.specialty || "—"}</p>
      <p><strong>Department:</strong> {doctor.department || "—"}</p>
      <p><strong>City:</strong> {doctor.city || "—"}</p>
      <p><strong>Phone:</strong> {doctor.phone || "—"}</p>
      <p><strong>DOB:</strong> {doctor.dob || "—"} {doctor.dob ? `(${calcAge(doctor.dob)} yrs)` : ""}</p>
      <p><strong>Patients:</strong> {patientsForDoctor.length}</p>
      <p><strong>Appointments:</strong> {appointmentCount}</p>
      {!!patientsForDoctor.length && (
        <ul style={{ marginTop: 8 }}>
          {patientsForDoctor.map((p) => (
            <li key={p.id}>
              <button className="link-btn" onClick={() => navigate(`/users/Patients/${p.id}`, { state: { user: p } })}>
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

const DeleteDoctorModal = ({ doctor, inUsePatients = 0, inUseAppointments = 0, warn, onDelete, onClose }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Delete Doctor</h2>
      <p>Delete <strong>{doctor.name}</strong> ({doctor.id})?</p>
      {(inUsePatients > 0 || inUseAppointments > 0) && (
        <p style={{ color: "#b54708", background: "#fff6e6", padding: "8px 10px", borderRadius: 8 }}>
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

// Keep: Waitlist / FillFromWaitlist / Transfer / ConfirmDialog (unchanged from your file)
const WaitlistModal = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState(initial);
  const save = () => {
    if (!form.patient || !form.department) return alert("Patient and department are required.");
    onSave(form);
  };
  return (
    <div className="modal-overlay">
      <div className="modal wide">
        <h2>Add to Waitlist</h2>
        <input
          placeholder="Patient name"
          value={form.patient}
          onChange={(e) => setForm({ ...form, patient: e.target.value })}
        />
        <input
          placeholder="Department (e.g., Dermatology)"
          value={form.department}
          onChange={(e) => setForm({ ...form, department: e.target.value })}
        />
        <label>Preferred Date</label>
        <input
          type="date"
          value={form.preferredDate ?? ""}
          onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
        />
        <input
          placeholder="Notes (optional)"
          value={form.notes ?? ""}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <div className="modal-actions">
          <button className="btn" onClick={save}>Save</button>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const FillFromWaitlistModal = ({
  entry,
  doctors,
  availableSlots,
  defaultDate,
  onPick,
  onClose,
}) => {
  const [form, setForm] = useState({
    doctor: doctors.find((d) => d.department === entry.department)?.name ?? "",
    date: entry.preferredDate ?? defaultDate,
    time: "",
  });
  const slots = useMemo(() => {
    if (!form.doctor || !form.date) return [];
    return availableSlots(form.doctor, form.date);
  }, [form.doctor, form.date, availableSlots]);

  return (
    <div className="modal-overlay">
      <div className="modal wide">
        <h2>Fill slot for {entry.patient}</h2>
        <label>Doctor</label>
        <select value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })}>
          {doctors
            .filter((d) => d.department === entry.department)
            .map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
        </select>
        <label>Date</label>
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <label>Time</label>
        <select value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}>
          <option value="">Select time</option>
          {slots.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <div className="modal-actions">
          <button
            className="btn"
            onClick={() => {
              if (!form.doctor || !form.date || !form.time) return alert("Pick doctor, date and time.");
              onPick(form.doctor, form.date, form.time);
            }}
          >
            Book
          </button>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const TransferCreateModal = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState(initial);
  const save = () => {
    if (!form.patient || !form.fromDept || !form.toDept)
      return alert("Patient, from and to departments are required.");
    onSave(form);
  };
  return (
    <div className="modal-overlay">
      <div className="modal wide">
        <h2>New Transfer</h2>
        <input
          placeholder="Patient name"
          value={form.patient}
          onChange={(e) => setForm({ ...form, patient: e.target.value })}
        />
        <input
          placeholder="From department"
          value={form.fromDept}
          onChange={(e) => setForm({ ...form, fromDept: e.target.value })}
        />
        <input
          placeholder="To department"
          value={form.toDept}
          onChange={(e) => setForm({ ...form, toDept: e.target.value })}
        />
        <input
          placeholder="Reason (optional)"
          value={form.reason ?? ""}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
        />
        <div className="modal-actions">
          <button className="btn" onClick={save}>Create</button>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const TransferAssignModal = ({ transfer, doctors, onSave, onClose }) => {
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "");
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Assign Doctor</h2>
        <div className="meta" style={{ marginBottom: 8 }}>
          {transfer.patient}: {transfer.fromDept} → {transfer.toDept}
        </div>
        <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <div className="modal-actions">
          <button className="btn" onClick={() => onSave(doctorId)}>Assign</button>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const ConfirmDialog = ({ title, message, onConfirm, onClose }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h3>{title}</h3>
      <p style={{ marginBottom: 16, color: "#555" }}>{message}</p>
      <div className="modal-actions">
        <button className="btn" onClick={onConfirm}>Delete</button>
        <button className="btn secondary" onClick={onClose}>Cancel</button>
      </div>
    </div>
  </div>
);

// === Export only the working default ===
export default ClerkDashboardModern;
