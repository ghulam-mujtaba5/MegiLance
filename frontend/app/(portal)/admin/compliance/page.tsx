// @AI-HINT: Admin platform compliance management for GDPR, data retention, and regulatory requirements
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '../../../components/Button/Button';
import { PageTransition, ScrollReveal, StaggerContainer, StaggerItem } from '@/app/components/Animations';
import commonStyles from './Compliance.common.module.css';
import lightStyles from './Compliance.light.module.css';
import darkStyles from './Compliance.dark.module.css';

interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: 'gdpr' | 'data_retention' | 'security' | 'financial' | 'accessibility';
  status: 'compliant' | 'non_compliant' | 'needs_review' | 'not_applicable';
  last_checked: string;
  next_review: string;
  automated: boolean;
  notes?: string;
}

interface DataRetentionPolicy {
  id: string;
  data_type: string;
  retention_period: number;
  period_unit: 'days' | 'months' | 'years';
  action: 'delete' | 'anonymize' | 'archive';
  is_active: boolean;
  last_run?: string;
  records_affected?: number;
}

interface ComplianceReport {
  id: string;
  type: string;
  generated_at: string;
  status: 'ready' | 'generating' | 'failed';
  download_url?: string;
}

interface DataRequest {
  id: string;
  type: 'access' | 'deletion' | 'portability' | 'rectification';
  user_email: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  submitted_at: string;
  completed_at?: string;
  deadline: string;
}

type TabType = 'overview' | 'retention' | 'requests' | 'reports';

export default function CompliancePage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [policies, setPolicies] = useState<DataRetentionPolicy[]>([]);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [dataRequests, setDataRequests] = useState<DataRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    setMounted(true);
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    setLoading(true);
    try {
      // Simulated API calls
      setRules([
        {
          id: '1',
          name: 'User Consent Collection',
          description: 'Collect explicit consent before processing personal data',
          category: 'gdpr',
          status: 'compliant',
          last_checked: new Date().toISOString(),
          next_review: new Date(Date.now() + 2592000000).toISOString(),
          automated: true
        },
        {
          id: '2',
          name: 'Data Encryption at Rest',
          description: 'All personal data must be encrypted when stored',
          category: 'security',
          status: 'compliant',
          last_checked: new Date().toISOString(),
          next_review: new Date(Date.now() + 7776000000).toISOString(),
          automated: true
        },
        {
          id: '3',
          name: 'Cookie Policy Display',
          description: 'Display cookie consent banner to all visitors',
          category: 'gdpr',
          status: 'needs_review',
          last_checked: new Date(Date.now() - 86400000).toISOString(),
          next_review: new Date().toISOString(),
          automated: false,
          notes: 'Update required for new EU guidelines'
        },
        {
          id: '4',
          name: 'Financial Record Retention',
          description: 'Keep transaction records for 7 years',
          category: 'financial',
          status: 'compliant',
          last_checked: new Date().toISOString(),
          next_review: new Date(Date.now() + 15552000000).toISOString(),
          automated: true
        },
        {
          id: '5',
          name: 'WCAG 2.1 Accessibility',
          description: 'Ensure platform meets AA accessibility standards',
          category: 'accessibility',
          status: 'non_compliant',
          last_checked: new Date(Date.now() - 172800000).toISOString(),
          next_review: new Date().toISOString(),
          automated: true,
          notes: 'Contrast issues detected on dashboard'
        }
      ]);

      setPolicies([
        {
          id: '1',
          data_type: 'Inactive User Accounts',
          retention_period: 2,
          period_unit: 'years',
          action: 'anonymize',
          is_active: true,
          last_run: new Date(Date.now() - 86400000).toISOString(),
          records_affected: 12
        },
        {
          id: '2',
          data_type: 'Chat Logs',
          retention_period: 6,
          period_unit: 'months',
          action: 'archive',
          is_active: true,
          last_run: new Date(Date.now() - 43200000).toISOString(),
          records_affected: 1450
        },
        {
          id: '3',
          data_type: 'Failed Login Attempts',
          retention_period: 30,
          period_unit: 'days',
          action: 'delete',
          is_active: true,
          last_run: new Date().toISOString(),
          records_affected: 89
        }
      ]);

      setDataRequests([
        {
          id: 'REQ-001',
          type: 'access',
          user_email: 'user@example.com',
          status: 'pending',
          submitted_at: new Date(Date.now() - 172800000).toISOString(),
          deadline: new Date(Date.now() + 2419200000).toISOString()
        },
        {
          id: 'REQ-002',
          type: 'deletion',
          user_email: 'deleted@example.com',
          status: 'completed',
          submitted_at: new Date(Date.now() - 604800000).toISOString(),
          completed_at: new Date(Date.now() - 86400000).toISOString(),
          deadline: new Date(Date.now() + 1814400000).toISOString()
        }
      ]);

      setReports([
        {
          id: 'REP-2025-05',
          type: 'Monthly GDPR Audit',
          generated_at: new Date(Date.now() - 86400000).toISOString(),
          status: 'ready',
          download_url: '#'
        },
        {
          id: 'REP-2025-04',
          type: 'Monthly GDPR Audit',
          generated_at: new Date(Date.now() - 2678400000).toISOString(),
          status: 'ready',
          download_url: '#'
        }
      ]);

    } catch (error) {
      console.error('Failed to load compliance data', error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !resolvedTheme) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'non_compliant': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      case 'needs_review': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'not_applicable': return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const filteredRules = selectedCategory === 'all' 
    ? rules 
    : rules.filter(r => r.category === selectedCategory);

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <header className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Compliance Center</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Manage regulatory compliance, data retention, and privacy requests
              </p>
            </div>
            <div className={commonStyles.headerActions}>
              <Button variant="outline" onClick={() => loadComplianceData()}>Refresh Data</Button>
              <Button variant="primary">Generate Report</Button>
            </div>
          </header>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className={commonStyles.tabs}>
            {(['overview', 'retention', 'requests', 'reports'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  commonStyles.tab,
                  activeTab === tab ? commonStyles.activeTab : '',
                  activeTab === tab ? themeStyles.activeTab : themeStyles.tab
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </ScrollReveal>

        <div className={commonStyles.content}>
          {activeTab === 'overview' && (
            <div className={commonStyles.overviewGrid}>
              <ScrollReveal delay={0.2}>
                <div className={cn(commonStyles.statsCard, themeStyles.card)}>
                  <h3>Compliance Score</h3>
                  <div className={commonStyles.scoreCircle}>
                    <span className={commonStyles.scoreValue}>85%</span>
                    <span className={commonStyles.scoreLabel}>Good</span>
                  </div>
                  <p className={commonStyles.scoreNote}>3 issues require attention</p>
                </div>
              </ScrollReveal>

              <div className={commonStyles.rulesSection}>
                <ScrollReveal delay={0.2}>
                  <div className={commonStyles.filterBar}>
                    <select 
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className={cn(commonStyles.select, themeStyles.select)}
                    >
                      <option value="all">All Categories</option>
                      <option value="gdpr">GDPR</option>
                      <option value="security">Security</option>
                      <option value="financial">Financial</option>
                      <option value="accessibility">Accessibility</option>
                    </select>
                  </div>
                </ScrollReveal>

                <StaggerContainer className={commonStyles.rulesList}>
                  {filteredRules.map((rule) => (
                    <StaggerItem key={rule.id} className={cn(commonStyles.ruleCard, themeStyles.card)}>
                      <div className={commonStyles.ruleHeader}>
                        <div className={commonStyles.ruleInfo}>
                          <h4>{rule.name}</h4>
                          <span className={commonStyles.categoryTag}>{rule.category.toUpperCase()}</span>
                        </div>
                        <span className={cn(commonStyles.statusBadge, getStatusColor(rule.status))}>
                          {getStatusLabel(rule.status)}
                        </span>
                      </div>
                      <p className={commonStyles.ruleDesc}>{rule.description}</p>
                      <div className={commonStyles.ruleMeta}>
                        <span>Last checked: {new Date(rule.last_checked).toLocaleDateString()}</span>
                        <span>Next review: {new Date(rule.next_review).toLocaleDateString()}</span>
                        <span>{rule.automated ? '🤖 Automated' : '👤 Manual'}</span>
                      </div>
                      {rule.notes && (
                        <div className={cn(commonStyles.ruleNotes, themeStyles.notes)}>
                          Note: {rule.notes}
                        </div>
                      )}
                      <div className={commonStyles.ruleActions}>
                        <Button variant="ghost" size="sm">View Details</Button>
                        {rule.status !== 'compliant' && (
                          <Button variant="outline" size="sm">Fix Issue</Button>
                        )}
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>
            </div>
          )}

          {activeTab === 'retention' && (
            <StaggerContainer className={commonStyles.policiesList}>
              <div className={commonStyles.sectionHeader}>
                <h3>Data Retention Policies</h3>
                <Button variant="primary" size="sm">Add Policy</Button>
              </div>
              {policies.map((policy) => (
                <StaggerItem key={policy.id} className={cn(commonStyles.policyCard, themeStyles.card)}>
                  <div className={commonStyles.policyHeader}>
                    <h4>{policy.data_type}</h4>
                    <div className={cn(commonStyles.toggle, policy.is_active ? commonStyles.active : '')}>
                      {policy.is_active ? 'Active' : 'Paused'}
                    </div>
                  </div>
                  <div className={commonStyles.policyDetails}>
                    <div className={commonStyles.detailItem}>
                      <label>Retention Period</label>
                      <span>{policy.retention_period} {policy.period_unit}</span>
                    </div>
                    <div className={commonStyles.detailItem}>
                      <label>Action</label>
                      <span className={commonStyles.actionTag}>{policy.action.toUpperCase()}</span>
                    </div>
                    <div className={commonStyles.detailItem}>
                      <label>Last Run</label>
                      <span>{policy.last_run ? new Date(policy.last_run).toLocaleDateString() : 'Never'}</span>
                    </div>
                    <div className={commonStyles.detailItem}>
                      <label>Records Affected</label>
                      <span>{policy.records_affected || 0}</span>
                    </div>
                  </div>
                  <div className={commonStyles.policyActions}>
                    <Button variant="ghost" size="sm">Edit Policy</Button>
                    <Button variant="ghost" size="sm">Run Now</Button>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}

          {activeTab === 'requests' && (
            <StaggerContainer className={commonStyles.requestsList}>
              <div className={commonStyles.sectionHeader}>
                <h3>Data Subject Requests (DSR)</h3>
              </div>
              {dataRequests.length === 0 ? (
                <div className={commonStyles.emptyState}>No pending requests</div>
              ) : (
                dataRequests.map((request) => (
                  <StaggerItem key={request.id} className={cn(commonStyles.requestCard, themeStyles.card)}>
                    <div className={commonStyles.requestHeader}>
                      <div className={commonStyles.requestId}>
                        <span className={commonStyles.idLabel}>{request.id}</span>
                        <span className={commonStyles.typeLabel}>{request.type.toUpperCase()}</span>
                      </div>
                      <span className={cn(commonStyles.statusBadge, 
                        request.status === 'completed' ? 'text-green-600 bg-green-100' : 
                        request.status === 'rejected' ? 'text-red-600 bg-red-100' : 
                        'text-blue-600 bg-blue-100'
                      )}>
                        {getStatusLabel(request.status)}
                      </span>
                    </div>
                    <div className={commonStyles.requestBody}>
                      <p><strong>User:</strong> {request.user_email}</p>
                      <p><strong>Submitted:</strong> {new Date(request.submitted_at).toLocaleDateString()}</p>
                      <p><strong>Deadline:</strong> {new Date(request.deadline).toLocaleDateString()}</p>
                    </div>
                    <div className={commonStyles.requestActions}>
                      <Button variant="primary" size="sm">Process Request</Button>
                    </div>
                  </StaggerItem>
                ))
              )}
            </StaggerContainer>
          )}

          {activeTab === 'reports' && (
            <StaggerContainer className={commonStyles.reportsList}>
              <div className={commonStyles.sectionHeader}>
                <h3>Compliance Reports</h3>
              </div>
              {reports.map((report) => (
                <StaggerItem key={report.id} className={cn(commonStyles.reportRow, themeStyles.card)}>
                  <div className={commonStyles.reportInfo}>
                    <span className={commonStyles.reportIcon}>📄</span>
                    <div>
                      <h4>{report.type}</h4>
                      <span className={commonStyles.reportDate}>{new Date(report.generated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className={commonStyles.reportStatus}>
                    {report.status === 'ready' ? (
                      <Button variant="outline" size="sm">Download PDF</Button>
                    ) : (
                      <span>{report.status}</span>
                    )}
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
