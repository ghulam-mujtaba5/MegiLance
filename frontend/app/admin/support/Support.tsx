// @AI-HINT: This is the Support Ticket Management page for admins. All styles are per-component only.
'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/app/components/Button/Button';
import './Support.common.css';
import './Support.light.css';
import './Support.dark.css';

interface SupportProps {
  theme?: 'light' | 'dark';
}

interface Ticket {
  id: string;
  subject: string;
  user: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Closed';
  lastUpdate: string;
}

const Support: React.FC<SupportProps> = ({ theme = 'light' }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/support');
        if (!response.ok) {
          throw new Error('Failed to fetch support tickets');
        }
        const data = await response.json();
        setTickets(data.tickets);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  return (
    <div className={`Support Support--${theme}`}>
      <header className="Support-header">
        <h1>Support Tickets</h1>
        <p>View and manage all user support requests.</p>
      </header>

      <div className={`Support-table-container Support-table-container--${theme}`}>
        {loading && <div className="Support-status">Loading tickets...</div>}
        {error && <div className="Support-status Support-status--error">Error: {error}</div>}
        {!loading && !error && (
          <table className="Support-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Subject</th>
                <th>User</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Last Update</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => (
                <tr key={ticket.id}>
                  <td>{ticket.id}</td>
                  <td>{ticket.subject}</td>
                  <td>{ticket.user}</td>
                  <td>
                    <span className={`priority-badge priority-badge--${ticket.priority}`}>{ticket.priority}</span>
                  </td>
                  <td>
                    <span className={`status-badge status-badge--${ticket.status.replace(/\s+/g, '-')}`}>{ticket.status}</span>
                  </td>
                  <td>{ticket.lastUpdate}</td>
                  <td>
                    <Button variant="outline" size="small">View Ticket</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Support;
