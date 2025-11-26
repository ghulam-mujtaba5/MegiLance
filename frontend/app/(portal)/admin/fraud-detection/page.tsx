// @AI-HINT: Fraud Detection Dashboard - Admin interface for monitoring suspicious activities
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './FraudDetection.common.module.css';
import lightStyles from './FraudDetection.light.module.css';
import darkStyles from './FraudDetection.dark.module.css';

interface FlaggedTransaction {
  id: string;
  type: 'payment' | 'withdrawal' | 'transfer';
  amount: number;
  currency: string;
  userId: string;
  userName: string;
  userEmail: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  flags: string[];
  status: 'pending' | 'reviewed' | 'cleared' | 'blocked';
  timestamp: string;
  ipAddress: string;
  location: string;
  deviceInfo: string;
}

interface FraudAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  affectedUsers: number;
  timestamp: string;
  status: 'active' | 'resolved' | 'dismissed';
}

interface FraudStats {
  totalFlagged: number;
  criticalAlerts: number;
  blockedTransactions: number;
  reviewedToday: number;
  avgRiskScore: number;
  falsePositiveRate: number;
}

export default function FraudDetectionPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'alerts' | 'rules'>('transactions');
  const [transactions, setTransactions] = useState<FlaggedTransaction[]>([]);
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [stats, setStats] = useState<FraudStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<FlaggedTransaction | null>(null);
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    setMounted(true);
    fetchFraudData();
  }, []);

  const fetchFraudData = async () => {
    setLoading(true);
    try {
      // Mock data for fraud detection
      const mockTransactions: FlaggedTransaction[] = [
        {
          id: 'tx_001',
          type: 'withdrawal',
          amount: 5000,
          currency: 'USD',
          userId: 'user_123',
          userName: 'John Smith',
          userEmail: 'john.smith@email.com',
          riskScore: 85,
          riskLevel: 'critical',
          flags: ['Large amount', 'New device', 'Unusual location', 'Multiple failed attempts'],
          status: 'pending',
          timestamp: '2025-01-15T14:30:00Z',
          ipAddress: '185.234.72.xxx',
          location: 'Moscow, Russia',
          deviceInfo: 'Chrome 120 / Windows 10'
        },
        {
          id: 'tx_002',
          type: 'payment',
          amount: 1500,
          currency: 'USD',
          userId: 'user_456',
          userName: 'Emily Johnson',
          userEmail: 'emily.j@email.com',
          riskScore: 65,
          riskLevel: 'high',
          flags: ['First transaction', 'VPN detected'],
          status: 'reviewed',
          timestamp: '2025-01-15T12:15:00Z',
          ipAddress: '104.28.45.xxx',
          location: 'Lagos, Nigeria',
          deviceInfo: 'Safari 17 / macOS'
        },
        {
          id: 'tx_003',
          type: 'transfer',
          amount: 800,
          currency: 'EUR',
          userId: 'user_789',
          userName: 'Michael Brown',
          userEmail: 'michael.b@email.com',
          riskScore: 45,
          riskLevel: 'medium',
          flags: ['Unusual time', 'Different currency'],
          status: 'cleared',
          timestamp: '2025-01-15T03:45:00Z',
          ipAddress: '89.123.45.xxx',
          location: 'Berlin, Germany',
          deviceInfo: 'Firefox 121 / Linux'
        },
        {
          id: 'tx_004',
          type: 'withdrawal',
          amount: 250,
          currency: 'GBP',
          userId: 'user_012',
          userName: 'Sarah Wilson',
          userEmail: 'sarah.w@email.com',
          riskScore: 25,
          riskLevel: 'low',
          flags: ['New withdrawal method'],
          status: 'cleared',
          timestamp: '2025-01-14T16:20:00Z',
          ipAddress: '82.34.156.xxx',
          location: 'London, UK',
          deviceInfo: 'Edge 120 / Windows 11'
        },
        {
          id: 'tx_005',
          type: 'payment',
          amount: 10000,
          currency: 'USD',
          userId: 'user_345',
          userName: 'David Lee',
          userEmail: 'david.lee@email.com',
          riskScore: 92,
          riskLevel: 'critical',
          flags: ['Very large amount', 'Account age < 7 days', 'Multiple cards', 'Velocity check failed'],
          status: 'blocked',
          timestamp: '2025-01-15T09:10:00Z',
          ipAddress: '203.115.xxx.xxx',
          location: 'Unknown',
          deviceInfo: 'Unknown / Unknown'
        }
      ];

      const mockAlerts: FraudAlert[] = [
        {
          id: 'alert_001',
          type: 'velocity_spike',
          severity: 'critical',
          message: 'Unusual spike in withdrawal requests detected (300% above normal)',
          affectedUsers: 15,
          timestamp: '2025-01-15T14:00:00Z',
          status: 'active'
        },
        {
          id: 'alert_002',
          type: 'bot_activity',
          severity: 'high',
          message: 'Potential bot activity detected from IP range 185.234.xx.xx',
          affectedUsers: 8,
          timestamp: '2025-01-15T13:30:00Z',
          status: 'active'
        },
        {
          id: 'alert_003',
          type: 'chargeback_increase',
          severity: 'medium',
          message: 'Chargeback rate increased to 1.2% (threshold: 1%)',
          affectedUsers: 23,
          timestamp: '2025-01-14T18:00:00Z',
          status: 'resolved'
        },
        {
          id: 'alert_004',
          type: 'account_takeover',
          severity: 'critical',
          message: 'Multiple failed login attempts followed by password reset',
          affectedUsers: 3,
          timestamp: '2025-01-15T11:45:00Z',
          status: 'active'
        }
      ];

      const mockStats: FraudStats = {
        totalFlagged: 47,
        criticalAlerts: 5,
        blockedTransactions: 12,
        reviewedToday: 28,
        avgRiskScore: 52,
        falsePositiveRate: 8.5
      };

      setTransactions(mockTransactions);
      setAlerts(mockAlerts);
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch fraud data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionAction = async (transactionId: string, action: 'clear' | 'block' | 'review') => {
    // API call would go here
    setTransactions(prev => prev.map(tx => {
      if (tx.id === transactionId) {
        const newStatus = action === 'clear' ? 'cleared' : action === 'block' ? 'blocked' : 'reviewed';
        return { ...tx, status: newStatus };
      }
      return tx;
    }));
    setSelectedTransaction(null);
  };

  const handleAlertAction = async (alertId: string, action: 'resolve' | 'dismiss') => {
    setAlerts(prev => prev.map(alert => {
      if (alert.id === alertId) {
        return { ...alert, status: action === 'resolve' ? 'resolved' : 'dismissed' };
      }
      return alert;
    }));
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return commonStyles.riskCritical;
      case 'high': return commonStyles.riskHigh;
      case 'medium': return commonStyles.riskMedium;
      case 'low': return commonStyles.riskLow;
      default: return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return commonStyles.statusPending;
      case 'reviewed': return commonStyles.statusReviewed;
      case 'cleared': return commonStyles.statusCleared;
      case 'blocked': return commonStyles.statusBlocked;
      case 'active': return commonStyles.statusActive;
      case 'resolved': return commonStyles.statusResolved;
      case 'dismissed': return commonStyles.statusDismissed;
      default: return '';
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (riskFilter !== 'all' && tx.riskLevel !== riskFilter) return false;
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
    return true;
  });

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>Fraud Detection</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Monitor suspicious activities and protect your platform
          </p>
        </div>
      </div>

      {loading ? (
        <div className={cn(commonStyles.loading, themeStyles.loading)}>Loading fraud data...</div>
      ) : (
        <>
          {/* Stats Overview */}
          {stats && (
            <div className={commonStyles.statsGrid}>
              <div className={cn(commonStyles.statCard, themeStyles.statCard, commonStyles.statCritical)}>
                <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.criticalAlerts}</div>
                <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Critical Alerts</div>
              </div>
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.totalFlagged}</div>
                <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Flagged Transactions</div>
              </div>
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.blockedTransactions}</div>
                <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Blocked Today</div>
              </div>
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.reviewedToday}</div>
                <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Reviewed Today</div>
              </div>
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.avgRiskScore}</div>
                <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Avg Risk Score</div>
              </div>
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.falsePositiveRate}%</div>
                <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>False Positive Rate</div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className={cn(commonStyles.tabs, themeStyles.tabs)}>
            <button
              className={cn(commonStyles.tab, themeStyles.tab, activeTab === 'transactions' && commonStyles.tabActive, activeTab === 'transactions' && themeStyles.tabActive)}
              onClick={() => setActiveTab('transactions')}
            >
              Flagged Transactions
            </button>
            <button
              className={cn(commonStyles.tab, themeStyles.tab, activeTab === 'alerts' && commonStyles.tabActive, activeTab === 'alerts' && themeStyles.tabActive)}
              onClick={() => setActiveTab('alerts')}
            >
              Alerts ({alerts.filter(a => a.status === 'active').length})
            </button>
            <button
              className={cn(commonStyles.tab, themeStyles.tab, activeTab === 'rules' && commonStyles.tabActive, activeTab === 'rules' && themeStyles.tabActive)}
              onClick={() => setActiveTab('rules')}
            >
              Fraud Rules
            </button>
          </div>

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className={cn(commonStyles.panel, themeStyles.panel)}>
              <div className={commonStyles.filters}>
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className={cn(commonStyles.select, themeStyles.select)}
                >
                  <option value="all">All Risk Levels</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={cn(commonStyles.select, themeStyles.select)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="cleared">Cleared</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              <div className={commonStyles.transactionsList}>
                {filteredTransactions.map(tx => (
                  <div
                    key={tx.id}
                    className={cn(commonStyles.transactionCard, themeStyles.transactionCard)}
                    onClick={() => setSelectedTransaction(tx)}
                  >
                    <div className={commonStyles.transactionHeader}>
                      <div className={commonStyles.transactionInfo}>
                        <span className={cn(commonStyles.transactionType, themeStyles.transactionType)}>
                          {tx.type.toUpperCase()}
                        </span>
                        <span className={cn(commonStyles.transactionAmount, themeStyles.transactionAmount)}>
                          {tx.currency} {tx.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className={commonStyles.transactionMeta}>
                        <span className={cn(commonStyles.riskBadge, getRiskLevelColor(tx.riskLevel))}>
                          Risk: {tx.riskScore}
                        </span>
                        <span className={cn(commonStyles.statusBadge, getStatusColor(tx.status))}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                    <div className={cn(commonStyles.transactionUser, themeStyles.transactionUser)}>
                      {tx.userName} ({tx.userEmail})
                    </div>
                    <div className={commonStyles.transactionFlags}>
                      {tx.flags.map((flag, idx) => (
                        <span key={idx} className={cn(commonStyles.flag, themeStyles.flag)}>
                          {flag}
                        </span>
                      ))}
                    </div>
                    <div className={cn(commonStyles.transactionFooter, themeStyles.transactionFooter)}>
                      <span>{tx.location}</span>
                      <span>{new Date(tx.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className={cn(commonStyles.panel, themeStyles.panel)}>
              <div className={commonStyles.alertsList}>
                {alerts.map(alert => (
                  <div key={alert.id} className={cn(commonStyles.alertCard, themeStyles.alertCard)}>
                    <div className={commonStyles.alertHeader}>
                      <span className={cn(commonStyles.severityBadge, getRiskLevelColor(alert.severity))}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className={cn(commonStyles.statusBadge, getStatusColor(alert.status))}>
                        {alert.status}
                      </span>
                    </div>
                    <div className={cn(commonStyles.alertMessage, themeStyles.alertMessage)}>
                      {alert.message}
                    </div>
                    <div className={cn(commonStyles.alertMeta, themeStyles.alertMeta)}>
                      <span>Type: {alert.type.replace('_', ' ')}</span>
                      <span>Affected Users: {alert.affectedUsers}</span>
                      <span>{new Date(alert.timestamp).toLocaleString()}</span>
                    </div>
                    {alert.status === 'active' && (
                      <div className={commonStyles.alertActions}>
                        <button
                          className={cn(commonStyles.resolveButton, themeStyles.resolveButton)}
                          onClick={() => handleAlertAction(alert.id, 'resolve')}
                        >
                          Mark Resolved
                        </button>
                        <button
                          className={cn(commonStyles.dismissButton, themeStyles.dismissButton)}
                          onClick={() => handleAlertAction(alert.id, 'dismiss')}
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rules Tab */}
          {activeTab === 'rules' && (
            <div className={cn(commonStyles.panel, themeStyles.panel)}>
              <div className={cn(commonStyles.rulesHeader, themeStyles.rulesHeader)}>
                <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Fraud Detection Rules</h3>
                <button className={cn(commonStyles.addRuleButton, themeStyles.addRuleButton)}>
                  + Add Rule
                </button>
              </div>
              <div className={commonStyles.rulesList}>
                {[
                  { id: 1, name: 'Large Transaction Alert', condition: 'Amount > $5,000', action: 'Flag for review', enabled: true },
                  { id: 2, name: 'Velocity Check', condition: '>3 transactions in 1 hour', action: 'Block + Alert', enabled: true },
                  { id: 3, name: 'New Device Detection', condition: 'Unknown device fingerprint', action: 'Require 2FA', enabled: true },
                  { id: 4, name: 'Geographic Anomaly', condition: 'Location change > 500km in 1h', action: 'Flag as critical', enabled: true },
                  { id: 5, name: 'VPN Detection', condition: 'VPN/Proxy IP detected', action: 'Increase risk score +20', enabled: false },
                  { id: 6, name: 'New Account Limit', condition: 'Account age < 7 days', action: 'Max $1,000/day', enabled: true }
                ].map(rule => (
                  <div key={rule.id} className={cn(commonStyles.ruleCard, themeStyles.ruleCard)}>
                    <div className={commonStyles.ruleInfo}>
                      <div className={cn(commonStyles.ruleName, themeStyles.ruleName)}>{rule.name}</div>
                      <div className={cn(commonStyles.ruleCondition, themeStyles.ruleCondition)}>
                        Condition: {rule.condition}
                      </div>
                      <div className={cn(commonStyles.ruleAction, themeStyles.ruleAction)}>
                        Action: {rule.action}
                      </div>
                    </div>
                    <label className={commonStyles.toggle}>
                      <input type="checkbox" checked={rule.enabled} onChange={() => {}} />
                      <span className={cn(commonStyles.toggleSlider, themeStyles.toggleSlider)}></span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transaction Detail Modal */}
          {selectedTransaction && (
            <div className={commonStyles.modalOverlay} onClick={() => setSelectedTransaction(null)}>
              <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={e => e.stopPropagation()}>
                <div className={commonStyles.modalHeader}>
                  <h3 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>Transaction Details</h3>
                  <button className={commonStyles.closeButton} onClick={() => setSelectedTransaction(null)}>×</button>
                </div>
                <div className={commonStyles.modalContent}>
                  <div className={commonStyles.detailGrid}>
                    <div className={commonStyles.detailItem}>
                      <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Transaction ID</span>
                      <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>{selectedTransaction.id}</span>
                    </div>
                    <div className={commonStyles.detailItem}>
                      <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Type</span>
                      <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>{selectedTransaction.type}</span>
                    </div>
                    <div className={commonStyles.detailItem}>
                      <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Amount</span>
                      <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>
                        {selectedTransaction.currency} {selectedTransaction.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className={commonStyles.detailItem}>
                      <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Risk Score</span>
                      <span className={cn(commonStyles.detailValue, themeStyles.detailValue, getRiskLevelColor(selectedTransaction.riskLevel))}>
                        {selectedTransaction.riskScore} ({selectedTransaction.riskLevel})
                      </span>
                    </div>
                    <div className={commonStyles.detailItem}>
                      <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>User</span>
                      <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>
                        {selectedTransaction.userName}
                      </span>
                    </div>
                    <div className={commonStyles.detailItem}>
                      <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Email</span>
                      <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>
                        {selectedTransaction.userEmail}
                      </span>
                    </div>
                    <div className={commonStyles.detailItem}>
                      <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>IP Address</span>
                      <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>{selectedTransaction.ipAddress}</span>
                    </div>
                    <div className={commonStyles.detailItem}>
                      <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Location</span>
                      <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>{selectedTransaction.location}</span>
                    </div>
                    <div className={commonStyles.detailItem}>
                      <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Device</span>
                      <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>{selectedTransaction.deviceInfo}</span>
                    </div>
                    <div className={commonStyles.detailItem}>
                      <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Timestamp</span>
                      <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>
                        {new Date(selectedTransaction.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className={commonStyles.detailFlags}>
                    <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Risk Flags</span>
                    <div className={commonStyles.flagsList}>
                      {selectedTransaction.flags.map((flag, idx) => (
                        <span key={idx} className={cn(commonStyles.flagLarge, themeStyles.flagLarge)}>{flag}</span>
                      ))}
                    </div>
                  </div>
                </div>
                {selectedTransaction.status === 'pending' && (
                  <div className={commonStyles.modalActions}>
                    <button
                      className={cn(commonStyles.clearButton, themeStyles.clearButton)}
                      onClick={() => handleTransactionAction(selectedTransaction.id, 'clear')}
                    >
                      Clear Transaction
                    </button>
                    <button
                      className={cn(commonStyles.blockButton, themeStyles.blockButton)}
                      onClick={() => handleTransactionAction(selectedTransaction.id, 'block')}
                    >
                      Block Transaction
                    </button>
                    <button
                      className={cn(commonStyles.reviewButton, themeStyles.reviewButton)}
                      onClick={() => handleTransactionAction(selectedTransaction.id, 'review')}
                    >
                      Mark as Reviewed
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
