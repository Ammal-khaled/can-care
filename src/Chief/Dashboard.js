
// src/ChiefDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./style/Dashboard.css";

import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ---- LocalStorage keys
const LS = {
  A: "ls_appts",
  P: "ls_patients",
  D: "ls_doctors",
  N: "ls_nurses",
  W: "ls_waitlist",
  T: "ls_transfers",
  POSTS: "ls_posts",
  NTF: "ls_notifications",
};

// ---- Helpers (no external deps)
const fmtDay = (d) => d?.toISOString().split("T")[0];
const parseISO = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const inRange = (dateStr, start, end) => {
  const d = parseISO(dateStr);
  return (!start || d >= start) && (!end || d <= end);
};

// ---- Initial seed (replace with API when ready)
const initialAppointments = [
  { id: "A-001", patient: "Ahmad Saleh", doctor: "Dr. Omar Khaled", date: "2025-12-20", time: "10:00 AM", status: "Scheduled" },
  { id: "A-002", patient: "Sara Mahmoud",  doctor: "Dr. Lina Yousef",   date: fmtDay(new Date()), time: "11:30 AM", status: "Confirmed" },
];
const initialDoctors = [
  { id: "D-001", name: "Dr. Omar Khaled",  department: "Dermatology", city: "Amman", specialization: "Dermatology" },
  { id: "D-002", name: "Dr. Lina Yousef",  department: "Neurology",   city: "Amman", specialization: "Neurology"   },
];
const initialNurses = [
  { id: "N-001", name: "Nurse Rania", department: "Dermatology" },
  { id: "N-002", name: "Nurse Yara",  department: "Neurology"   },
];
const initialPatients = [
  { id: "P-001", name: "Ahmad Saleh",  phone: "0790000001" },
  { id: "P-002", name: "Sara Mahmoud", phone: "0790000002" },
];
const initialWaitlist   = [];
const initialTransfers  = [];
const initialPosts      = [];
const initialNotifs     = [];

const ChiefDashboard = () => {
  // Persistent state (shared model with clerk)
  const [appointments, setAppointments] = useState(
    () => JSON.parse(localStorage.getItem(LS.A) ?? "null") ?? initialAppointments
  );
  const [doctors, setDoctors] = useState(
    () => JSON.parse(localStorage.getItem(LS.D) ?? "null") ?? initialDoctors
  );
  const [nurses, setNurses] = useState(
    () => JSON.parse(localStorage.getItem(LS.N) ?? "null") ?? initialNurses
  );
  const [patients, setPatients] = useState(
    () => JSON.parse(localStorage.getItem(LS.P) ?? "null") ?? initialPatients
  );
  const [waitlist, setWaitlist] = useState(
    () => JSON.parse(localStorage.getItem(LS.W) ?? "null") ?? initialWaitlist
  );
  const [transfers, setTransfers] = useState(
    () => JSON.parse(localStorage.getItem(LS.T) ?? "null") ?? initialTransfers
  );

  // NEW: posts & notifications persistence
  const [posts, setPosts] = useState(
    () => JSON.parse(localStorage.getItem(LS.POSTS) ?? "null") ?? initialPosts
  );
  const [notifications, setNotifications] = useState(
    () => JSON.parse(localStorage.getItem(LS.NTF)   ?? "null") ?? initialNotifs
  );

  useEffect(() => localStorage.setItem(LS.A, JSON.stringify(appointments)), [appointments]);
  useEffect(() => localStorage.setItem(LS.D, JSON.stringify(doctors)),      [doctors]);
  useEffect(() => localStorage.setItem(LS.N, JSON.stringify(nurses)),       [nurses]);
  useEffect(() => localStorage.setItem(LS.P, JSON.stringify(patients)),     [patients]);
  useEffect(() => localStorage.setItem(LS.W, JSON.stringify(waitlist)),     [waitlist]);
  useEffect(() => localStorage.setItem(LS.T, JSON.stringify(transfers)),    [transfers]);

  useEffect(() => localStorage.setItem(LS.POSTS, JSON.stringify(posts)),            [posts]);
  useEffect(() => localStorage.setItem(LS.NTF,   JSON.stringify(notifications)),    [notifications]);

  // Calendar + timeframe (same logic you sent)
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dayStr = fmtDay(selectedDate);

  const [timeframe, setTimeframe] = useState("7d"); // today, 7d, 30d, all, custom
  const [customStart, setCustomStart] = useState("");
  const [customEnd,   setCustomEnd]   = useState("");

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const makeOffset = (days) => new Date(todayStart.getTime() - days * 86400000);

  let rangeStart = null, rangeEnd = null;
  if (timeframe === "today") {
    rangeStart = todayStart;
    rangeEnd   = new Date(todayStart.getTime() + 86399999);
  } else if (timeframe === "7d") {
    rangeStart = makeOffset(6);
    rangeEnd   = new Date(todayStart.getTime() + 86399999);
  } else if (timeframe === "30d") {
    rangeStart = makeOffset(29);
    rangeEnd   = new Date(todayStart.getTime() + 86399999);
  } else if (timeframe === "custom") {
    rangeStart = customStart ? parseISO(customStart) : null;
    rangeEnd   = customEnd   ? parseISO(customEnd)   : null;
  } // all => nulls

  // KPIs
  const kpis = [
    { label: "Patients Under Care", value: patients.length },
    { label: "Doctors On Duty",     value: doctors.length  },
    { label: "Nurses Assigned",     value: nurses.length   },
    { label: "Appointments Today",  value: appointments.filter((a) => a.date === fmtDay(new Date())).length },
  ];

  // Data in timeframe
  const apptsInTimeframe = useMemo(() => {
    if (timeframe === "all") return appointments;
    return appointments.filter((a) => inRange(a.date, rangeStart, rangeEnd));
  }, [appointments, timeframe, customStart, customEnd]);

  // Dept donut
  const getDeptByDoctorName = (name) => doctors.find((d) => d.name === name)?.department ?? "Unknown";

  const deptData = useMemo(() => {
    const counts = {};
    apptsInTimeframe.forEach((a) => {
      const dep = getDeptByDoctorName(a.doctor);
      counts[dep] = (counts[dep] ?? 0) + 1;
    });
    if (!Object.keys(counts).length) {
      doctors.forEach((d) => {
        const key = d.department ?? "Unknown";
        counts[key] = (counts[key] ?? 0) + 1;
      });
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [apptsInTimeframe, doctors]);

  const COLORS = ["#5b8cff", "#8e9afc", "#ff6b6b", "#2ecc71", "#f5a623", "#6c5ce7"];

  // Alerts
  const todaysVisits     = appointments.filter((a) => a.date === dayStr);
  const cancelledInRange = apptsInTimeframe.filter((a) => a.status === "Cancelled");

  // Interventions
  const [editingAppt,  setEditingAppt]    = useState(null);
  const [confirmDelete,setConfirmDelete]  = useState(null);

  const saveAppointment = (ap) => {
    setAppointments((prev) =>
      prev.some((x) => x.id === ap.id) ? prev.map((x) => (x.id === ap.id ? ap : x)) : [ap, ...prev]
    );
  };
  const updateStatus = (id, status) =>
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  const deleteAppointment = (id) =>
    setAppointments((prev) => prev.filter((a) => a.id !== id));

  // NEW: Actions — post & notification modals
  const [showPost,  setShowPost]  = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  const onCreatePost = (payload) => {
    const id = `POST-${Math.random().toString(36).slice(2,7)}`;
    const createdAt = new Date().toISOString();
    setPosts((prev) => [{ id, createdAt, ...payload }, ...prev]);
    alert("Post created ✅");
  };

  const onSendNotification = (payload) => {
    const id = `NTF-${Math.random().toString(36).slice(2,7)}`;
    const sentAt = new Date().toISOString();
    setNotifications((prev) => [{ id, sentAt, ...payload }, ...prev]);
    alert("Notification sent ✅");
  };

  // Derived flags (optional): to auto-collapse when empty
  const hasAppointments    = apptsInTimeframe.length > 0;
  const hasAlertsToday     = todaysVisits.length > 0;
  const hasAlertsCancelled = cancelledInRange.length > 0;
  const hasAnyAlerts       = hasAlertsToday || hasAlertsCancelled;

  return (
    <div className="chief-page">
      {/* Header with quick actions */}
      <header className="chief-header">
        <div>
          <h1>Department Oversight</h1>
          <p>Read-first, intervene when needed</p>
        </div>
        <div className="chief-toolbar">
          <span className="chief-badge">Today: {new Date().toLocaleDateString()}</span>
          <button className="chief-btn primary" onClick={() => setShowPost(true)}>Create Post</button>
          <button className="chief-btn primary" onClick={() => setShowNotif(true)}>Send Notification</button>
        </div>
      </header>

      {/* KPIs */}
      <section className="chief-kpis" aria-label="Key medical activity">
        {kpis.map((k) => (
          <div key={k.label} className="chief-kpi">
            <div className="chief-kpi-label">{k.label}</div>
            <div className="chief-kpi-value">{k.value}</div>
          </div>
        ))}
      </section>

      {/* Two-column grid */}
      <div className="chief-grid">
        {/* LEFT COLUMN */}
        <section className="chief-card">
          {/* Calendar */}
          <div className="chief-card-title"><h3>Calendar</h3></div>
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid var(--border)", padding: 8 }}>
            <Calendar value={selectedDate} onChange={setSelectedDate} />
            <div style={{ marginTop: 8, color: "var(--muted)" }}>Selected: {dayStr}</div>
          </div>

          {/* Timeframe */}
          <div className="chief-subcard">
            <div className="chief-subcard-title">
              <h4>Timeframe</h4>
              <span className="chief-badge">{apptsInTimeframe.length}</span>
            </div>
            <div className="chief-inline-actions">
              <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
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
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)" }}>
              Range: {rangeStart ? fmtDay(rangeStart) : "—"} → {rangeEnd ? fmtDay(rangeEnd) : "—"}
            </div>
          </div>

          {/* On‑Duty Roster (compact stacked) */}
          <div className="chief-panel" style={{ marginTop: 14 }}>
            <div className="chief-subcard-title"><h4>On‑Duty Roster</h4></div>
            <div className="chief-roster">
              <div>
                <h5>Doctors</h5>
                <ul className="compact-list">{doctors.map((d) => <li key={d.id}>{d.name}</li>)}</ul>
              </div>
              <div>
                <h5>Nurses</h5>
                <ul className="compact-list">{nurses.map((n) => <li key={n.id}>{n.name}</li>)}</ul>
              </div>
            </div>
          </div>

          {/* Queues (compact stacked) */}
          <div className="chief-panel" style={{ marginTop: 14 }}>
            <div className="chief-card-title" style={{ marginBottom: 8 }}>
              <h4>Queues</h4>
              <span className="chief-badge">{waitlist.length + transfers.length}</span>
            </div>
            <div className="chief-status">
              <div className="chip">Waitlist: {waitlist.length}</div>
              <div className="chip">Transfers: {transfers.length}</div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN */}
        <section className="chief-card">
          {/* Donut chart at top */}
          <div className="chief-subcard">
            <div className="chief-subcard-title"><h4>Visits by Department</h4></div>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={deptData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={3}
                  >
                    {deptData.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={["#5b8cff","#8e9afc","#ff6b6b","#2ecc71","#f5a623","#6c5ce7"][i % 6]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alerts (auto‑collapse when no alerts) */}
          {hasAnyAlerts && (
            <div className="chief-block">
              <h3>Alerts</h3>
              <div className="chief-quick" style={{ marginBottom: 10 }}>
                <span className="chief-badge">Today’s: {todaysVisits.length}</span>
                <span className="chief-badge">Cancelled: {cancelledInRange.length}</span>
              </div>

              {hasAlertsToday && (
                <>
                  <h4 style={{ margin: 0 }}>Today’s Visits</h4>
                  <ul className="chief-activity">
                    {todaysVisits.map((v) => (
                      <li key={v.id}>Today: <strong>{v.patient}</strong> with <strong>{v.doctor}</strong> at {v.time}.</li>
                    ))}
                  </ul>
                </>
              )}

              {hasAlertsCancelled && (
                <>
                  <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "12px 0" }} />
                <h4 style={{ margin: 0 }}>Cancelled (selected range)</h4>
                  <ul className="chief-activity">
                    {cancelledInRange.map((v) => (
                      <li key={v.id}>{v.patient} — {v.doctor} on {v.date} ({v.time})</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          {/* Appointments */}
          {hasAppointments ? (
            <div className="chief-block">
              <h3>Appointments (selected range)</h3>
              <ul className="chief-today-list">
                {apptsInTimeframe.map((a) => (
                  <li key={a.id} className="chief-today-item">
                    <div className="chief-today-main">
                      <span className="chief-strong">{a.patient}</span> with {a.doctor}
                    </div>
                    <div className="chief-today-meta">
                      {a.date} · {a.time} · <span className={`chief-badge chip ${a.status.toLowerCase()}`}>{a.status}</span>
                    </div>
                    <div className="chief-list-actions">
                      {a.status !== "Completed" && (
                        <button className="chief-btn" onClick={() => updateStatus(a.id, "Completed")}>Mark Completed</button>
                      )}
                      {a.status !== "Cancelled" && (
                        <button className="chief-btn danger" onClick={() => updateStatus(a.id, "Cancelled")}>Cancel</button>
                      )}
                      <button className="chief-link" onClick={() => setEditingAppt({ ...a })}>Edit</button>
                      <button className="chief-link danger" onClick={() => setConfirmDelete({ type: "appointment", id: a.id })}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="chief-block">
              <h3>Appointments (selected range)</h3>
              <div className="chief-status"><div className="chip">No appointments in selected range</div></div>
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      {editingAppt && (
        <AppointmentModal
          initial={editingAppt}
          patients={patients}
          doctors={doctors}
          appointments={appointments}
          onSave={(ap) => { saveAppointment(ap); setEditingAppt(null); }}
          onClose={() => setEditingAppt(null)}
        />
      )}

      {showPost && (
        <PostModal
          onSave={(payload) => { onCreatePost(payload); setShowPost(false); }}
          onClose={() => setShowPost(false)}
        />
      )}

      {showNotif && (
        <NotifyModal
          onSend={(payload) => { onSendNotification(payload); setShowNotif(false); }}
          onClose={() => setShowNotif(false)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete ${confirmDelete.type}?`}
          message="This action cannot be undone."
          onConfirm={() => {
            const { type, id } = confirmDelete;
            if (type === "appointment") deleteAppointment(id);
            setConfirmDelete(null);
          }}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};

// ====== Modals ======

const AppointmentModal = ({ initial, patients, doctors, appointments, onSave, onClose }) => {
  const [form, setForm] = useState(initial);

  const availableSlots = (docName, dateStr) => {
    const taken = appointments
      .filter((a) => a.id !== form.id && a.doctor === docName && a.date === dateStr)
      .map((a) => a.time);
    const base = ["09:00 AM", "10:00 AM", "11:00 AM", "12:30 PM", "02:00 PM", "03:30 PM"];
    return base.filter((s) => !taken.includes(s));
  };

  const slots = useMemo(() => {
    if (!form.doctor || !form.date) return [];
    return availableSlots(form.doctor, form.date);
  }, [form.doctor, form.date, appointments, form.id]);

  const save = () => {
    if (!form.patient || !form.doctor || !form.date || !form.time) return alert("Fill all fields.");
    onSave(form);
  };

  return (
    <div className="chief-overlay">
      <div className="chief-modal" style={{ maxWidth: 480 }}>
        <div className="chief-modal-head">
          <h4>{String(form.id).startsWith("A-") ? "Edit Appointment" : "New Appointment"}</h4>
          <button className="chief-icon" onClick={onClose}>✕</button>
        </div>
        <div className="chief-modal-body grid2">
          <div className="field"><label>Patient</label>
            <select value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })}>
              {[form.patient, ...patients.map((p) => p.name)].filter(Boolean).map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="field"><label>Doctor</label>
            <select value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })}>
              {[form.doctor, ...doctors.map((d) => d.name)].filter(Boolean).map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="field"><label>Date</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="field"><label>Time</label>
            <select value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}>
              <option value="">Select time</option>
              {slots.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="field col2"><label>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {["Scheduled", "Confirmed", "Completed", "Cancelled"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="chief-modal-actions">
          <button className="chief-btn" onClick={save}>Save</button>
          <button className="chief-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const PostModal = ({ onSave, onClose }) => {
  const [form, setForm] = useState({ title: "", content: "", category: "Diet", image: null });
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onFile = (e) => setForm({ ...form, image: e.target.files?.[0] ?? null });
  const canSave = form.title.trim() && form.content.trim();

  return (
    <div className="chief-overlay">
      <div className="chief-modal">
        <div className="chief-modal-head">
          <h4>Create Post</h4>
          <button className="chief-icon" onClick={onClose}>✕</button>
        </div>
        <div className="chief-modal-body">
          <div className="field"><label>Title</label>
            <input name="title" value={form.title} onChange={change} />
          </div>
          <div className="field"><label>Category</label>
            <select name="category" value={form.category} onChange={change}>
              <option>Diet</option><option>Exercise</option><option>Mental Health</option><option>Tips</option>
            </select>
          </div>
          <div className="field"><label>Content</label>
            <textarea name="content" rows={5} value={form.content} onChange={change} />
          </div>
          <div className="field">
            <label>Image (optional)</label>
            <label className="chief-attach">
              <input type="file" hidden accept="image/*" onChange={onFile} />
              <span className="chief-btn">📎 Attach image</span>
              {form.image && <span className="chief-file">{form.image.name}</span>}
            </label>
          </div>
        </div>
        <div className="chief-modal-actions">
          <button className="chief-btn" onClick={onClose}>Cancel</button>
          <button className="chief-btn primary" disabled={!canSave} onClick={() => onSave(form)}>Add</button>
        </div>
      </div>
    </div>
  );
};

const NotifyModal = ({ onSend, onClose }) => {
  const [form, setForm] = useState({
    audience: "All", toId: "", subject: "", message: "", priority: "Normal"
  });
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const canSend = form.subject.trim() && form.message.trim();

  return (
    <div className="chief-overlay">
      <div className="chief-modal wide">
        <div className="chief-modal-head">
          <h4>Send Notification</h4>
          <button className="chief-icon" onClick={onClose}>✕</button>
        </div>
        <div className="chief-modal-body grid2">
          <div className="field"><label>Audience</label>
            <select name="audience" value={form.audience} onChange={change}>
              <option>All</option><option>Doctors</option><option>Nurses</option><option>Specific User</option>
            </select>
          </div>
          <div className="field"><label>To (optional)</label>
            <input name="toId" value={form.toId} onChange={change} placeholder="User ID (if Specific User)" />
          </div>
          <div className="field col2"><label>Subject</label>
            <input name="subject" value={form.subject} onChange={change} />
          </div>
          <div className="field col2"><label>Message</label>
            <textarea name="message" rows={6} value={form.message} onChange={change} />
          </div>
          <div className="field"><label>Priority</label>
            <select name="priority" value={form.priority} onChange={change}>
              <option>Low</option><option>Normal</option><option>High</option><option>Critical</option>
            </select>
          </div>
        </div>
        <div className="chief-modal-actions">
          <button className="chief-btn" onClick={onClose}>Cancel</button>
          <button className="chief-btn primary" disabled={!canSend} onClick={() => onSend(form)}>Send</button>
        </div>
      </div>
    </div>
  );
};

const ConfirmDialog = ({ title, message, onConfirm, onClose }) => (
  <div className="chief-overlay">
    <div className="chief-modal" style={{ maxWidth: 420 }}>
      <div className="chief-modal-head">
        <h4>{title}</h4>
        <button className="chief-icon" onClick={onClose}>✕</button>
      </div>
      <div className="chief-modal-body">
        <p style={{ color: "var(--muted)" }}>{message}</p>
      </div>
      <div className="chief-modal-actions">
        <button className="chief-btn danger" onClick={onConfirm}>Delete</button>
        <button className="chief-btn" onClick={onClose}>Cancel</button>
      </div>
    </div>
  </div>
);

export default ChiefDashboard;
