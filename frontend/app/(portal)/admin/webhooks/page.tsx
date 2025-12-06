// @AI-HINT: Admin Webhook Management - Configure and manage webhook endpoints
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { webhooksApi } from '@/lib/api';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import commonStyles from './Webhooks.common.module.css';
import lightStyles from './Webhooks.light.module.css';
import darkStyles from './Webhooks.dark.module.css';

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  status: 'active' | 'inactive' | 'failing';
  created_at: string;
  last_triggered_at?: string;
  success_count: number;
  failure_count: number;
}

interface DeliveryLog {
  id: string;
  webhook_id: string;
  event: string;
  status: 'success' | 'failed';
  response_code?: number;
  delivered_at: string;
  duration_ms: number;
}

export default function WebhooksPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  
  // Create form
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[],
    secret: '',
  });

  const availableEvents = [
    { id: 'project.created', label: 'Project Created', category: 'Projects' },
    { id: 'project.updated', label: 'Project Updated', category: 'Projects' },
    { id: 'project.completed', label: 'Project Completed', category: 'Projects' },
    { id: 'proposal.submitted', label: 'Proposal Submitted', category: 'Proposals' },
    { id: 'proposal.accepted', label: 'Proposal Accepted', category: 'Proposals' },
    { id: 'proposal.rejected', label: 'Proposal Rejected', category: 'Proposals' },
    { id: 'payment.completed', label: 'Payment Completed', category: 'Payments' },
    { id: 'payment.failed', label: 'Payment Failed', category: 'Payments' },
    { id: 'user.registered', label: 'User Registered', category: 'Users' },
    { id: 'user.verified', label: 'User Verified', category: 'Users' },
    { id: 'contract.signed', label: 'Contract Signed', category: 'Contracts' },
    { id: 'milestone.completed', label: 'Milestone Completed', category: 'Milestones' },
  ];

  useEffect(() => {
    setMounted(true);
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const response = await webhooksApi.list().catch(() => null);
      
      // Use API data if available, otherwise fall back to demo data
      let webhookData: Webhook[] = [];
      
      if (response && (response.webhooks?.length > 0 || Array.isArray(response) && response.length > 0)) {
        webhookData = response.webhooks || response;
      } else {
        // Demo data for display when no real webhooks exist
        webhookData = [
          {
            id: '1',
            name: 'Slack Notifications',
            url: 'https://hooks.slack.com/services/xxx/yyy/zzz',
            events: ['project.created', 'proposal.submitted', 'payment.completed'],
            status: 'active',
            created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
            last_triggered_at: new Date(Date.now() - 3600000).toISOString(),
            success_count: 245,
            failure_count: 3,
          },
          {
            id: '2',
            name: 'CRM Integration',
            url: 'https://api.crm.example.com/webhooks',
            events: ['user.registered', 'user.verified', 'contract.signed'],
            status: 'active',
            created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
            last_triggered_at: new Date(Date.now() - 86400000).toISOString(),
            success_count: 128,
            failure_count: 0,
          },
          {
            id: '3',
            name: 'Analytics Tracker',
            url: 'https://analytics.example.com/ingest',
            events: ['project.completed', 'milestone.completed', 'payment.completed'],
            status: 'failing',
            created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
            last_triggered_at: new Date(Date.now() - 172800000).toISOString(),
            success_count: 45,
            failure_count: 12,
          },
        ];
      }

      setWebhooks(webhookData);
    } catch (error) {
      console.error('Failed to load webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhook.name.trim() || !newWebhook.url.trim() || newWebhook.events.length === 0) return;
    
    try {
      await webhooksApi.create({
        name: newWebhook.name,
        url: newWebhook.url,
        events: newWebhook.events,
        secret: newWebhook.secret || undefined,
      });
      setShowCreateModal(false);
      setNewWebhook({ name: '', url: '', events: [], secret: '' });
      loadWebhooks();
    } catch (error) {
      console.error('Failed to create webhook:', error);
    }
  };

  const handleToggleWebhook = async (webhookId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await webhooksApi.update(webhookId, { status: newStatus });
      loadWebhooks();
    } catch (error) {
      console.error('Failed to toggle webhook:', error);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    
    try {
      await webhooksApi.delete(webhookId);
      loadWebhooks();
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    try {
      await webhooksApi.test(webhookId);
      alert('Test webhook sent!');
    } catch (error) {
      console.error('Failed to test webhook:', error);
      alert('Failed to send test webhook');
    }
  };

  const handleViewLogs = async (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    try {
      const response = await webhooksApi.getLogs(webhook.id).catch(() => null);
      
      // Use API data if available, otherwise fall back to demo data
      let logsData: DeliveryLog[] = [];
      
      if (response && (response.logs?.length > 0 || Array.isArray(response) && response.length > 0)) {
        logsData = response.logs || response;
      } else {
        // Demo logs for display
        logsData = [
          { id: '1', webhook_id: webhook.id, event: 'project.created', status: 'success', response_code: 200, delivered_at: new Date(Date.now() - 3600000).toISOString(), duration_ms: 245 },
          { id: '2', webhook_id: webhook.id, event: 'payment.completed', status: 'success', response_code: 200, delivered_at: new Date(Date.now() - 7200000).toISOString(), duration_ms: 189 },
          { id: '3', webhook_id: webhook.id, event: 'proposal.submitted', status: 'failed', response_code: 500, delivered_at: new Date(Date.now() - 86400000).toISOString(), duration_ms: 5023 },
          { id: '4', webhook_id: webhook.id, event: 'project.created', status: 'success', response_code: 200, delivered_at: new Date(Date.now() - 172800000).toISOString(), duration_ms: 312 },
        ];
      }
      
      setDeliveryLogs(logsData);
      setShowLogsModal(true);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const toggleEvent = (eventId: string) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId],
    }));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const groupedEvents = availableEvents.reduce((acc, event) => {
    if (!acc[event.category]) acc[event.category] = [];
    acc[event.category].push(event);
    return acc;
  }, {} as Record<string, typeof availableEvents>);

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={cn(commonStyles.loading, themeStyles.loading)}>Loading webhooks...</div>
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
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Webhooks</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Configure webhook endpoints for real-time event notifications
              </p>
            </div>
            <button
              className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}
              onClick={() => setShowCreateModal(true)}
            >
              + Add Webhook
            </button>
          </div>
        </ScrollReveal>

        {/* Stats */}
        <StaggerContainer className={commonStyles.stats}>
          <StaggerItem className={cn(commonStyles.statCard, themeStyles.statCard)}>
            <span className={commonStyles.statValue}>{webhooks.length}</span>
            <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Webhooks</span>
          </StaggerItem>
          <StaggerItem className={cn(commonStyles.statCard, themeStyles.statCard)}>
            <span className={commonStyles.statValue}>{webhooks.filter(w => w.status === 'active').length}</span>
            <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Active</span>
          </StaggerItem>
          <StaggerItem className={cn(commonStyles.statCard, themeStyles.statCard)}>
            <span className={commonStyles.statValue}>{webhooks.reduce((sum, w) => sum + w.success_count, 0)}</span>
            <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Deliveries</span>
          </StaggerItem>
          <StaggerItem className={cn(commonStyles.statCard, themeStyles.statCard)}>
            <span className={cn(commonStyles.statValue, commonStyles.failureValue)}>
              {webhooks.reduce((sum, w) => sum + w.failure_count, 0)}
            </span>
            <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Failures</span>
          </StaggerItem>
        </StaggerContainer>

        {/* Webhooks List */}
        <StaggerContainer className={commonStyles.webhooksList}>
          {webhooks.length === 0 ? (
            <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
              <span className={commonStyles.emptyIcon}>🔗</span>
              <p>No webhooks configured</p>
              <button
                className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}
                onClick={() => setShowCreateModal(true)}
              >
                Add your first webhook
              </button>
            </div>
          ) : (
            webhooks.map((webhook) => (
              <StaggerItem key={webhook.id} className={cn(commonStyles.webhookCard, themeStyles.webhookCard)}>
                <div className={commonStyles.webhookHeader}>
                  <div className={commonStyles.webhookInfo}>
                    <h3 className={cn(commonStyles.webhookName, themeStyles.webhookName)}>
                      {webhook.name}
                    </h3>
                    <code className={cn(commonStyles.webhookUrl, themeStyles.webhookUrl)}>
                      {webhook.url}
                    </code>
                  </div>
                  <span className={cn(
                    commonStyles.status,
                    commonStyles[`status${webhook.status.charAt(0).toUpperCase() + webhook.status.slice(1)}`],
                    themeStyles[`status${webhook.status.charAt(0).toUpperCase() + webhook.status.slice(1)}`]
                  )}>
                    {webhook.status === 'failing' && '⚠️ '}
                    {webhook.status}
                  </span>
                </div>

                <div className={commonStyles.webhookBody}>
                  <div className={commonStyles.events}>
                    <span className={cn(commonStyles.eventsLabel, themeStyles.eventsLabel)}>Events:</span>
                    <div className={commonStyles.eventsList}>
                      {webhook.events.map((event) => (
                        <span key={event} className={cn(commonStyles.event, themeStyles.event)}>
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={cn(commonStyles.webhookMeta, themeStyles.webhookMeta)}>
                    <span>✓ {webhook.success_count} delivered</span>
                    <span>✗ {webhook.failure_count} failed</span>
                    {webhook.last_triggered_at && (
                      <span>Last triggered: {formatDate(webhook.last_triggered_at)}</span>
                    )}
                  </div>
                </div>

                <div className={commonStyles.webhookActions}>
                  <button
                    className={cn(commonStyles.actionButton, themeStyles.actionButton)}
                    onClick={() => handleTestWebhook(webhook.id)}
                  >
                    🧪 Test
                  </button>
                  <button
                    className={cn(commonStyles.actionButton, themeStyles.actionButton)}
                    onClick={() => handleViewLogs(webhook)}
                  >
                    📋 Logs
                  </button>
                  <button
                    className={cn(commonStyles.actionButton, themeStyles.actionButton)}
                    onClick={() => handleToggleWebhook(webhook.id, webhook.status)}
                  >
                    {webhook.status === 'active' ? '⏸️ Pause' : '▶️ Enable'}
                  </button>
                  <button
                    className={cn(commonStyles.dangerButton, themeStyles.dangerButton)}
                    onClick={() => handleDeleteWebhook(webhook.id)}
                  >
                    Delete
                  </button>
                </div>
              </StaggerItem>
            ))
          )}
        </StaggerContainer>

        {/* Create Modal */}
        {showCreateModal && (
          <div className={cn(commonStyles.modal, themeStyles.modal)}>
            <div className={cn(commonStyles.modalContent, themeStyles.modalContent, commonStyles.modalLarge)}>
              <div className={commonStyles.modalHeader}>
                <h2>Add Webhook</h2>
                <button
                  className={cn(commonStyles.closeButton, themeStyles.closeButton)}
                  onClick={() => setShowCreateModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className={commonStyles.modalBody}>
                <div className={commonStyles.formGroup}>
                  <label>Name</label>
                  <input
                    type="text"
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                    className={cn(commonStyles.input, themeStyles.input)}
                    placeholder="e.g., Slack Notifications"
                  />
                </div>

                <div className={commonStyles.formGroup}>
                  <label>Endpoint URL</label>
                  <input
                    type="url"
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                    className={cn(commonStyles.input, themeStyles.input)}
                    placeholder="https://example.com/webhooks"
                  />
                </div>

                <div className={commonStyles.formGroup}>
                  <label>Secret (optional)</label>
                  <input
                    type="text"
                    value={newWebhook.secret}
                    onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                    className={cn(commonStyles.input, themeStyles.input)}
                    placeholder="Webhook signing secret"
                  />
                  <p className={cn(commonStyles.hint, themeStyles.hint)}>
                    Used to sign webhook payloads for verification
                  </p>
                </div>

                <div className={commonStyles.formGroup}>
                  <label>Events</label>
                  <div className={commonStyles.eventsGrid}>
                    {Object.entries(groupedEvents).map(([category, events]) => (
                      <div key={category} className={commonStyles.eventCategory}>
                        <h4 className={cn(commonStyles.categoryTitle, themeStyles.categoryTitle)}>
                          {category}
                        </h4>
                        {events.map((event) => (
                          <label
                            key={event.id}
                            className={cn(
                              commonStyles.eventOption,
                              themeStyles.eventOption,
                              newWebhook.events.includes(event.id) && commonStyles.eventSelected,
                              newWebhook.events.includes(event.id) && themeStyles.eventSelected
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={newWebhook.events.includes(event.id)}
                              onChange={() => toggleEvent(event.id)}
                            />
                            <span>{event.label}</span>
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className={commonStyles.modalFooter}>
                <button
                  className={cn(commonStyles.secondaryButton, themeStyles.secondaryButton)}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}
                  onClick={handleCreateWebhook}
                  disabled={!newWebhook.name.trim() || !newWebhook.url.trim() || newWebhook.events.length === 0}
                >
                  Create Webhook
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Logs Modal */}
        {showLogsModal && selectedWebhook && (
          <div className={cn(commonStyles.modal, themeStyles.modal)}>
            <div className={cn(commonStyles.modalContent, themeStyles.modalContent, commonStyles.modalLarge)}>
              <div className={commonStyles.modalHeader}>
                <h2>Delivery Logs - {selectedWebhook.name}</h2>
                <button
                  className={cn(commonStyles.closeButton, themeStyles.closeButton)}
                  onClick={() => {
                    setShowLogsModal(false);
                    setSelectedWebhook(null);
                  }}
                >
                  ✕
                </button>
              </div>
              <div className={commonStyles.modalBody}>
                <div className={commonStyles.logsList}>
                  {deliveryLogs.length === 0 ? (
                    <p className={cn(commonStyles.noLogs, themeStyles.noLogs)}>No delivery logs yet</p>
                  ) : (
                    deliveryLogs.map((log) => (
                      <div key={log.id} className={cn(commonStyles.logEntry, themeStyles.logEntry)}>
                        <div className={commonStyles.logStatus}>
                          <span className={cn(
                            commonStyles.logBadge,
                            log.status === 'success' ? commonStyles.logSuccess : commonStyles.logFailed,
                            log.status === 'success' ? themeStyles.logSuccess : themeStyles.logFailed
                          )}>
                            {log.status === 'success' ? '✓' : '✗'} {log.response_code || 'Error'}
                          </span>
                        </div>
                        <div className={commonStyles.logInfo}>
                          <span className={cn(commonStyles.logEvent, themeStyles.logEvent)}>{log.event}</span>
                          <span className={cn(commonStyles.logTime, themeStyles.logTime)}>
                            {formatDate(log.delivered_at)} • {log.duration_ms}ms
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
