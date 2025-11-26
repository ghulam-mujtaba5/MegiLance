// @AI-HINT: Admin platform compliance management for GDPR, data retention, and regulatory requirements
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '../../../components/Button/Button';
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
          last_checked: new Date(Date.now() - 604800000).toISOString(),
          next_review: new Date().toISOString(),
          automated: false,
          notes: 'Banner text needs to be updated for new cookie categories'
        },
        {
          id: '4',
          name: 'Financial Records Retention',
          description: 'Maintain financial records for 7 years',
          category: 'financial',
          status: 'compliant',
          last_checked: new Date().toISOString(),
          next_review: new Date(Date.now() + 31536000000).toISOString(),
          automated: false
        },
        {
          id: '5',
          name: 'WCAG 2.1 AA Compliance',
          description: 'Meet accessibility standards for web content',
          category: 'accessibility',
          status: 'non_compliant',
          last_checked: new Date(Date.now() - 172800000).toISOString(),
          next_review: new Date().toISOString(),
          automated: false,
          notes: '3 pages failed color contrast tests'
        }
      ]);

      setPolicies([
        {
          id: '1',
          data_type: 'Session Logs',
          retention_period: 90,
          period_unit: 'days',
          action: 'delete',
          is_active: true,
          last_run: new Date(Date.now() - 86400000).toISOString(),
          records_affected: 15234
        },
        {
          id: '2',
          data_type: 'User Messages',
          retention_period: 2,
          period_unit: 'years',
          action: 'anonymize',
          is_active: true,
          last_run: new Date(Date.now() - 604800000).toISOString(),
          records_affected: 892
        },
        {
          id: '3',
          data_type: 'Deleted Accounts',
          retention_period: 30,
          period_unit: 'days',
          action: 'delete',
          is_active: true,
          last_run: new Date(Date.now() - 86400000).toISOString(),
          records_affected: 45
        },
        {
          id: '4',
          data_type: 'Transaction Records',
          retention_period: 7,
          period_unit: 'years',
          action: 'archive',
          is_active: true
        }
      ]);

      setReports([
        {
          id: '1',
          type: 'GDPR Compliance Summary',
          generated_at: new Date().toISOString(),
          status: 'ready',
          download_url: '/reports/gdpr_summary.pdf'
        },
        {
          id: '2',
          type: 'Data Retention Audit',
          generated_at: new Date(Date.now() - 604800000).toISOString(),
          status: 'ready',
          download_url: '/reports/retention_audit.pdf'
        }
      ]);

      setDataRequests([
        {
          id: '1',
          type: 'deletion',
          user_email: 'user1@example.com',
          status: 'in_progress',
          submitted_at: new Date(Date.now() - 432000000).toISOString(),
          deadline: new Date(Date.now() + 2160000000).toISOString()
        },
        {
          id: '2',
          type: 'access',
          user_email: 'user2@example.com',
          status: 'completed',
          submitted_at: new Date(Date.now() - 1209600000).toISOString(),
          completed_at: new Date(Date.now() - 864000000).toISOString(),
          deadline: new Date(Date.now() - 432000000).toISOString()
        },
        {
          id: '3',
          type: 'portability',
          user_email: 'user3@example.com',
          status: 'pending',
          submitted_at: new Date(Date.now() - 86400000).toISOString(),
          deadline: new Date(Date.now() + 2505600000).toISOString()
        }
      ]);
    } catch (error) {
      console.error('Failed to load compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: ComplianceRule['status']) => {
    const config = {
      compliant: { label: 'Compliant', class: 'statusCompliant' },
      non_compliant: { label: 'Non-Compliant', class: 'statusNonCompliant' },
      needs_review: { label: 'Needs Review', class: 'statusReview' },
      not_applicable: { label: 'N/A', class: 'statusNA' }
    };
    return config[status];
  };

  const getRequestTypeBadge = (type: DataRequest['type']) => {
    const config = {
      access: { label: 'Access', class: 'typeAccess' },
      deletion: { label: 'Deletion', class: 'typeDeletion' },
      portability: { label: 'Portability', class: 'typePortability' },
      rectification: { label: 'Rectification', class: 'typeRectification' }
    };
    return config[type];
  };

  const filteredRules = rules.filter(rule =>
    selectedCategory === 'all' || rule.category === selectedCategory
  );

  const complianceStats = {
    total: rules.length,
    compliant: rules.filter(r => r.status === 'compliant').length,
    nonCompliant: rules.filter(r => r.status === 'non_compliant').length,
    needsReview: rules.filter(r => r.status === 'needs_review').length
  };

  const pendingRequests = dataRequests.filter(r => r.status === 'pending' || r.status === 'in_progress').length;

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={cn(commonStyles.header, themeStyles.header)}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>
            Compliance Management
          </h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            GDPR, data retention, and regulatory compliance monitoring
          </p>
        </div>
        <div className={commonStyles.headerActions}>
          <Button variant="secondary">Run Audit</Button>
          <Button variant="primary">Generate Report</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={commonStyles.statsGrid}>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <span className={cn(commonStyles.statValue, themeStyles.statValue)}>
            {complianceStats.compliant}/{complianceStats.total}
          </span>
          <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>
            Rules Compliant
          </span>
        </div>
        <div className={cn(commonStyles.statCard, themeStyles.statCard, commonStyles.statWarning, themeStyles.statWarning)}>
          <span className={cn(commonStyles.statValue, themeStyles.statValue)}>
            {complianceStats.nonCompliant}
          </span>
          <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>
            Non-Compliant
          </span>
        </div>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <span className={cn(commonStyles.statValue, themeStyles.statValue)}>
            {complianceStats.needsReview}
          </span>
          <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>
            Needs Review
          </span>
        </div>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <span className={cn(commonStyles.statValue, themeStyles.statValue)}>
            {pendingRequests}
          </span>
          <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>
            Pending Requests
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className={cn(commonStyles.tabs, themeStyles.tabs)}>
        {(['overview', 'retention', 'requests', 'reports'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              commonStyles.tab,
              themeStyles.tab,
              activeTab === tab && commonStyles.tabActive,
              activeTab === tab && themeStyles.tabActive
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={commonStyles.loading}>Loading...</div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className={commonStyles.overviewTab}>
              {/* Category Filter */}
              <div className={cn(commonStyles.filterBar, themeStyles.filterBar)}>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={cn(commonStyles.select, themeStyles.select)}
                >
                  <option value="all">All Categories</option>
                  <option value="gdpr">GDPR</option>
                  <option value="security">Security</option>
                  <option value="financial">Financial</option>
                  <option value="data_retention">Data Retention</option>
                  <option value="accessibility">Accessibility</option>
                </select>
              </div>

              {/* Rules List */}
              <div className={commonStyles.rulesList}>
                {filteredRules.map(rule => {
                  const statusConfig = getStatusBadge(rule.status);
                  return (
                    <div key={rule.id} className={cn(commonStyles.ruleCard, themeStyles.ruleCard)}>
                      <div className={commonStyles.ruleHeader}>
                        <div>
                          <h4 className={cn(commonStyles.ruleName, themeStyles.ruleName)}>
                            {rule.name}
                          </h4>
                          <span className={cn(commonStyles.categoryBadge, themeStyles.categoryBadge)}>
                            {rule.category.replace('_', ' ')}
                          </span>
                        </div>
                        <span className={cn(
                          commonStyles.statusBadge,
                          commonStyles[statusConfig.class],
                          themeStyles[statusConfig.class]
                        )}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className={cn(commonStyles.ruleDesc, themeStyles.ruleDesc)}>
                        {rule.description}
                      </p>
                      {rule.notes && (
                        <p className={cn(commonStyles.ruleNotes, themeStyles.ruleNotes)}>
                          Note: {rule.notes}
                        </p>
                      )}
                      <div className={cn(commonStyles.ruleMeta, themeStyles.ruleMeta)}>
                        <span>Last checked: {new Date(rule.last_checked).toLocaleDateString()}</span>
                        <span>Next review: {new Date(rule.next_review).toLocaleDateString()}</span>
                        {rule.automated && <span className={commonStyles.automatedTag}>Automated</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Retention Tab */}
          {activeTab === 'retention' && (
            <div className={commonStyles.retentionTab}>
              <div className={commonStyles.policiesList}>
                {policies.map(policy => (
                  <div key={policy.id} className={cn(commonStyles.policyCard, themeStyles.policyCard)}>
                    <div className={commonStyles.policyHeader}>
                      <h4 className={cn(commonStyles.policyName, themeStyles.policyName)}>
                        {policy.data_type}
                      </h4>
                      <span className={cn(
                        commonStyles.policyStatus,
                        policy.is_active ? commonStyles.policyActive : commonStyles.policyInactive,
                        policy.is_active ? themeStyles.policyActive : themeStyles.policyInactive
                      )}>
                        {policy.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className={cn(commonStyles.policyDetails, themeStyles.policyDetails)}>
                      <div className={commonStyles.policyDetail}>
                        <span className={commonStyles.detailLabel}>Retention:</span>
                        <span className={commonStyles.detailValue}>
                          {policy.retention_period} {policy.period_unit}
                        </span>
                      </div>
                      <div className={commonStyles.policyDetail}>
                        <span className={commonStyles.detailLabel}>Action:</span>
                        <span className={commonStyles.detailValue}>
                          {policy.action.charAt(0).toUpperCase() + policy.action.slice(1)}
                        </span>
                      </div>
                      {policy.last_run && (
                        <div className={commonStyles.policyDetail}>
                          <span className={commonStyles.detailLabel}>Last run:</span>
                          <span className={commonStyles.detailValue}>
                            {new Date(policy.last_run).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {policy.records_affected !== undefined && (
                        <div className={commonStyles.policyDetail}>
                          <span className={commonStyles.detailLabel}>Records affected:</span>
                          <span className={commonStyles.detailValue}>
                            {policy.records_affected.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={commonStyles.policyActions}>
                      <Button variant="ghost" size="sm">Edit</Button>
                      <Button variant="secondary" size="sm">Run Now</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className={commonStyles.requestsTab}>
              <div className={commonStyles.requestsList}>
                {dataRequests.map(request => {
                  const typeConfig = getRequestTypeBadge(request.type);
                  return (
                    <div key={request.id} className={cn(commonStyles.requestCard, themeStyles.requestCard)}>
                      <div className={commonStyles.requestHeader}>
                        <span className={cn(
                          commonStyles.typeBadge,
                          commonStyles[typeConfig.class],
                          themeStyles[typeConfig.class]
                        )}>
                          {typeConfig.label}
                        </span>
                        <span className={cn(
                          commonStyles.requestStatus,
                          commonStyles[`status${request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('_', '')}`],
                          themeStyles[`status${request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('_', '')}`]
                        )}>
                          {request.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className={cn(commonStyles.requestEmail, themeStyles.requestEmail)}>
                        {request.user_email}
                      </div>
                      <div className={cn(commonStyles.requestMeta, themeStyles.requestMeta)}>
                        <span>Submitted: {new Date(request.submitted_at).toLocaleDateString()}</span>
                        <span>Deadline: {new Date(request.deadline).toLocaleDateString()}</span>
                      </div>
                      {request.status !== 'completed' && (
                        <div className={commonStyles.requestActions}>
                          {request.status === 'pending' && (
                            <Button variant="primary" size="sm">Process</Button>
                          )}
                          {request.status === 'in_progress' && (
                            <Button variant="success" size="sm">Complete</Button>
                          )}
                          <Button variant="ghost" size="sm">View Details</Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className={commonStyles.reportsTab}>
              <div className={commonStyles.reportsList}>
                {reports.map(report => (
                  <div key={report.id} className={cn(commonStyles.reportCard, themeStyles.reportCard)}>
                    <div className={commonStyles.reportInfo}>
                      <h4 className={cn(commonStyles.reportName, themeStyles.reportName)}>
                        {report.type}
                      </h4>
                      <span className={cn(commonStyles.reportDate, themeStyles.reportDate)}>
                        Generated: {new Date(report.generated_at).toLocaleString()}
                      </span>
                    </div>
                    <div className={commonStyles.reportActions}>
                      {report.status === 'ready' && report.download_url && (
                        <Button variant="primary" size="sm">Download</Button>
                      )}
                      {report.status === 'generating' && (
                        <span className={cn(commonStyles.generating, themeStyles.generating)}>
                          Generating...
                        </span>
                      )}
                      <Button variant="ghost" size="sm">Regenerate</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
