// @AI-HINT: This component displays a fully theme-aware audit log of significant application actions. It uses per-component CSS modules and the cn utility for robust, maintainable styling.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Badge from '@/app/components/Badge/Badge';
import commonStyles from './AuditLog.common.module.css';
import lightStyles from './AuditLog.light.module.css';
import darkStyles from './AuditLog.dark.module.css';

interface LogEntry {
  id: string;
  timestamp: string;
  actor: string; // User who performed the action
  action: string;
  target: string; // The user/item the action was performed on
  details: string;
}

const mockLogs: LogEntry[] = [
  { id: 'log_001', timestamp: '2025-08-08 14:30:15', actor: 'admin@megilance.com', action: 'Suspend User', target: 'charlie@example.com', details: 'Reason: Violation of ToS.' },
  { id: 'log_002', timestamp: '2025-08-08 12:15:00', actor: 'moderator@megilance.com', action: 'Approve Job', target: 'job_002', details: 'Job approved after review.' },
  { id: 'log_003', timestamp: '2025-08-07 18:00:45', actor: 'admin@megilance.com', action: 'Update AI Setting', target: 'Fraud Detection', details: 'Threshold lowered to 0.85.' },
  { id: 'log_004', timestamp: '2025-08-07 10:05:20', actor: 'support@megilance.com', action: 'Resolve Flag', target: 'txn_a1b2c3d4', details: 'Flag dismissed as false positive.' },
];

const AuditLog: React.FC = () => {
  const { theme } = useTheme();

  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.auditLogContainer, themeStyles.auditLogContainer)}>
      <h2 className={cn(commonStyles.auditLogTitle, themeStyles.auditLogTitle)}>System Audit Log</h2>
      <div className={cn(commonStyles.auditLogTableWrapper, themeStyles.auditLogTableWrapper)}>
        <table className={cn(commonStyles.auditLog, themeStyles.auditLog)}>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {mockLogs.map(log => (
              <tr key={log.id}>
                <td>{log.timestamp}</td>
                <td>{log.actor}</td>
                <td><Badge variant="info">{log.action}</Badge></td>
                <td>{log.target}</td>
                <td>{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLog;
