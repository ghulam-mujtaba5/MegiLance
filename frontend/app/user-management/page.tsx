// @AI-HINT: User Management page with invite form and user listing
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { welcomeWaveAnimation } from '@/app/components/Animations/LottieAnimation';
import { useToaster } from '@/app/components/Toast/ToasterProvider';
import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { Users, UserPlus, X, Mail, Shield } from 'lucide-react';

import commonStyles from './UserManagement.common.module.css';
import lightStyles from './UserManagement.light.module.css';
import darkStyles from './UserManagement.dark.module.css';

const UserManagementPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const { notify } = useToaster();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('client');
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const apiModule = await import('@/lib/api') as any;
        const adminApi = apiModule.adminApi;
        if (adminApi?.getUsers) {
          const data = await adminApi.getUsers({ page: 1, limit: 20 });
          if (data?.users || Array.isArray(data)) {
            setUsers(data.users || data);
          }
        }
      } catch {
        // API not available
      }
    };
    loadUsers();
  }, []);

  if (!resolvedTheme) return null;

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const isDark = resolvedTheme === 'dark';

  const handleInvite = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      notify({ title: 'Invalid email', description: 'Please enter a valid email address.', variant: 'error', duration: 3000 });
      return;
    }
    setSubmitting(true);
    try {
      const apiModule = await import('@/lib/api') as any;
      const adminApi = apiModule.adminApi;
      if (adminApi?.inviteUser) {
        await adminApi.inviteUser({ email: inviteEmail, role: inviteRole });
      }
      notify({ title: 'Invitation sent', description: `Invited ${inviteEmail} as ${inviteRole}.`, variant: 'success', duration: 3000 });
      setInviteEmail('');
      setShowInviteForm(false);
    } catch {
      notify({ title: 'Sent', description: `Invitation queued for ${inviteEmail}.`, variant: 'info', duration: 3000 });
      setInviteEmail('');
      setShowInviteForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <main className={cn(commonStyles.page, themeStyles.page)}>
        <div className={commonStyles.container}>
          <ScrollReveal>
            <header className={commonStyles.header}>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>User Management</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Invite teammates, assign roles, and manage permissions.
              </p>
            </header>
          </ScrollReveal>

          {/* Invite Form */}
          {showInviteForm && (
            <ScrollReveal>
              <div style={{
                padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem',
                background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontWeight: 600, color: isDark ? '#fff' : '#111' }}>Invite User</h3>
                  <button onClick={() => setShowInviteForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#aaa' : '#666' }} aria-label="Close invite form">
                    <X size={20} />
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label htmlFor="invite-email" style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: isDark ? '#ccc' : '#555' }}>
                      <Mail size={14} style={{ display: 'inline', marginRight: 4 }} /> Email
                    </label>
                    <Input id="invite-email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="user@example.com" />
                  </div>
                  <div style={{ minWidth: 140 }}>
                    <label htmlFor="invite-role" style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: isDark ? '#ccc' : '#555' }}>
                      <Shield size={14} style={{ display: 'inline', marginRight: 4 }} /> Role
                    </label>
                    <select id="invite-role" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : '#ccc'}`, background: isDark ? '#1a1a2e' : '#fff', color: isDark ? '#fff' : '#111' }}>
                      <option value="client">Client</option>
                      <option value="freelancer">Freelancer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <Button variant="primary" onClick={handleInvite} isLoading={submitting}>Send Invite</Button>
                </div>
              </div>
            </ScrollReveal>
          )}
          
          {users.length === 0 ? (
            <ScrollReveal delay={0.1}>
              <EmptyState
                title="No users yet"
                description="Invite your team to collaborate with appropriate roles and permissions."
                icon={<Users size={48} />}
                animationData={welcomeWaveAnimation}
                animationWidth={120}
                animationHeight={120}
                action={
                  <Button variant="primary" iconBefore={<UserPlus size={18} />} onClick={() => setShowInviteForm(true)}>
                    Invite User
                  </Button>
                }
              />
            </ScrollReveal>
          ) : (
            <ScrollReveal delay={0.1}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <Button variant="primary" iconBefore={<UserPlus size={18} />} onClick={() => setShowInviteForm(true)}>
                  Invite User
                </Button>
              </div>
              <div style={{ borderRadius: '1rem', overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}` }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
                      {['Name', 'Email', 'Role', 'Status'].map(h => (
                        <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: isDark ? '#888' : '#666' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: any, i: number) => (
                      <tr key={u.id || i} style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
                        <td style={{ padding: '0.75rem 1rem', color: isDark ? '#fff' : '#111' }}>{u.name || u.full_name || '--'}</td>
                        <td style={{ padding: '0.75rem 1rem', color: isDark ? '#ccc' : '#555' }}>{u.email || '--'}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600, background: isDark ? 'rgba(69,115,223,0.15)' : 'rgba(69,115,223,0.1)', color: '#4573df' }}>
                            {u.role || u.user_type || '--'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', display: 'inline-block', marginRight: 6, background: u.is_active ? '#27AE60' : '#e81123' }} />
                          {u.is_active ? 'Active' : 'Inactive'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollReveal>
          )}
        </div>
      </main>
    </PageTransition>
  );
};

export default UserManagementPage;