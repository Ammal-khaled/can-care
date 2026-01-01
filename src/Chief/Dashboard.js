
// src/Dashboard.js
import React, { useState } from 'react';
import './style/Dashboard.css';

/**
 * Chief of Department Dashboard (data-driven, no dummy data)
 * - Calendar (compact, read-only) — Sunday-first with correct month alignment
 * - KPIs (read-only)
 * - Today’s Appointments (compact list: View/Edit/Cancel + Add)
 * - Compact chart placeholders (Department Mix donut, Gender Trend) -> Now real charts (Recharts)
 * - Review & Oversight quick actions (top-right column)
 * - In-dashboard modals: Add/Edit/View/Cancel Appointment, Create Post, Send Notification
 *
 * Props:
 * stats: {
 *   patientsUnderCare: number,
 *   doctorsOnDuty: number,
 *   nursesAssigned: number,
 *   appointmentsToday: number,
 * }
 * appointmentsTodayList: {
 *   id:string, patient:string, doctor:string, date:string, time:string,
 *   status:'Scheduled'|'Confirmed'|'Completed'|'Cancelled'
 * }[]
 * departmentMix: { name:string, value:number }[] // % per department (sum ≈ 100)
 * genderTrend: { t:string, male:number, female:number }[] // time series for charts
 * recentActivity: string[]
 * onDutyDoctors: string[]
 * onDutyNurses: string[]
 * onNavigate: (path:string) => void
 *
 * onAddAppointment: (appointment) => Promise<void>|void
 * onEditAppointment: (appointment) => Promise<void>|void
 * onCancelAppointment: (id:string) => Promise<void>|void
 * onCreatePost: (payload) => Promise<void>|void
 * onSendNotification: (payload) => Promise<void>|void
 */

// ===== Real charts imports (Recharts) =====
import {
  ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';

// ===== Timeframe utilities (date-fns) =====
import { parseISO, isWithinInterval, startOfDay, endOfDay, addDays } from 'date-fns';

/* --------- Calendar helper (Sunday-first) --------- */
const buildMonthGrid = (baseDate = new Date()) => {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth(); // 0..11
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const daysInMonth = last.getDate();
  const startWeekday = first.getDay(); // 0=Sun .. 6=Sat (SUNDAY-FIRST)
  const today = new Date();
  const isSameDay = (d) =>
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  const grid = [];
  // Leading blanks from previous month
  for (let i = 0; i < startWeekday; i++) {
    grid.push({ label: '', inMonth: false, isToday: false, dateISO: '' });
  }
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const dateISO = d.toISOString().slice(0, 10);
    grid.push({
      label: String(day),
      inMonth: true,
      isToday: isSameDay(d),
      dateISO,
    });
  }
  // Pad to full 6 weeks (42 cells)
  while (grid.length < 42) {
    grid.push({ label: '', inMonth: false, isToday: false, dateISO: '' });
  }
  const monthName = baseDate.toLocaleString('default', { month: 'long' });
  const weekdayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return { grid, monthName, year, weekdayShort };
};

export default function ChiefDashboard({
  stats,
  appointmentsTodayList = [],
  departmentMix = [],
  genderTrend = [],
  recentActivity = [],
  onDutyDoctors = [],
  onDutyNurses = [],
  onNavigate = () => {},
  onAddAppointment,
  onEditAppointment,
  onCancelAppointment,
  onCreatePost,
  onSendNotification,
}) {
  const { grid: calendarGrid, monthName, year, weekdayShort } = buildMonthGrid(new Date());

  // ======== Modal router: 'appt-add' | 'appt-edit' | 'appt-view' | 'appt-delete' | 'post-add' | 'notify-send' ========
  const [modal, setModal] = useState({ type: '', payload: null });
  const open = (type, payload = null) => setModal({ type, payload });
  const close = () => setModal({ type: '', payload: null });

  // ======== KPIs ========
  const kpis = [
    { label: 'Patients Under Care', value: stats?.patientsUnderCare ?? 0 },
    { label: 'Doctors On Duty', value: stats?.doctorsOnDuty ?? 0 },
    { label: 'Nurses Assigned', value: stats?.nursesAssigned ?? 0 },
    { label: 'Appointments Today', value: stats?.appointmentsToday ?? 0 },
  ];

  // ======== Timeframe state for charts ========
  const [timeframe, setTimeframe] = useState('7d'); // today, 7d, 30d, all, custom
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // ======== Range calculation (safer with startOfDay/endOfDay) ========
  const now = new Date();
  const todayStart = startOfDay(now);
  const makeOffset = (days) => addDays(todayStart, -days);

  let rangeStart = null,
    rangeEnd = null;
  if (timeframe === 'today') {
    rangeStart = todayStart;
    rangeEnd = endOfDay(todayStart);
  } else if (timeframe === '7d') {
    rangeStart = makeOffset(6);
    rangeEnd = endOfDay(todayStart);
  } else if (timeframe === '30d') {
    rangeStart = makeOffset(29);
    rangeEnd = endOfDay(todayStart);
  } else if (timeframe === 'custom') {
    rangeStart = customStart ? startOfDay(parseISO(customStart)) : null;
    rangeEnd = customEnd ? endOfDay(parseISO(customEnd)) : null;
  } else if (timeframe === 'all') {
    rangeStart = null;
    rangeEnd = null;
  }

  // ======== Filter genderTrend by timeframe ========
  const genderTrendFiltered = Array.isArray(genderTrend)
    ? genderTrend.filter((p) => {
        if (!rangeStart || !rangeEnd) return true; // "all" or undefined -> keep all
        const d = typeof p.t === 'string' ? parseISO(p.t) : new Date(p.t);
        return !isNaN(d) && isWithinInterval(d, { start: rangeStart, end: rangeEnd });
      })
    : [];

  // ======== Colors for donut segments ========
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

  const handleDayClick = (dateISO) => {
    if (!dateISO) return;
    // Sync calendar click with chart timeframe (optional)
    setTimeframe('custom');
    setCustomStart(dateISO);
    setCustomEnd(dateISO);
    // Navigate to appointments page filtered by date
    onNavigate(`/appointments?date=${encodeURIComponent(dateISO)}`);
  };

  return (
    <div className="chief-page">
      {/* Header */}
      <header className="chief-header">
        <div>
          <h1>Department Oversight</h1>
        </div>
        <div className="chief-toolbar">
          <span className="chief-badge">Today: {new Date().toLocaleDateString()}</span>
          <button className="chief-btn primary" onClick={() => open('post-add')}>Create Post</button>
          <button className="chief-btn primary" onClick={() => open('notify-send')}>Send Notification</button>
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
          <div className="chief-card-title">
            <h3>{monthName} {year}</h3>
          </div>
          {/* Weekday header (Sun..Sat) */}
          <div className="chief-calendar chief-calendar--header" aria-hidden="true">
            {weekdayShort.map((w) => (
              <div key={w} className="chief-day head">{w}</div>
            ))}
          </div>
          <div className="chief-calendar" role="grid" aria-label={`${monthName} ${year}`}>
            {calendarGrid.map((cell, i) => (
              <button
                key={i}
                type="button"
                className={[
                  'chief-day',
                  !cell.inMonth ? 'muted' : '',
                  cell.isToday ? 'today' : '',
                ].join(' ')}
                onClick={() => handleDayClick(cell.dateISO)}
                disabled={!cell.inMonth}
                aria-current={cell.isToday ? 'date' : undefined}
                aria-label={cell.dateISO || 'out-of-month'}
              >
                {cell.label}
              </button>
            ))}
          </div>

          {/* Department Mix (real donut chart) */}
          <div className="chief-subcard">
            <div className="chief-subcard-title"><h4>Department Mix</h4></div>
            <div className="chief-donut">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={departmentMix || []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={1}
                    isAnimationActive={true}
                  >
                    {(departmentMix || []).map((_, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={32} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Optional textual legend:
            <ul className="chief-legend">
              {(departmentMix || []).map(d => <li key={d.name}>{d.name}: {d.value}%</li>)}
            </ul> */}
          </div>

          {/* Today’s Appointments (compact with actions) */}
          <div className="chief-subcard">
            <div className="chief-subcard-title">
              <h4>Today’s Appointments</h4>
              <div className="chief-inline-actions">
                <button className="chief-btn small primary" onClick={() => open('appt-add')}>Add</button>
              </div>
            </div>
            <ul className="chief-today-list">
              {(appointmentsTodayList || []).slice(0, 6).map((a) => (
                <li key={a.id} className="chief-today-item">
                  <div className="chief-today-main">
                    <span className="chief-strong">{a.patient}</span> with {a.doctor}
                  </div>
                  <div className="chief-today-meta">
                    {a.time} · <span className={`chief-badge chip ${a.status.toLowerCase()}`}>{a.status}</span>
                  </div>
                  <div className="chief-list-actions">
                    <button className="chief-link" onClick={() => open('appt-view', a)}>View</button>
                    <button className="chief-link" onClick={() => open('appt-edit', a)}>Edit</button>
                    <button className="chief-link danger" onClick={() => open('appt-delete', a)}>Cancel</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Gender Trend (real area chart + timeframe controls) */}
          <div className="chief-subcard">
            <div className="chief-subcard-title">
              <h4>Gender Trend</h4>
              <div className="chief-inline-actions">
                <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                  <option value="today">اليوم</option>
                  <option value="7d">آخر 7 أيام</option>
                  <option value="30d">آخر 30 يوم</option>
                  <option value="all">الكل</option>
                  <option value="custom">مُخصّص</option>
                </select>
                {timeframe === 'custom' && (
                  <>
                    <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                    <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                  </>
                )}
              </div>
            </div>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <AreaChart data={genderTrendFiltered} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="maleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="femaleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="t" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="male" stroke="#3b82f6" fill="url(#maleGrad)" />
                  <Area type="monotone" dataKey="female" stroke="#ec4899" fill="url(#femaleGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN */}
        <section className="chief-card">
          {/* Review & Oversight */}
          <div className="chief-block">
            <h3>Review & Oversight</h3>
            <div className="chief-quick">
              <button className="chief-btn primary" onClick={() => open('post-add')}>Create Post</button>
              <button className="chief-btn primary" onClick={() => open('notify-send')}>Send Notification</button>
              <button className="chief-btn" onClick={() => open('appt-add')}>Add Appointment</button>
              <button className="chief-btn" onClick={() => onNavigate('/appointments')}>Open Appointments Page</button>
              <button className="chief-btn" onClick={() => onNavigate('/patients')}>View Patients</button>
              <button className="chief-btn" onClick={() => onNavigate('/doctors')}>View Doctors</button>
              <button className="chief-btn" onClick={() => onNavigate('/nurses')}>View Nurses</button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="chief-block">
            <h3>Recent Activity</h3>
            <ul className="chief-activity">{(recentActivity || []).map((t, i) => <li key={i}>{t}</li>)}</ul>
          </div>

          {/* On-Duty Roster */}
          <div className="chief-block">
            <h3>On-Duty Roster</h3>
            <div className="chief-roster">
              <div>
                <h5>Doctors</h5>
                <ul>{(onDutyDoctors || []).map((d) => <li key={d}>{d}</li>)}</ul>
              </div>
              <div>
                <h5>Nurses</h5>
                <ul>{(onDutyNurses || []).map((n) => <li key={n}>{n}</li>)}</ul>
              </div>
            </div>
          </div>

          {/* Patient Status (Today) */}
          <div className="chief-block">
            <h3>Patient Status (Today)</h3>
            <div className="chief-status">
              {/* Replace with live buckets if you have them */}
              <div className="chip">Stable</div>
              <div className="chip">Observation</div>
              <div className="chip">Critical</div>
              <div className="chip">Post‑Op</div>
            </div>
          </div>

          {/* Alerts (optional) */}
          <div className="chief-block">
            <h3>Alerts</h3>
            <ul className="chief-alerts">{/* map alerts here if desired */}</ul>
          </div>
        </section>
      </div>

      {/* --------------------- MODALS --------------------- */}
      {modal.type === 'appt-add' && (
        <AppointmentModal
          type="add"
          onSave={async (form) => { await onAddAppointment?.(form); close(); }}
          onClose={close}
        />
      )}
      {modal.type === 'appt-edit' && modal.payload && (
        <AppointmentModal
          type="edit"
          appointment={modal.payload}
          onSave={async (form) => { await onEditAppointment?.(form); close(); }}
          onClose={close}
        />
      )}
      {modal.type === 'appt-view' && modal.payload && (
        <ViewAppointmentModal appointment={modal.payload} onClose={close} />
      )}
      {modal.type === 'appt-delete' && modal.payload && (
        <DeleteModal
          appointment={modal.payload}
          onDelete={async () => { await onCancelAppointment?.(modal.payload.id); close(); }}
          onClose={close}
        />
      )}
      {modal.type === 'post-add' && (
        <PostModal
          onSave={async (payload) => { await onCreatePost?.(payload); close(); }}
          onClose={close}
        />
      )}
      {modal.type === 'notify-send' && (
        <NotifyModal
          onSend={async (payload) => { await onSendNotification?.(payload); close(); }}
          onClose={close}
        />
      )}
    </div>
  );
}

/* ==================== Modal Components ==================== */
function AppointmentModal({ type, appointment = {}, onSave, onClose }) {
  const [form, setForm] = useState({
    id: appointment.id || '',
    patient: appointment.patient || '',
    doctor: appointment.doctor || '',
    date: appointment.date || '',
    time: appointment.time || '',
    status: appointment.status || 'Scheduled',
  });
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const canSave = form.patient && form.doctor && form.date && form.time && form.status;
  return (
    <div className="chief-overlay">
      <div className="chief-modal">
        <div className="chief-modal-head">
          <h4>{type === 'add' ? 'Add' : 'Edit'} Appointment</h4>
          <button className="chief-icon" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="chief-modal-body grid2">
          <div className="field"><label>Patient</label><input name="patient" value={form.patient} onChange={change} /></div>
          <div className="field"><label>Doctor</label><input name="doctor" value={form.doctor} onChange={change} /></div>
          <div className="field"><label>Date</label><input type="date" name="date" value={form.date} onChange={change} /></div>
          <div className="field"><label>Time</label><input type="time" name="time" value={form.time} onChange={change} /></div>
          <div className="field"><label>Status</label>
            <select name="status" value={form.status} onChange={change}>
              <option>Scheduled</option>
              <option>Confirmed</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          </div>
        </div>
        <div className="chief-modal-actions">
          <button className="chief-btn" onClick={onClose}>Close</button>
          <button className="chief-btn primary" disabled={!canSave} onClick={() => onSave(form)}>Save</button>
        </div>
      </div>
    </div>
  );
}

function ViewAppointmentModal({ appointment, onClose }) {
  return (
    <div className="chief-overlay">
      <div className="chief-modal">
        <div className="chief-modal-head">
          <h4>Appointment Details</h4>
          <button className="chief-icon" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="chief-modal-body grid2">
          <div className="field"><label>ID</label><input readOnly value={appointment.id} /></div>
          <div className="field"><label>Patient</label><input readOnly value={appointment.patient} /></div>
          <div className="field"><label>Doctor</label><input readOnly value={appointment.doctor} /></div>
          <div className="field"><label>Date</label><input readOnly value={appointment.date} /></div>
          <div className="field"><label>Time</label><input readOnly value={appointment.time} /></div>
          <div className="field"><label>Status</label><input readOnly value={appointment.status} /></div>
        </div>
        <div className="chief-modal-actions">
          <button className="chief-btn primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ appointment, onDelete, onClose }) {
  return (
    <div className="chief-overlay">
      <div className="chief-modal">
        <div className="chief-modal-head">
          <h4>Cancel Appointment</h4>
          <button className="chief-icon" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="chief-modal-body">
          <p>
            Cancel <strong>{appointment.id}</strong> for <strong>{appointment.patient}</strong> with{' '}
            <strong>{appointment.doctor}</strong> on <strong>{appointment.date}</strong> at{' '}
            <strong>{appointment.time}</strong>?
          </p>
        </div>
        <div className="chief-modal-actions">
          <button className="chief-btn" onClick={onClose}>Keep</button>
          <button className="chief-btn danger" onClick={onDelete}>Cancel Appointment</button>
        </div>
      </div>
    </div>
  );
}

function PostModal({ onSave, onClose }) {
  const [form, setForm] = useState({ title: '', content: '', category: 'Diet', image: null });
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onFile = (e) => setForm({ ...form, image: e.target.files?.[0] || null });
  const canSave = form.title.trim() && form.content.trim();
  return (
    <div className="chief-overlay">
      <div className="chief-modal">
        <div className="chief-modal-head">
          <h4>Create Post</h4>
          <button className="chief-icon" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="chief-modal-body">
          <div className="field"><label>Title</label><input name="title" value={form.title} onChange={change} /></div>
          <div className="field"><label>Category</label>
            <select name="category" value={form.category} onChange={change}>
              <option>Diet</option><option>Exercise</option><option>Mental Health</option><option>Tips</option>
            </select>
          </div>
          <div className="field"><label>Content</label><textarea name="content" rows={5} value={form.content} onChange={change} /></div>
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
}

function NotifyModal({ onSend, onClose }) {
  const [form, setForm] = useState({
    audience: 'All', toId: '', subject: '', message: '', priority: 'Normal'
  });
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const canSend = form.subject.trim() && form.message.trim();
  return (
    <div className="chief-overlay">
      <div className="chief-modal wide">
        <div className="chief-modal-head">
          <h4>Send Notification</h4>
          <button className="chief-icon" onClick={onClose} aria-label="Close">✕</button>
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
}
