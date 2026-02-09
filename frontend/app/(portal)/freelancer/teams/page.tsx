// @AI-HINT: Teams/Collaboration page - Manage team members, invites, and permissions
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { teamsApi as _teamsApi } from '@/lib/api';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import commonStyles from './Teams.common.module.css';
import lightStyles from './Teams.light.module.css';
import darkStyles from './Teams.dark.module.css';
import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import Badge from '@/app/components/Badge/Badge';
import { Users, UserPlus, Mail, Shield, Eye, Trash2, RotateCw, X } from 'lucide-react';

const teamsApi: any = _teamsApi;

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
  
  // Confirmation modal state
  const [confirmAction, setConfirmAction] = useState<{ type: string; id: string; label: string } | null>(null);
  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
      
      // Use API data if available, otherwise show empty state
      let membersData: TeamMember[] = [];
      let invitesData: Invite[] = [];
      
      if (membersRes && (membersRes.members?.length > 0 || Array.isArray(membersRes) && membersRes.length > 0)) {
        membersData = membersRes.members || membersRes;
      }

      if (invitesRes && (invitesRes.invites?.length > 0 || Array.isArray(invitesRes) && invitesRes.length > 0)) {
        invitesData = invitesRes.invites || invitesRes;
      }

      setMembers(membersData);
      setInvites(invitesData);
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
    setConfirmAction({ type: 'remove-member', id: memberId, label: 'remove this team member' });
  };

  const handleResendInvite = async (inviteId: string) => {
    try {
      await teamsApi.resendInvite(inviteId);
      showToast('Invite resent successfully!', 'success');
    } catch (error) {
      console.error('Failed to resend invite:', error);
      showToast('Failed to resend invite', 'error');
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    setConfirmAction({ type: 'cancel-invite', id: inviteId, label: 'cancel this invite' });
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'remove-member') {
        await teamsApi.removeMember(confirmAction.id);
        showToast('Team member removed', 'success');
      } else if (confirmAction.type === 'cancel-invite') {
        await teamsApi.cancelInvite(confirmAction.id);
        showToast('Invite cancelled', 'success');
      }
      loadTeamData();
    } catch (error) {
      console.error('Action failed:', error);
      showToast('Action failed. Please try again.', 'error');
    } finally {
      setConfirmAction(null);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
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
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        {/* Header */}
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Team Management</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Manage your team members and permissions
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowInviteModal(true)}
            >
              <UserPlus size={16} /> Invite Member
            </Button>
          </div>
        </ScrollReveal>

        {/* Stats */}
        <StaggerContainer delay={0.1} className={commonStyles.stats}>
          <StaggerItem>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={commonStyles.statValue}>{members.length}</span>
              <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Team Members</span>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={commonStyles.statValue}>{members.filter(m => m.status === 'active').length}</span>
              <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Active</span>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={commonStyles.statValue}>{pendingInvites.length}</span>
              <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Pending Invites</span>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* Tabs */}
        <ScrollReveal delay={0.2}>
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
              Invites
            </button>
          </div>
        </ScrollReveal>

        {/* Content */}
        <div className={commonStyles.content}>
          {activeTab === 'members' && (
            <StaggerContainer delay={0.3} className={commonStyles.membersList}>
              {members.map(member => (
                <StaggerItem key={member.id}>
                  <div className={cn(commonStyles.memberCard, themeStyles.memberCard)}>
                    <div className={commonStyles.memberInfo}>
                      <div className={cn(commonStyles.avatar, themeStyles.avatar)}>
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.name} />
                        ) : (
                          <span>{getInitials(member.name)}</span>
                        )}
                      </div>
                      <div>
                        <h3 className={cn(commonStyles.memberName, themeStyles.memberName)}>{member.name}</h3>
                        <p className={cn(commonStyles.memberEmail, themeStyles.memberEmail)}>{member.email}</p>
                      </div>
                    </div>
                      <div className={commonStyles.memberMeta}>
                      <Badge variant={member.role === 'owner' ? 'primary' : member.role === 'admin' ? 'warning' : 'default'}>{member.role}</Badge>
                      <span className={cn(commonStyles.statusText, themeStyles.statusText)}>
                        {member.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                      <div className={commonStyles.actions}>
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member);
                            setShowRoleModal(true);
                          }}
                        >
                          <Shield size={14} /> Edit Role
                        </Button>
                        {member.role !== 'owner' && (
                          <Button 
                            variant="danger"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <Trash2 size={14} /> Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}

          {activeTab === 'invites' && (
            <StaggerContainer delay={0.3} className={commonStyles.invitesList}>
              {invites.length === 0 ? (
                <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                  No pending invites
                </div>
              ) : (
                invites.map(invite => (
                  <StaggerItem key={invite.id}>
                    <div className={cn(commonStyles.inviteCard, themeStyles.inviteCard)}>
                      <div className={commonStyles.inviteInfo}>
                        <div className={cn(commonStyles.inviteIcon, themeStyles.inviteIcon)}>✉️</div>
                        <div>
                          <h3 className={cn(commonStyles.inviteEmail, themeStyles.inviteEmail)}>{invite.email}</h3>
                          <p className={cn(commonStyles.inviteMeta, themeStyles.inviteMeta)}>
                            Role: {invite.role} • Sent {formatTimeAgo(invite.sent_at)}
                          </p>
                        </div>
                      </div>
                      <div className={commonStyles.actions}>
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResendInvite(invite.id)}
                        >
                          <RotateCw size={14} /> Resend
                        </Button>
                        <Button 
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancelInvite(invite.id)}
                        >
                          <X size={14} /> Cancel
                        </Button>
                      </div>
                    </div>
                  </StaggerItem>
                ))
              )}
            </StaggerContainer>
          )}
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className={commonStyles.modalOverlay}>
            <div className={cn(commonStyles.modal, themeStyles.modal)}>
              <h2 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>Invite Team Member</h2>
              <div className={commonStyles.formGroup}>
                <label className={cn(commonStyles.label, themeStyles.label)}>Email Address</label>
                <Input
                  type="email"
                  value={inviteForm.email}
                  onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="colleague@example.com"
                />
              </div>
              <div className={commonStyles.formGroup}>
                <label className={cn(commonStyles.label, themeStyles.label)}>Role</label>
                <div className={commonStyles.roleOptions}>
                  {roles.map(role => (
                    <label 
                      key={role.id} 
                      className={cn(
                        commonStyles.roleOption, 
                        themeStyles.roleOption,
                        inviteForm.role === role.id && commonStyles.selectedRole,
                        inviteForm.role === role.id && themeStyles.selectedRole
                      )}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.id}
                        checked={inviteForm.role === role.id}
                        onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
                      />
                      <div>
                        <span className={commonStyles.roleName}>{role.label}</span>
                        <span className={commonStyles.roleDesc}>{role.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className={commonStyles.modalActions}>
                <Button
                  variant="ghost"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleInvite}
                >
                  Send Invite
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Role Modal */}
        {showRoleModal && selectedMember && (
          <div className={commonStyles.modalOverlay}>
            <div className={cn(commonStyles.modal, themeStyles.modal)}>
              <h2 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>Edit Role for {selectedMember.name}</h2>
              <div className={commonStyles.formGroup}>
                <div className={commonStyles.roleOptions}>
                  {roles.map(role => (
                    <label 
                      key={role.id} 
                      className={cn(
                        commonStyles.roleOption, 
                        themeStyles.roleOption,
                        selectedMember.role === role.id && commonStyles.selectedRole,
                        selectedMember.role === role.id && themeStyles.selectedRole
                      )}
                    >
                      <input
                        type="radio"
                        name="editRole"
                        value={role.id}
                        checked={selectedMember.role === role.id}
                        onChange={() => handleUpdateRole(selectedMember.id, role.id)}
                      />
                      <div>
                        <span className={commonStyles.roleName}>{role.label}</span>
                        <span className={commonStyles.roleDesc}>{role.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className={commonStyles.modalActions}>
                <Button
                  variant="ghost"
                  onClick={() => setShowRoleModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmAction && (
          <div className={commonStyles.modalOverlay}>
            <div className={cn(commonStyles.modal, themeStyles.modal)}>
              <h2 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>Confirm Action</h2>
              <p className={cn(commonStyles.confirmText, themeStyles.confirmText)}>
                Are you sure you want to {confirmAction.label}? This action cannot be undone.
              </p>
              <div className={commonStyles.modalActions}>
                <Button variant="ghost" onClick={() => setConfirmAction(null)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={executeConfirmAction}>
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Toast notification */}
        {toast && (
          <div className={cn(
            commonStyles.toast,
            themeStyles.toast,
            toast.type === 'error' && commonStyles.toastError
          )}>
            {toast.message}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
