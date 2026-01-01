import React, { useState } from 'react';
import './style/Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 'N-001',
      type: 'Override Request',
      from: 'Nurse A',
      to: 'Doctor B',
      status: 'pending',
      message: 'Request to change medication dosage for patient P-001',
      description: 'The nurse requests to increase the dosage of Medication A due to low response in patient. Requires doctor approval.',
      date: '2025-12-19',
    },
    {
      id: 'N-002',
      type: 'Transfer Request',
      from: 'Patient C',
      to: 'Doctor D',
      status: 'approved',
      message: 'Request to transfer appointment from 2025-12-21 to 2025-12-23',
      description: 'Patient wants to move the appointment due to personal reasons. Doctor approved the new date.',
      date: '2025-12-18',
    },
    {
      id: 'N-003',
      type: 'Transfer Request',
      from: 'Patient E',
      to: 'Doctor F',
      status: 'rejected',
      message: 'Request to transfer appointment from 2025-12-22 to 2025-12-24',
      description: 'Patient requested to move the appointment, but the requested slot is unavailable.',
      date: '2025-12-18',
    },
  ]);

  const [filter, setFilter] = useState('');
  const [selectedNotification, setSelectedNotification] = useState(null);

  const filteredNotifications = notifications.filter(
    (n) =>
      n.type.toLowerCase().includes(filter.toLowerCase()) ||
      n.from.toLowerCase().includes(filter.toLowerCase()) ||
      n.to.toLowerCase().includes(filter.toLowerCase()) ||
      n.message.toLowerCase().includes(filter.toLowerCase()) ||
      n.description.toLowerCase().includes(filter.toLowerCase())
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
      <h1>Notifications</h1>
      <p>Review override requests and transfer requests from nurses and patients.</p>

      {/* Search / Filter */}
      <div className="notifications-actions">
        <input
          type="text"
          placeholder="Search by type, from, to, or description"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
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
