import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import './style/Notifications.css';

const Notifications = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [notifications, setNotifications] = useState([
    {
      id: 'N-001',
      type: 'Override Request',
      from: 'Nurse Rania',
      to: 'Dr. Lina Yousef',
      status: 'pending',
      message: 'Request to review symptom update for patient P-001',
      description: 'A care team member flagged a fictional symptom update for clinician review.',
      date: '2025-12-19',
    },
    {
      id: 'N-002',
      type: 'Transfer Request',
      from: 'Patient P-002',
      to: 'Dr. Omar Khaled',
      status: 'approved',
      message: 'Request to transfer appointment from 2025-12-21 to 2025-12-23',
      description: 'A fictional appointment transfer request was approved for the new date.',
      date: '2025-12-18',
    },
    {
      id: 'N-003',
      type: 'Transfer Request',
      from: 'Patient P-003',
      to: 'Dr. Lina Yousef',
      status: 'rejected',
      message: 'Request to transfer appointment from 2025-12-22 to 2025-12-24',
      description: 'A fictional appointment transfer request was rejected because the requested slot is unavailable.',
      date: '2025-12-18',
    },
  ]);

  const [filter, setFilter] = useState(searchParams.get('search') || '');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const activeStatus = searchParams.get('status');

  const filteredNotifications = notifications.filter(
    (n) =>
      (!activeStatus || n.status === activeStatus) &&
      (n.type.toLowerCase().includes(filter.toLowerCase()) ||
        n.from.toLowerCase().includes(filter.toLowerCase()) ||
        n.to.toLowerCase().includes(filter.toLowerCase()) ||
        n.message.toLowerCase().includes(filter.toLowerCase()) ||
        n.description.toLowerCase().includes(filter.toLowerCase()))
  );

  const openModal = (notification) => setSelectedNotification(notification);
  const closeModal = () => setSelectedNotification(null);

  const handleAction = (id, action) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, status: action }
          : n
      )
    );
    closeModal();
  };

  return (
    <div className="notifications-page">
      <h1>Notification Management</h1>
      <p>Review admin and registration messages designed to support the connected care workflow.</p>

      {/* Search / Filter */}
      <div className="notifications-actions">
        <input
          type="text"
          placeholder="Search by type, from, to, or description"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        {(activeStatus || searchParams.get('search')) && (
          <div className="workflow-filter-chip">
            <span>Filtered by: {activeStatus ? activeStatus : `Search "${searchParams.get('search')}"`}</span>
            <button type="button" onClick={() => { setSearchParams({}); setFilter(''); }}>Clear filter</button>
          </div>
        )}
      </div>

      {/* Notifications Feed */}
      <div className="notifications-feed">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              className={`notification-card ${n.status}`}
              onClick={() => openModal(n)}
            >
              <div>
                <span className="notif-type">{n.type}</span>
                <p className="notif-message">{n.message}</p>
                <p className="notif-description">{n.description}</p>
                <small>From: {n.from} | To: {n.to} | Date: {n.date}</small>
              </div>
              <div className="notif-actions">
                <button>View</button>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-state">No notifications found</p>
        )}
      </div>

      {/* Modal */}
      {selectedNotification && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{selectedNotification.type}</h2>
            <p><strong>Message:</strong> {selectedNotification.message}</p>
            <p><strong>Description:</strong> {selectedNotification.description}</p>
            <p><strong>From:</strong> {selectedNotification.from}</p>
            <p><strong>To:</strong> {selectedNotification.to}</p>
            <p><strong>Date:</strong> {selectedNotification.date}</p>
            <p><strong>Status:</strong> {selectedNotification.status}</p>
            <div className="modal-actions">
              <button onClick={closeModal}>Close</button>
              {selectedNotification.status === 'pending' && (
                <>
                  <button className="approve" onClick={() => handleAction(selectedNotification.id, 'approved')}>Approve</button>
                  <button className="reject" onClick={() => handleAction(selectedNotification.id, 'rejected')}>Reject</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
