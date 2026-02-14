// @AI-HINT: Notifications list component for client and freelancer portals
'use client';

import { useEffect, useState } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
    setNotifications([]);
  }, []);

  if (loading) return <div>Loading notifications...</div>;

  if (notifications.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>No notifications yet.</p>
      </div>
    );
  }

  return (
    <div>
      {notifications.map(n => (
        <div key={n.id} style={{ padding: '1rem', borderBottom: '1px solid #eee', opacity: n.read ? 0.6 : 1 }}>
          <strong>{n.title}</strong>
          <p>{n.message}</p>
          <small>{new Date(n.created_at).toLocaleDateString()}</small>
        </div>
      ))}
    </div>
  );
}
