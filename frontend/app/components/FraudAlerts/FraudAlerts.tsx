// @AI-HINT: Admin fraud alerts dashboard with risk visualization and user management
"use client";

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import Modal from '@/app/components/Modal/Modal';
import commonStyles from './FraudAlerts.common.module.css';
import lightStyles from './FraudAlerts.light.module.css';
import darkStyles from './FraudAlerts.dark.module.css';

interface FraudAlert {
  id: string;
  user_id: number;
  user_email: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  risk_score: number;
  evidence: string;
  status: 'pending' | 'investigating' | 'resolved' | 'false_positive';
  created_at: string;
  resolved_at?: string;
  resolution_notes?: string;
}

interface FraudAlertsProps {
  className?: string;
}

export default function FraudAlerts({ className = '' }: FraudAlertsProps) {
  const { resolvedTheme } = useTheme();
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<FraudAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockUserId, setBlockUserId] = useState<number | null>(null);

  // Theme guard
  if (!resolvedTheme) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  // Fetch fraud alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/fraud-alerts');
        if (response.ok) {
          const data = await response.json();
          setAlerts(data.alerts || []);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...alerts];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter((a) => a.severity === severityFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.user_email.toLowerCase().includes(query) ||
          a.alert_type.toLowerCase().includes(query) ||
          a.id.includes(query)
      );
    }

    setFilteredAlerts(filtered);
  }, [alerts, statusFilter, severityFilter, searchQuery]);

  const handleResolveAlert = async (alertId: string, resolution: 'resolved' | 'false_positive') => {
    try {
      const response = await fetch(`/api/admin/fraud-alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: resolution,
          resolution_notes: resolutionNotes
        })
      });

      if (response.ok) {
        setAlerts(alerts.map((a) => (a.id === alertId ? { ...a, status: resolution } : a)));
        setSelectedAlert(null);
        setResolutionNotes('');
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleBlockUser = async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Fraud detected' })
      });

      if (response.ok) {
        showToast('User blocked successfully', 'success');
        setSelectedAlert(null);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return commonStyles.severityCritical;
      case 'high':
        return commonStyles.severityHigh;
      case 'medium':
        return commonStyles.severityMedium;
      case 'low':
        return commonStyles.severityLow;
      default:
        return '';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return '🔴 Pending';
      case 'investigating':
        return '🟡 Investigating';
      case 'resolved':
        return '✅ Resolved';
      case 'false_positive':
        return '⚪ False Positive';
      default:
        return status;
    }
  };

  const stats = {
    total: alerts.length,
    pending: alerts.filter((a) => a.status === 'pending').length,
    critical: alerts.filter((a) => a.severity === 'critical').length,
    resolved: alerts.filter((a) => a.status === 'resolved').length
  };

  return (
    <div className={cn(commonStyles.container, themeStyles.container, className)}>
      {/* Header */}
      <div className={cn(commonStyles.header, themeStyles.header)}>
        <div>
          <h1 className={commonStyles.title}>🚨 Fraud Alert Dashboard</h1>
          <p className={commonStyles.subtitle}>Monitor and manage suspicious activities</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={commonStyles.statsGrid}>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <div className={commonStyles.statLabel}>Total Alerts</div>
          <div className={cn(commonStyles.statValue, commonStyles.statTotal)}>
            {stats.total}
          </div>
        </div>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <div className={commonStyles.statLabel}>⚠️ Pending</div>
          <div className={cn(commonStyles.statValue, commonStyles.statPending)}>
            {stats.pending}
          </div>
        </div>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <div className={commonStyles.statLabel}>🔴 Critical</div>
          <div className={cn(commonStyles.statValue, commonStyles.statCritical)}>
            {stats.critical}
          </div>
        </div>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <div className={commonStyles.statLabel}>✅ Resolved</div>
          <div className={cn(commonStyles.statValue, commonStyles.statResolved)}>
            {stats.resolved}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={cn(commonStyles.filters, themeStyles.filters)}>
        <div className={cn(commonStyles.searchBox, themeStyles.searchBox)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search by email, type, or alert ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(commonStyles.searchInput, themeStyles.searchInput)}
          />
        </div>

        <div className={commonStyles.filterRow}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={cn(commonStyles.select, themeStyles.select)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="false_positive">False Positive</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className={cn(commonStyles.select, themeStyles.select)}
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className={cn(commonStyles.loading, themeStyles.loading)}>
          <div className={commonStyles.spinner}>⏳</div>
          <p>Loading fraud alerts...</p>
        </div>
      ) : error ? (
        <div className={cn(commonStyles.error, themeStyles.error)}>
          ⚠️ {error}
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className={cn(commonStyles.empty, themeStyles.empty)}>
          <div className={commonStyles.emptyIcon}>✨</div>
          <h3>No alerts found</h3>
          <p>All systems clear or no matching results</p>
        </div>
      ) : (
        <div className={commonStyles.alertsList}>
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                commonStyles.alertCard,
                themeStyles.alertCard,
                getSeverityColor(alert.severity),
                themeStyles[`severity${alert.severity.charAt(0).toUpperCase()}${alert.severity.slice(1)}`]
              )}
            >
              <div className={commonStyles.alertHeader}>
                <div className={commonStyles.alertMeta}>
                  <div className={cn(commonStyles.severity, getSeverityColor(alert.severity))}>
                    {alert.severity.toUpperCase()}
                  </div>
                  <div className={commonStyles.alertType}>{alert.alert_type}</div>
                  <div className={commonStyles.alertTime}>
                    {new Date(alert.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className={commonStyles.alertScore}>
                  <span className={commonStyles.riskLabel}>Risk Score:</span>
                  <span className={cn(commonStyles.riskValue, alert.risk_score > 70 ? commonStyles.riskHigh : '')}>
                    {alert.risk_score}%
                  </span>
                </div>
              </div>

              <div className={commonStyles.alertBody}>
                <div className={commonStyles.alertUser}>
                  <span className={commonStyles.label}>User:</span>
                  <span className={commonStyles.value}>{alert.user_email}</span>
                </div>
                <div className={commonStyles.alertStatus}>
                  <span className={commonStyles.label}>Status:</span>
                  <span className={commonStyles.badgeStatus}>{getStatusBadge(alert.status)}</span>
                </div>
                <div className={commonStyles.alertEvidence}>
                  <span className={commonStyles.label}>Evidence:</span>
                  <p className={commonStyles.evidenceText}>{alert.evidence}</p>
                </div>
              </div>

              <div className={commonStyles.alertActions}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAlert(alert)}
                >
                  👁️ Review
                </Button>
                {alert.status === 'pending' && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleResolveAlert(alert.id, 'false_positive')}
                    >
                      ⚪ False Positive
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setBlockUserId(alert.user_id);
                        setShowBlockModal(true);
                      }}
                    >
                      🚫 Block User
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showBlockModal}
        onClose={() => { setShowBlockModal(false); setBlockUserId(null); }}
        title="Block User"
        size="small"
      >
        <p>Are you sure you want to block this user?</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button variant="ghost" onClick={() => { setShowBlockModal(false); setBlockUserId(null); }}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (blockUserId !== null) handleBlockUser(blockUserId); setShowBlockModal(false); setBlockUserId(null); }}>Block User</Button>
        </div>
      </Modal>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className={cn(commonStyles.modal, themeStyles.modal)}>
          <div className={cn(commonStyles.modalContent, themeStyles.modalContent)}>
            <div className={commonStyles.modalHeader}>
              <h2>Alert Details</h2>
              <button
                onClick={() => setSelectedAlert(null)}
                className={commonStyles.closeButton}
              >
                ✕
              </button>
            </div>

            <div className={commonStyles.modalBody}>
              <div className={commonStyles.detailRow}>
                <span className={commonStyles.detailLabel}>Alert ID:</span>
                <span className={commonStyles.detailValue}>{selectedAlert.id}</span>
              </div>
              <div className={commonStyles.detailRow}>
                <span className={commonStyles.detailLabel}>User:</span>
                <span className={commonStyles.detailValue}>{selectedAlert.user_email}</span>
              </div>
              <div className={commonStyles.detailRow}>
                <span className={commonStyles.detailLabel}>Type:</span>
                <span className={commonStyles.detailValue}>{selectedAlert.alert_type}</span>
              </div>
              <div className={commonStyles.detailRow}>
                <span className={commonStyles.detailLabel}>Severity:</span>
                <span className={cn(commonStyles.detailValue, getSeverityColor(selectedAlert.severity))}>
                  {selectedAlert.severity.toUpperCase()}
                </span>
              </div>
              <div className={commonStyles.detailRow}>
                <span className={commonStyles.detailLabel}>Risk Score:</span>
                <span className={commonStyles.detailValue}>{selectedAlert.risk_score}%</span>
              </div>
              <div className={commonStyles.detailRow}>
                <span className={commonStyles.detailLabel}>Status:</span>
                <span className={commonStyles.detailValue}>{getStatusBadge(selectedAlert.status)}</span>
              </div>
              <div className={commonStyles.detailFull}>
                <span className={commonStyles.detailLabel}>Evidence:</span>
                <p className={commonStyles.detailText}>{selectedAlert.evidence}</p>
              </div>

              {selectedAlert.status === 'pending' && (
                <div className={commonStyles.detailFull}>
                  <label className={commonStyles.detailLabel}>Resolution Notes:</label>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className={cn(commonStyles.textarea, themeStyles.textarea)}
                    placeholder="Add notes about this alert..."
                    rows={4}
                  />
                </div>
              )}
            </div>

            <div className={commonStyles.modalFooter}>
              <Button variant="ghost" onClick={() => setSelectedAlert(null)}>
                Close
              </Button>
              {selectedAlert.status === 'pending' && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => handleResolveAlert(selectedAlert.id, 'false_positive')}
                  >
                    Mark as False Positive
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setBlockUserId(selectedAlert.user_id);
                      setShowBlockModal(true);
                    }}
                  >
                    Block User
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, padding: '12px 24px',
          borderRadius: 8, color: '#fff', zIndex: 9999, fontSize: 14,
          backgroundColor: toast.type === 'success' ? '#27AE60' : '#e81123',
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
