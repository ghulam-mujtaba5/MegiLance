// @AI-HINT: Admin Dashboard page. Theme-aware, accessible, animated KPIs, charts, users table, and quick actions.
'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import { useAdminData } from '@/hooks/useAdmin';
import common from './AdminDashboard.common.module.css';
import light from './AdminDashboard.light.module.css';
import dark from './AdminDashboard.dark.module.css';

interface KPI { id: string; label: string; value: string; trend: string; }
interface UserRow { id: string; name: string; email: string; role: 'Admin' | 'Client' | 'Freelancer'; status: 'Active' | 'Suspended'; joined: string; }

const FALLBACK_KPIS: KPI[] = [
  { id: 'k1', label: 'Active Users', value: '12,418', trend: '+3.2% WoW' },
  { id: 'k2', label: 'New Projects', value: '287', trend: '+5.1% WoW' },
  { id: 'k3', label: 'Revenue', value: '$142k', trend: '+7.8% MoM' },
  { id: 'k4', label: 'Churn', value: '1.2%', trend: '-0.2% MoM' },
];

const FALLBACK_USERS: UserRow[] = [
  { id: 'u1', name: 'Alex Carter', email: 'alex@megilance.com', role: 'Admin', status: 'Active', joined: '2024-11-01' },
  { id: 'u2', name: 'Hannah Lee', email: 'hannah@client.io', role: 'Client', status: 'Active', joined: '2025-02-18' },
  { id: 'u3', name: 'Sofia Gomez', email: 'sofia@freelance.dev', role: 'Freelancer', status: 'Active', joined: '2025-05-03' },
  { id: 'u4', name: 'Priya Patel', email: 'priya@client.io', role: 'Client', status: 'Suspended', joined: '2025-06-22' },
];

const AdminDashboard: React.FC = () => {
  const { theme } = useTheme();
  const themed = theme === 'dark' ? dark : light;

  const { users, kpis, loading, error } = useAdminData();
  const [role, setRole] = useState<'All' | 'Admin' | 'Client' | 'Freelancer'>('All');

  const headerRef = useRef<HTMLDivElement | null>(null);
  const kpiRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const headerVisible = useIntersectionObserver(headerRef, { threshold: 0.1 });
  const kpisVisible = useIntersectionObserver(kpiRef, { threshold: 0.1 });
  const gridVisible = useIntersectionObserver(gridRef, { threshold: 0.1 });

  const effectiveKPIs: KPI[] = useMemo(() => {
    if (!kpis || !Array.isArray(kpis) || kpis.length === 0) return FALLBACK_KPIS;
    return kpis.map((k, idx) => ({ id: String(k.id ?? idx), label: k.label, value: k.value, trend: (k as any).trend ?? '' }));
  }, [kpis]);

  const effectiveUsers: UserRow[] = useMemo(() => {
    const source = users ?? FALLBACK_USERS;
    return source as UserRow[];
  }, [users]);

  const filteredUsers = useMemo(() => {
    return role === 'All' ? effectiveUsers : effectiveUsers.filter(u => u.role === role);
  }, [effectiveUsers, role]);

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <div ref={headerRef} className={cn(common.header, headerVisible ? common.isVisible : common.isNotVisible)}>
          <div>
            <h1 className={common.title}>Admin Dashboard</h1>
            <p className={cn(common.subtitle, themed.subtitle)}>Global overview of platform metrics, users, and operations.</p>
          </div>
          <div className={common.controls} aria-label="Admin dashboard controls">
            <label className={common.srOnly} htmlFor="role">Filter by role</label>
            <select id="role" className={cn(common.select, themed.select)} value={role} onChange={(e) => setRole(e.target.value as any)}>
              {['All','Admin','Client','Freelancer'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button type="button" className={cn(common.button, themed.button)}>Create Announcement</button>
            <button type="button" className={cn(common.button, themed.button, 'secondary')}>Run Maintenance</button>
          </div>
        </div>

        <section ref={kpiRef} className={cn(common.kpis, kpisVisible ? common.isVisible : common.isNotVisible)} aria-label="Key performance indicators">
          {loading && (
            <div className={common.skeletonRow} aria-busy="true" />
          )}
          {!loading && effectiveKPIs.map(k => (
            <div key={k.id} className={cn(common.card, themed.card)} tabIndex={0} aria-labelledby={`kpi-${k.id}-label`}>
              <div id={`kpi-${k.id}-label`} className={cn(common.cardTitle, themed.cardTitle)}>{k.label}</div>
              <div className={common.metric}>{k.value}</div>
              {k.trend && <div className={common.trend}>{k.trend}</div>}
            </div>
          ))}
        </section>

        <section ref={gridRef} className={cn(common.grid, gridVisible ? common.isVisible : common.isNotVisible)}>
          <div className={cn(common.card, themed.card)} aria-label="Users table">
            <div className={cn(common.cardTitle, themed.cardTitle)}>Recent Users</div>
            {error && <div className={common.error}>Failed to load users.</div>}
            <table className={common.table}>
              <thead>
                <tr>
                  <th scope="col" className={themed.th + ' ' + common.th}>Name</th>
                  <th scope="col" className={themed.th + ' ' + common.th}>Email</th>
                  <th scope="col" className={themed.th + ' ' + common.th}>Role</th>
                  <th scope="col" className={themed.th + ' ' + common.th}>Status</th>
                  <th scope="col" className={themed.th + ' ' + common.th}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td className={themed.td + ' ' + common.td}>{u.name}</td>
                    <td className={themed.td + ' ' + common.td}>{u.email}</td>
                    <td className={themed.td + ' ' + common.td}>{u.role}</td>
                    <td className={themed.td + ' ' + common.td}>{u.status}</td>
                    <td className={themed.td + ' ' + common.td}>{u.joined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={cn(common.card, themed.card)} aria-label="Activity chart">
            <div className={cn(common.cardTitle, themed.cardTitle)}>Activity</div>
            {/* SVG bar chart to avoid inline styles */}
            <svg width="100%" height="140" viewBox="0 0 200 140" preserveAspectRatio="none" role="img" aria-label="Weekly activity bars">
              <desc>Bar chart of weekly activity counts</desc>
              {/* background */}
              <rect x="0" y="0" width="200" height="140" fill="transparent" />
              {/* bars */}
              {([40, 68, 55, 90, 120, 70, 95] as const).map((h, i) => (
                <rect key={i} x={10 + i * 28} y={130 - h} width="18" height={h} rx="3" ry="3" className={cn(common.cardTitle)} fill="currentColor" opacity="0.8" />
              ))}
            </svg>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminDashboard;
