// @AI-HINT: This is the User Management page for admins to view, search, and manage users. All styles are per-component only.
'use client';

import React, { useState, useEffect } from 'react';
import Input from '@/app/components/Input/Input';
import Button from '@/app/components/Button/Button';
import UserAvatar from '@/app/components/UserAvatar/UserAvatar';
import './Users.common.css';
import './Users.light.css';
import './Users.dark.css';

interface UsersProps {
  theme?: 'light' | 'dark';
}

interface User {
    id: string;
    name: string;
    email: string;
    type: 'Freelancer' | 'Client';
    status: 'Active' | 'Suspended';
    joined: string;
}

const Users: React.FC<UsersProps> = ({ theme = 'light' }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data: User[] = await response.json();
        setUsers(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return <div className={`Users-status Users-status--${theme}`}>Loading users...</div>;
  }

  if (error) {
    return <div className={`Users-status Users-status--error Users-status--${theme}`}>Error: {error}</div>;
  }

  return (
    <div className={`Users Users--${theme}`}>
      <header className="Users-header">
        <h1>User Management</h1>
        <div className="Users-actions">
          <Input theme={theme} type="search" placeholder="Search by name or email..." />
          <Button theme={theme} variant="primary">Add User</Button>
        </div>
      </header>

      <div className={`Users-table-container Users-table-container--${theme}`}>
        <table className="Users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Date Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="User-info">
                    <UserAvatar theme={theme} name={user.name} />
                    <div>
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </div>
                  </div>
                </td>
                <td>{user.type}</td>
                <td>
                  <span className={`status-badge status-badge--${user.status.toLowerCase()}`}>{user.status}</span>
                </td>
                <td>{user.joined}</td>
                <td>
                  <div className="Table-actions">
                    <Button theme={theme} variant="outline" size="small">View</Button>
                    <Button theme={theme} variant="danger-outline" size="small">Suspend</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
