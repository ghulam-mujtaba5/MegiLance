// @AI-HINT: Teams/Collaboration page - Manage team members, invites, and permissions
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { teamsApi } from '@/lib/api';
import commonStyles from './Teams.common.module.css';
import lightStyles from './Teams.light.module.css';
import darkStyles from './Teams.dark.module.css';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joined_at: string;
  last_active?: string;
  status: 'active' | 'pending' | 'inactive';
}

interface Invite {
  id: string;
  email: string;
  role: string;
  sent_at: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired';
}

export default function TeamsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'members' | 'invites' | 'roles'>('members');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  
  // Invite form
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'member',
  });

  const roles = [
    { id: 'owner', label: 'Owner', description: 'Full access to everything including billing' },
    { id: 'admin', label: 'Admin', description: 'Can manage team members and projects' },
    { id: 'member', label: 'Member', description: 'Can work on projects and proposals' },
    { id: 'viewer', label: 'Viewer', description: 'Read-only access to projects' },
  ];

  useEffect(() => {
    setMounted(true);
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      const [membersRes, invitesRes] = await Promise.all([
        teamsApi.getMembers().catch(() => null),
        teamsApi.getInvites().catch(() => null),
      ]);
      
      const mockMembers: TeamMember[] = membersRes?.members || [
        {
          id: '1',
          name: 'John Smith',
          email: 'john@example.com',
          role: 'owner',
          joined_at: new Date(Date.now() - 365 * 86400000).toISOString(),
          last_active: new Date(Date.now() - 300000).toISOString(),
          status: 'active',
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          role: 'admin',
          joined_at: new Date(Date.now() - 180 * 86400000).toISOString(),
          last_active: new Date(Date.now() - 3600000).toISOString(),
          status: 'active',
        },
        {
          id: '3',
          name: 'Mike Chen',
          email: 'mike@example.com',
          role: 'member',
          joined_at: new Date(Date.now() - 90 * 86400000).toISOString(),
          last_active: new Date(Date.now() - 86400000).toISOString(),
          status: 'active',
        },
        {
          id: '4',
          name: 'Emily Davis',
          email: 'emily@example.com',
          role: 'viewer',
          joined_at: new Date(Date.now() - 30 * 86400000).toISOString(),
          status: 'inactive',
        },
      ];

      const mockInvites: Invite[] = invitesRes?.invites || [
        {
          id: '1',
          email: 'new.member@example.com',
          role: 'member',
          sent_at: new Date(Date.now() - 86400000).toISOString(),
          expires_at: new Date(Date.now() + 6 * 86400000).toISOString(),
          status: 'pending',
        },
        {
          id: '2',
          email: 'contractor@example.com',
          role: 'viewer',
          sent_at: new Date(Date.now() - 172800000).toISOString(),
          expires_at: new Date(Date.now() + 5 * 86400000).toISOString(),
          status: 'pending',
        },
      ];

      setMembers(mockMembers);
      setInvites(mockInvites);
    } catch (error) {
      console.error('Failed to load team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteForm.email.trim()) return;
    
    try {
      await teamsApi.inviteMember({
        email: inviteForm.email,
        role: inviteForm.role,
      });
      setShowInviteModal(false);
      setInviteForm({ email: '', role: 'member' });
      loadTeamData();
    } catch (error) {
      console.error('Failed to send invite:', error);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      await teamsApi.updateRole(memberId, newRole);
      setShowRoleModal(false);
      setSelectedMember(null);
      loadTeamData();
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    
    try {
      await teamsApi.removeMember(memberId);
      loadTeamData();
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleResendInvite = async (inviteId: string) => {
    try {
      await teamsApi.resendInvite(inviteId);
      alert('Invite resent!');
    } catch (error) {
      console.error('Failed to resend invite:', error);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm('Are you sure you want to cancel this invite?')) return;
    
    try {
      await teamsApi.cancelInvite(inviteId);
      loadTeamData();
    } catch (error) {
      console.error('Failed to cancel invite:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (mins < 5) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const pendingInvites = invites.filter(i => i.status === 'pending');

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={cn(commonStyles.loading, themeStyles.loading)}>Loading team data...</div>
      </div>
    );
  }

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      {/* Header */}
      <div className={commonStyles.header}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>Team Management</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Manage your team members and permissions
          </p>
        </div>
        <button
          className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}
          onClick={() => setShowInviteModal(true)}
        >
          + Invite Member
        </button>
      </div>

      {/* Stats */}
      <div className={commonStyles.stats}>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <span className={commonStyles.statValue}>{members.length}</span>
          <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Team Members</span>
        </div>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <span className={commonStyles.statValue}>{members.filter(m => m.status === 'active').length}</span>
          <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Active</span>
        </div>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <span className={commonStyles.statValue}>{pendingInvites.length}</span>
          <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Pending Invites</span>
        </div>
      </div>

      {/* Tabs */}
      <div className={cn(commonStyles.tabs, themeStyles.tabs)}>
        <button
          className={cn(
            commonStyles.tab, 
            themeStyles.tab, 
            activeTab === 'members' && commonStyles.activeTab,
            activeTab === 'members' && themeStyles.activeTab
          )}
          onClick={() => setActiveTab('members')}
        >
          Members
        </button>
        <button
          className={cn(
            commonStyles.tab, 
            themeStyles.tab, 
            activeTab === 'invites' && commonStyles.activeTab,
            activeTab === 'invites' && themeStyles.activeTab
          )}
          onClick={() => setActiveTab('invites')}
        >
          Pending Invites ({pendingInvites.length})
        </button>
        <button
          className={cn(
            commonStyles.tab, 
            themeStyles.tab, 
            activeTab === 'roles' && commonStyles.activeTab,
            activeTab === 'roles' && themeStyles.activeTab
          )}
          onClick={() => setActiveTab('roles')}
        >
          Roles & Permissions
        </button>
      </div>

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className={commonStyles.membersList}>
          {members.map((member) => (
            <div key={member.id} className={cn(commonStyles.memberCard, themeStyles.memberCard)}>
              <div className={commonStyles.memberInfo}>
                <div className={cn(commonStyles.avatar, themeStyles.avatar)}>
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.name} />
                  ) : (
                    getInitials(member.name)
                  )}
                </div>
                <div className={commonStyles.memberDetails}>
                  <h3 className={cn(commonStyles.memberName, themeStyles.memberName)}>
                    {member.name}
                    {member.role === 'owner' && (
                      <span className={cn(commonStyles.ownerBadge, themeStyles.ownerBadge)}>Owner</span>
                    )}
                  </h3>
                  <p className={cn(commonStyles.memberEmail, themeStyles.memberEmail)}>{member.email}</p>
                  <div className={cn(commonStyles.memberMeta, themeStyles.memberMeta)}>
                    <span>Joined {formatDate(member.joined_at)}</span>
                    {member.last_active && <span>• Active {formatTimeAgo(member.last_active)}</span>}
                  </div>
                </div>
              </div>

              <div className={commonStyles.memberActions}>
                <span className={cn(
                  commonStyles.roleBadge,
                  commonStyles[`role${member.role.charAt(0).toUpperCase() + member.role.slice(1)}`],
                  themeStyles[`role${member.role.charAt(0).toUpperCase() + member.role.slice(1)}`]
                )}>
                  {member.role}
                </span>
                {member.role !== 'owner' && (
                  <>
                    <button
                      className={cn(commonStyles.actionButton, themeStyles.actionButton)}
                      onClick={() => {
                        setSelectedMember(member);
                        setShowRoleModal(true);
                      }}
                    >
                      Change Role
                    </button>
                    <button
                      className={cn(commonStyles.dangerButton, themeStyles.dangerButton)}
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invites Tab */}
      {activeTab === 'invites' && (
        <div className={commonStyles.invitesList}>
          {pendingInvites.length === 0 ? (
            <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
              <span className={commonStyles.emptyIcon}>📧</span>
              <p>No pending invites</p>
            </div>
          ) : (
            pendingInvites.map((invite) => (
              <div key={invite.id} className={cn(commonStyles.inviteCard, themeStyles.inviteCard)}>
                <div className={commonStyles.inviteInfo}>
                  <h3 className={cn(commonStyles.inviteEmail, themeStyles.inviteEmail)}>{invite.email}</h3>
                  <p className={cn(commonStyles.inviteMeta, themeStyles.inviteMeta)}>
                    Invited as <strong>{invite.role}</strong> • Sent {formatDate(invite.sent_at)}
                  </p>
                  <p className={cn(commonStyles.expiresAt, themeStyles.expiresAt)}>
                    Expires {formatDate(invite.expires_at)}
                  </p>
                </div>
                <div className={commonStyles.inviteActions}>
                  <button
                    className={cn(commonStyles.actionButton, themeStyles.actionButton)}
                    onClick={() => handleResendInvite(invite.id)}
                  >
                    Resend
                  </button>
                  <button
                    className={cn(commonStyles.dangerButton, themeStyles.dangerButton)}
                    onClick={() => handleCancelInvite(invite.id)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className={commonStyles.rolesGrid}>
          {roles.map((role) => (
            <div key={role.id} className={cn(commonStyles.roleCard, themeStyles.roleCard)}>
              <div className={commonStyles.roleHeader}>
                <h3 className={cn(commonStyles.roleName, themeStyles.roleName)}>{role.label}</h3>
                <span className={cn(commonStyles.roleCount, themeStyles.roleCount)}>
                  {members.filter(m => m.role === role.id).length} members
                </span>
              </div>
              <p className={cn(commonStyles.roleDescription, themeStyles.roleDescription)}>
                {role.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className={cn(commonStyles.modal, themeStyles.modal)}>
          <div className={cn(commonStyles.modalContent, themeStyles.modalContent)}>
            <div className={commonStyles.modalHeader}>
              <h2>Invite Team Member</h2>
              <button
                className={cn(commonStyles.closeButton, themeStyles.closeButton)}
                onClick={() => setShowInviteModal(false)}
              >
                ✕
              </button>
            </div>
            <div className={commonStyles.modalBody}>
              <div className={commonStyles.formGroup}>
                <label>Email Address</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className={cn(commonStyles.input, themeStyles.input)}
                  placeholder="colleague@example.com"
                />
              </div>
              <div className={commonStyles.formGroup}>
                <label>Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className={cn(commonStyles.select, themeStyles.select)}
                >
                  {roles.filter(r => r.id !== 'owner').map(role => (
                    <option key={role.id} value={role.id}>{role.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={commonStyles.modalFooter}>
              <button
                className={cn(commonStyles.secondaryButton, themeStyles.secondaryButton)}
                onClick={() => setShowInviteModal(false)}
              >
                Cancel
              </button>
              <button
                className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}
                onClick={handleInvite}
                disabled={!inviteForm.email.trim()}
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {showRoleModal && selectedMember && (
        <div className={cn(commonStyles.modal, themeStyles.modal)}>
          <div className={cn(commonStyles.modalContent, themeStyles.modalContent)}>
            <div className={commonStyles.modalHeader}>
              <h2>Change Role</h2>
              <button
                className={cn(commonStyles.closeButton, themeStyles.closeButton)}
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedMember(null);
                }}
              >
                ✕
              </button>
            </div>
            <div className={commonStyles.modalBody}>
              <p className={cn(commonStyles.modalText, themeStyles.modalText)}>
                Select a new role for <strong>{selectedMember.name}</strong>
              </p>
              <div className={commonStyles.roleOptions}>
                {roles.filter(r => r.id !== 'owner').map(role => (
                  <label
                    key={role.id}
                    className={cn(
                      commonStyles.roleOption,
                      themeStyles.roleOption,
                      selectedMember.role === role.id && commonStyles.roleSelected,
                      selectedMember.role === role.id && themeStyles.roleSelected
                    )}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.id}
                      checked={selectedMember.role === role.id}
                      onChange={(e) => setSelectedMember({ ...selectedMember, role: e.target.value as any })}
                    />
                    <div>
                      <span className={commonStyles.optionLabel}>{role.label}</span>
                      <span className={cn(commonStyles.optionDesc, themeStyles.optionDesc)}>
                        {role.description}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className={commonStyles.modalFooter}>
              <button
                className={cn(commonStyles.secondaryButton, themeStyles.secondaryButton)}
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedMember(null);
                }}
              >
                Cancel
              </button>
              <button
                className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}
                onClick={() => handleUpdateRole(selectedMember.id, selectedMember.role)}
              >
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
