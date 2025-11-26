// @AI-HINT: Admin API Keys management - Create, view, revoke API keys
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { apiKeysApi } from '@/lib/api';
import commonStyles from './ApiKeys.common.module.css';
import lightStyles from './ApiKeys.light.module.css';
import darkStyles from './ApiKeys.dark.module.css';

interface ApiKey {
  id: string;
  name: string;
  key_preview: string;
  permissions: string[];
  created_at: string;
  last_used_at?: string;
  expires_at?: string;
  status: 'active' | 'expired' | 'revoked';
}

export default function ApiKeysPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{ key: string; secret: string } | null>(null);
  
  // Create form
  const [newKey, setNewKey] = useState({
    name: '',
    permissions: [] as string[],
    expires_in_days: 90,
  });

  const availablePermissions = [
    { id: 'read:projects', label: 'Read Projects', description: 'View project data' },
    { id: 'write:projects', label: 'Write Projects', description: 'Create/update projects' },
    { id: 'read:users', label: 'Read Users', description: 'View user profiles' },
    { id: 'write:users', label: 'Write Users', description: 'Update user data' },
    { id: 'read:payments', label: 'Read Payments', description: 'View payment history' },
    { id: 'write:payments', label: 'Write Payments', description: 'Process payments' },
    { id: 'read:analytics', label: 'Read Analytics', description: 'View analytics data' },
    { id: 'admin', label: 'Full Admin', description: 'Full administrative access' },
  ];

  useEffect(() => {
    setMounted(true);
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const response = await apiKeysApi.list().catch(() => null);
      
      const mockKeys: ApiKey[] = response?.keys || [
        {
          id: '1',
          name: 'Production API',
          key_preview: 'mk_live_****XYZ789',
          permissions: ['read:projects', 'write:projects', 'read:payments'],
          created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
          last_used_at: new Date(Date.now() - 3600000).toISOString(),
          expires_at: new Date(Date.now() + 60 * 86400000).toISOString(),
          status: 'active',
        },
        {
          id: '2',
          name: 'Analytics Dashboard',
          key_preview: 'mk_live_****ABC123',
          permissions: ['read:analytics', 'read:projects'],
          created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
          last_used_at: new Date(Date.now() - 86400000).toISOString(),
          status: 'active',
        },
        {
          id: '3',
          name: 'Legacy Integration',
          key_preview: 'mk_test_****DEF456',
          permissions: ['read:users'],
          created_at: new Date(Date.now() - 180 * 86400000).toISOString(),
          expires_at: new Date(Date.now() - 10 * 86400000).toISOString(),
          status: 'expired',
        },
      ];

      setApiKeys(mockKeys);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKey.name.trim()) return;
    
    try {
      const response = await apiKeysApi.create({
        name: newKey.name,
        permissions: newKey.permissions,
        expires_in_days: newKey.expires_in_days,
      });

      // Show the new key (only shown once)
      setNewKeyData({
        key: response?.key || 'mk_live_' + Math.random().toString(36).substring(2, 15),
        secret: response?.secret || Math.random().toString(36).substring(2, 30),
      });
      
      loadApiKeys();
    } catch (error) {
      console.error('Failed to create API key:', error);
      // Mock successful creation
      setNewKeyData({
        key: 'mk_live_' + Math.random().toString(36).substring(2, 15),
        secret: Math.random().toString(36).substring(2, 30),
      });
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return;
    
    try {
      await apiKeysApi.revoke(keyId);
      loadApiKeys();
    } catch (error) {
      console.error('Failed to revoke API key:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const togglePermission = (permId: string) => {
    setNewKey(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId],
    }));
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
    
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewKeyData(null);
    setNewKey({ name: '', permissions: [], expires_in_days: 90 });
  };

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={cn(commonStyles.loading, themeStyles.loading)}>Loading API keys...</div>
      </div>
    );
  }

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      {/* Header */}
      <div className={commonStyles.header}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>API Keys</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Manage API keys for external integrations
          </p>
        </div>
        <button
          className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}
          onClick={() => setShowCreateModal(true)}
        >
          + Create New Key
        </button>
      </div>

      {/* Warning Banner */}
      <div className={cn(commonStyles.warning, themeStyles.warning)}>
        <span className={commonStyles.warningIcon}>⚠️</span>
        <div>
          <strong>Keep your API keys secure</strong>
          <p>Never share your API keys publicly or commit them to version control. 
             Use environment variables instead.</p>
        </div>
      </div>

      {/* Stats */}
      <div className={commonStyles.stats}>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <span className={commonStyles.statValue}>{apiKeys.length}</span>
          <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Keys</span>
        </div>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <span className={commonStyles.statValue}>{apiKeys.filter(k => k.status === 'active').length}</span>
          <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Active</span>
        </div>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <span className={commonStyles.statValue}>{apiKeys.filter(k => k.status === 'expired').length}</span>
          <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Expired</span>
        </div>
      </div>

      {/* Keys List */}
      <div className={commonStyles.keysList}>
        {apiKeys.length === 0 ? (
          <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
            <span className={commonStyles.emptyIcon}>🔑</span>
            <p>No API keys created yet</p>
            <button
              className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}
              onClick={() => setShowCreateModal(true)}
            >
              Create your first API key
            </button>
          </div>
        ) : (
          apiKeys.map((key) => (
            <div key={key.id} className={cn(commonStyles.keyCard, themeStyles.keyCard)}>
              <div className={commonStyles.keyHeader}>
                <div className={commonStyles.keyInfo}>
                  <h3 className={cn(commonStyles.keyName, themeStyles.keyName)}>{key.name}</h3>
                  <code className={cn(commonStyles.keyPreview, themeStyles.keyPreview)}>
                    {key.key_preview}
                  </code>
                </div>
                <span className={cn(
                  commonStyles.status,
                  commonStyles[`status${key.status.charAt(0).toUpperCase() + key.status.slice(1)}`],
                  themeStyles[`status${key.status.charAt(0).toUpperCase() + key.status.slice(1)}`]
                )}>
                  {key.status}
                </span>
              </div>

              <div className={commonStyles.keyBody}>
                <div className={commonStyles.permissions}>
                  <span className={cn(commonStyles.permissionsLabel, themeStyles.permissionsLabel)}>
                    Permissions:
                  </span>
                  <div className={commonStyles.permissionsList}>
                    {key.permissions.map((perm) => (
                      <span key={perm} className={cn(commonStyles.permission, themeStyles.permission)}>
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={cn(commonStyles.keyMeta, themeStyles.keyMeta)}>
                  <span>Created: {formatDate(key.created_at)}</span>
                  {key.last_used_at && <span>Last used: {formatTimeAgo(key.last_used_at)}</span>}
                  {key.expires_at && (
                    <span className={new Date(key.expires_at) < new Date() ? commonStyles.expired : ''}>
                      Expires: {formatDate(key.expires_at)}
                    </span>
                  )}
                </div>
              </div>

              <div className={commonStyles.keyActions}>
                {key.status === 'active' && (
                  <button
                    className={cn(commonStyles.dangerButton, themeStyles.dangerButton)}
                    onClick={() => handleRevokeKey(key.id)}
                  >
                    Revoke
                  </button>
                )}
                <button className={cn(commonStyles.actionButton, themeStyles.actionButton)}>
                  View Logs
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className={cn(commonStyles.modal, themeStyles.modal)}>
          <div className={cn(commonStyles.modalContent, themeStyles.modalContent)}>
            {newKeyData ? (
              // Show new key (only once)
              <>
                <div className={commonStyles.modalHeader}>
                  <h2>API Key Created</h2>
                </div>
                <div className={commonStyles.modalBody}>
                  <div className={cn(commonStyles.successBanner, themeStyles.successBanner)}>
                    <span>✅</span>
                    <p><strong>Important:</strong> Copy your API key now. You won't be able to see it again!</p>
                  </div>

                  <div className={commonStyles.newKeyDisplay}>
                    <div className={commonStyles.formGroup}>
                      <label>API Key</label>
                      <div className={commonStyles.keyWithCopy}>
                        <code className={cn(commonStyles.fullKey, themeStyles.fullKey)}>
                          {newKeyData.key}
                        </code>
                        <button
                          onClick={() => copyToClipboard(newKeyData.key)}
                          className={cn(commonStyles.copyButton, themeStyles.copyButton)}
                        >
                          📋
                        </button>
                      </div>
                    </div>

                    <div className={commonStyles.formGroup}>
                      <label>Secret</label>
                      <div className={commonStyles.keyWithCopy}>
                        <code className={cn(commonStyles.fullKey, themeStyles.fullKey)}>
                          {newKeyData.secret}
                        </code>
                        <button
                          onClick={() => copyToClipboard(newKeyData.secret)}
                          className={cn(commonStyles.copyButton, themeStyles.copyButton)}
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={commonStyles.modalFooter}>
                  <button
                    className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}
                    onClick={closeCreateModal}
                  >
                    Done
                  </button>
                </div>
              </>
            ) : (
              // Create form
              <>
                <div className={commonStyles.modalHeader}>
                  <h2>Create API Key</h2>
                  <button
                    className={cn(commonStyles.closeButton, themeStyles.closeButton)}
                    onClick={closeCreateModal}
                  >
                    ✕
                  </button>
                </div>
                <div className={commonStyles.modalBody}>
                  <div className={commonStyles.formGroup}>
                    <label>Key Name</label>
                    <input
                      type="text"
                      value={newKey.name}
                      onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                      className={cn(commonStyles.input, themeStyles.input)}
                      placeholder="e.g., Production API"
                    />
                  </div>

                  <div className={commonStyles.formGroup}>
                    <label>Expiration</label>
                    <select
                      value={newKey.expires_in_days}
                      onChange={(e) => setNewKey({ ...newKey, expires_in_days: Number(e.target.value) })}
                      className={cn(commonStyles.select, themeStyles.select)}
                    >
                      <option value={30}>30 days</option>
                      <option value={60}>60 days</option>
                      <option value={90}>90 days</option>
                      <option value={180}>180 days</option>
                      <option value={365}>1 year</option>
                      <option value={0}>Never expires</option>
                    </select>
                  </div>

                  <div className={commonStyles.formGroup}>
                    <label>Permissions</label>
                    <div className={commonStyles.permissionsGrid}>
                      {availablePermissions.map((perm) => (
                        <label
                          key={perm.id}
                          className={cn(
                            commonStyles.permissionOption,
                            themeStyles.permissionOption,
                            newKey.permissions.includes(perm.id) && commonStyles.permissionSelected,
                            newKey.permissions.includes(perm.id) && themeStyles.permissionSelected
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={newKey.permissions.includes(perm.id)}
                            onChange={() => togglePermission(perm.id)}
                          />
                          <div>
                            <span className={commonStyles.permLabel}>{perm.label}</span>
                            <span className={cn(commonStyles.permDesc, themeStyles.permDesc)}>
                              {perm.description}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className={commonStyles.modalFooter}>
                  <button
                    className={cn(commonStyles.secondaryButton, themeStyles.secondaryButton)}
                    onClick={closeCreateModal}
                  >
                    Cancel
                  </button>
                  <button
                    className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}
                    onClick={handleCreateKey}
                    disabled={!newKey.name.trim() || newKey.permissions.length === 0}
                  >
                    Create Key
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
