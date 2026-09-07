import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  async function load() {
    const response = await api.get('/notifications');
    setNotifications(response.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id) {
    await api.patch(`/notifications/${id}/read`);
    await load();
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Bildirimler</h1>
          <p>Sistem ve müşteri bildirimlerini takip edin.</p>
        </div>
      </div>

      <div className="panel-card">
        <div className="notification-list">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={
                n.status === 'READ'
                  ? 'notification-item'
                  : 'notification-item unread'
              }
            >
              <div>
                <div className="notification-title">
                  {n.title}
                </div>

                <div className="notification-message">
                  {n.message}
                </div>

                <div className="sub-text">
                  {n.channel} ·{' '}
                  {new Date(n.createdAt).toLocaleString(
                    'tr-TR',
                  )}
                </div>
              </div>

              {n.status !== 'READ' && (
                <button
                  className="small-button"
                  onClick={() => markRead(n.id)}
                >
                  Okundu
                </button>
              )}
            </div>
          ))}

          {!notifications.length && (
            <div className="empty-state">
              Bildirim bulunmuyor.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
