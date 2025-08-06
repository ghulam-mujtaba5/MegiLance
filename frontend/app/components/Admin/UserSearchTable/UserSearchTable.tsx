// @AI-HINT: This component demonstrates a robust, theme-aware user management table. It leverages CSS variables for theming, ensuring that all colors, borders, and backgrounds are defined in per-theme modules for maximum maintainability and consistency.
'use client';

import React, { useState } from 'react';
import { useTheme } from '@/app/contexts/ThemeContext';
import Badge from '@/app/components/Badge/Badge';
import Button from '@/app/components/Button/Button';
import { cn } from '@/lib/utils';
import commonStyles from './UserSearchTable.common.module.css';
import lightStyles from './UserSearchTable.light.module.css';
import darkStyles from './UserSearchTable.dark.module.css';

// Mock data for demonstration
const mockUsers = [
  { id: 'usr_001', name: 'Alice Johnson', email: 'alice@example.com', role: 'Freelancer', status: 'Active' },
  { id: 'usr_002', name: 'Bob Williams', email: 'bob@example.com', role: 'Client', status: 'Active' },
  { id: 'usr_003', name: 'Charlie Brown', email: 'charlie@example.com', role: 'Freelancer', status: 'Suspended' },
  { id: 'usr_004', name: 'Diana Prince', email: 'diana@example.com', role: 'Admin', status: 'Active' },
  { id: 'usr_005', name: 'Ethan Hunt', email: 'ethan@example.com', role: 'Client', status: 'Inactive' },
];

const UserSearchTable: React.FC = () => {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!theme) return null;

  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={cn(commonStyles.header, themeStyles.header)}>
        <h2 className={cn(commonStyles.title, themeStyles.title)}>User Management</h2>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={cn(commonStyles.searchInput, themeStyles.searchInput)}
        />
      </div>
      <div className={cn(commonStyles.tableWrapper, themeStyles.tableWrapper)}>
        <table className={cn(commonStyles.table, themeStyles.table)}>
          <thead>
            <tr>
              <th>User ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td><Badge variant={user.role === 'Admin' ? 'primary' : 'secondary'}>{user.role}</Badge></td>
                <td><Badge variant={user.status === 'Active' ? 'success' : 'danger'}>{user.status}</Badge></td>
                <td className={cn(commonStyles.actions, themeStyles.actions)}>
                  <Button variant="secondary" size="small">View</Button>
                  <Button variant="primary" size="small">Edit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserSearchTable;
