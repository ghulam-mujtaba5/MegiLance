// @AI-HINT: Admin data analytics export page for generating and downloading reports
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '../../../components/Button/Button';
import commonStyles from './Export.common.module.css';
import lightStyles from './Export.light.module.css';
import darkStyles from './Export.dark.module.css';

interface ExportJob {
  id: string;
  name: string;
  type: 'users' | 'projects' | 'transactions' | 'analytics' | 'custom';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  format: 'csv' | 'json' | 'xlsx' | 'pdf';
  file_size?: number;
  download_url?: string;
  created_at: string;
  completed_at?: string;
  expires_at?: string;
  progress?: number;
  filters?: Record<string, unknown>;
}

interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  fields: string[];
  is_default: boolean;
}

type DataType = 'users' | 'projects' | 'transactions' | 'analytics' | 'custom';

export default function DataExportPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Export form state
  const [dataType, setDataType] = useState<DataType>('users');
  const [format, setFormat] = useState<'csv' | 'json' | 'xlsx' | 'pdf'>('csv');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [exportName, setExportName] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const fieldOptions: Record<DataType, string[]> = {
    users: ['id', 'email', 'name', 'role', 'status', 'created_at', 'last_login', 'total_earnings', 'total_spent', 'projects_count'],
    projects: ['id', 'title', 'description', 'status', 'budget', 'client', 'freelancer', 'created_at', 'deadline', 'completed_at'],
    transactions: ['id', 'type', 'amount', 'currency', 'status', 'sender', 'receiver', 'created_at', 'completed_at', 'fee'],
    analytics: ['date', 'active_users', 'new_signups', 'projects_posted', 'transactions_volume', 'platform_revenue'],
    custom: []
  };

  useEffect(() => {
    setMounted(true);
    loadExportData();
  }, []);

  const loadExportData = async () => {
    setLoading(true);
    try {
      // Simulated API calls
      // const [jobsRes, templatesRes] = await Promise.all([
      //   dataAnalyticsExportApi.getExportJobs(),
      //   dataAnalyticsExportApi.getTemplates()
      // ]);

      setExportJobs([
        {
          id: '1',
          name: 'Monthly Users Report',
          type: 'users',
          status: 'completed',
          format: 'csv',
          file_size: 245000,
          download_url: '/exports/users_monthly.csv',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          completed_at: new Date(Date.now() - 3500000).toISOString(),
          expires_at: new Date(Date.now() + 604800000).toISOString()
        },
        {
          id: '2',
          name: 'Q4 Transactions',
          type: 'transactions',
          status: 'processing',
          format: 'xlsx',
          created_at: new Date(Date.now() - 600000).toISOString(),
          progress: 65
        },
        {
          id: '3',
          name: 'Project Analytics',
          type: 'analytics',
          status: 'failed',
          format: 'pdf',
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ]);

      setTemplates([
        {
          id: 't1',
          name: 'Standard User Export',
          description: 'Basic user data with activity metrics',
          type: 'users',
          fields: ['id', 'email', 'name', 'role', 'created_at'],
          is_default: true
        },
        {
          id: 't2',
          name: 'Financial Report',
          description: 'Transaction details with fees and totals',
          type: 'transactions',
          fields: ['id', 'type', 'amount', 'currency', 'status', 'fee'],
          is_default: false
        }
      ]);

      setSelectedFields(fieldOptions.users.slice(0, 5));
    } catch (error) {
      console.error('Failed to load export data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDataTypeChange = (type: DataType) => {
    setDataType(type);
    setSelectedFields(fieldOptions[type].slice(0, 5));
  };

  const handleFieldToggle = (field: string) => {
    setSelectedFields(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const handleSelectAllFields = () => {
    setSelectedFields(fieldOptions[dataType]);
  };

  const handleClearFields = () => {
    setSelectedFields([]);
  };

  const handleApplyTemplate = (template: ExportTemplate) => {
    setDataType(template.type as DataType);
    setSelectedFields(template.fields);
    setExportName(template.name);
  };

  const handleCreateExport = async () => {
    if (selectedFields.length === 0) return;

    setIsExporting(true);
    try {
      // await dataAnalyticsExportApi.createExport({
      //   name: exportName || `${dataType}_export_${Date.now()}`,
      //   type: dataType,
      //   format,
      //   fields: selectedFields,
      //   date_range: dateRange.start && dateRange.end ? dateRange : undefined,
      //   include_archived: includeArchived
      // });

      // Add mock job to list
      const newJob: ExportJob = {
        id: Date.now().toString(),
        name: exportName || `${dataType}_export_${Date.now()}`,
        type: dataType,
        status: 'pending',
        format,
        created_at: new Date().toISOString(),
        progress: 0
      };
      setExportJobs(prev => [newJob, ...prev]);
      setActiveTab('history');

      // Reset form
      setExportName('');
    } catch (error) {
      console.error('Failed to create export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = (job: ExportJob) => {
    if (job.download_url) {
      window.open(job.download_url, '_blank');
    }
  };

  const handleCancelJob = async (jobId: string) => {
    setExportJobs(prev =>
      prev.map(j => j.id === jobId ? { ...j, status: 'failed' as const } : j)
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusBadge = (status: ExportJob['status']) => {
    const statusConfig = {
      pending: { label: 'Pending', class: 'statusPending' },
      processing: { label: 'Processing', class: 'statusProcessing' },
      completed: { label: 'Completed', class: 'statusCompleted' },
      failed: { label: 'Failed', class: 'statusFailed' }
    };
    return statusConfig[status];
  };

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={cn(commonStyles.header, themeStyles.header)}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>
            Data Export
          </h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Generate and download platform data reports
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={cn(commonStyles.tabs, themeStyles.tabs)}>
        <button
          onClick={() => setActiveTab('create')}
          className={cn(
            commonStyles.tab,
            themeStyles.tab,
            activeTab === 'create' && commonStyles.tabActive,
            activeTab === 'create' && themeStyles.tabActive
          )}
        >
          Create Export
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            commonStyles.tab,
            themeStyles.tab,
            activeTab === 'history' && commonStyles.tabActive,
            activeTab === 'history' && themeStyles.tabActive
          )}
        >
          Export History
          {exportJobs.filter(j => j.status === 'processing').length > 0 && (
            <span className={cn(commonStyles.badge, themeStyles.badge)}>
              {exportJobs.filter(j => j.status === 'processing').length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className={commonStyles.loading}>Loading...</div>
      ) : (
        <>
          {activeTab === 'create' && (
            <div className={commonStyles.createView}>
              {/* Templates */}
              <div className={cn(commonStyles.section, themeStyles.section)}>
                <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                  Quick Templates
                </h3>
                <div className={commonStyles.templateGrid}>
                  {templates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleApplyTemplate(template)}
                      className={cn(commonStyles.templateCard, themeStyles.templateCard)}
                    >
                      <h4>{template.name}</h4>
                      <p>{template.description}</p>
                      {template.is_default && (
                        <span className={cn(commonStyles.defaultBadge, themeStyles.defaultBadge)}>
                          Default
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Export Configuration */}
              <div className={cn(commonStyles.section, themeStyles.section)}>
                <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                  Export Configuration
                </h3>

                <div className={commonStyles.formGrid}>
                  {/* Data Type */}
                  <div className={commonStyles.formGroup}>
                    <label className={cn(commonStyles.label, themeStyles.label)}>
                      Data Type
                    </label>
                    <select
                      value={dataType}
                      onChange={(e) => handleDataTypeChange(e.target.value as DataType)}
                      className={cn(commonStyles.select, themeStyles.select)}
                    >
                      <option value="users">Users</option>
                      <option value="projects">Projects</option>
                      <option value="transactions">Transactions</option>
                      <option value="analytics">Analytics</option>
                    </select>
                  </div>

                  {/* Format */}
                  <div className={commonStyles.formGroup}>
                    <label className={cn(commonStyles.label, themeStyles.label)}>
                      Export Format
                    </label>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value as typeof format)}
                      className={cn(commonStyles.select, themeStyles.select)}
                    >
                      <option value="csv">CSV</option>
                      <option value="json">JSON</option>
                      <option value="xlsx">Excel (XLSX)</option>
                      <option value="pdf">PDF Report</option>
                    </select>
                  </div>

                  {/* Export Name */}
                  <div className={commonStyles.formGroup}>
                    <label className={cn(commonStyles.label, themeStyles.label)}>
                      Export Name (optional)
                    </label>
                    <input
                      type="text"
                      value={exportName}
                      onChange={(e) => setExportName(e.target.value)}
                      placeholder="My Custom Export"
                      className={cn(commonStyles.input, themeStyles.input)}
                    />
                  </div>

                  {/* Date Range */}
                  <div className={commonStyles.formGroup}>
                    <label className={cn(commonStyles.label, themeStyles.label)}>
                      Date Range
                    </label>
                    <div className={commonStyles.dateRange}>
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className={cn(commonStyles.input, themeStyles.input)}
                      />
                      <span>to</span>
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className={cn(commonStyles.input, themeStyles.input)}
                      />
                    </div>
                  </div>
                </div>

                {/* Fields Selection */}
                <div className={commonStyles.fieldsSection}>
                  <div className={commonStyles.fieldsHeader}>
                    <label className={cn(commonStyles.label, themeStyles.label)}>
                      Select Fields ({selectedFields.length} selected)
                    </label>
                    <div className={commonStyles.fieldActions}>
                      <button
                        onClick={handleSelectAllFields}
                        className={cn(commonStyles.textBtn, themeStyles.textBtn)}
                      >
                        Select All
                      </button>
                      <button
                        onClick={handleClearFields}
                        className={cn(commonStyles.textBtn, themeStyles.textBtn)}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className={commonStyles.fieldsGrid}>
                    {fieldOptions[dataType].map(field => (
                      <label
                        key={field}
                        className={cn(
                          commonStyles.fieldOption,
                          themeStyles.fieldOption,
                          selectedFields.includes(field) && commonStyles.fieldSelected,
                          selectedFields.includes(field) && themeStyles.fieldSelected
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFields.includes(field)}
                          onChange={() => handleFieldToggle(field)}
                        />
                        {field.replace(/_/g, ' ')}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Include Archived */}
                <label className={cn(commonStyles.checkbox, themeStyles.checkbox)}>
                  <input
                    type="checkbox"
                    checked={includeArchived}
                    onChange={(e) => setIncludeArchived(e.target.checked)}
                  />
                  Include archived/deleted records
                </label>

                {/* Export Button */}
                <div className={commonStyles.exportActions}>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleCreateExport}
                    isLoading={isExporting}
                    disabled={selectedFields.length === 0}
                  >
                    Generate Export
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className={cn(commonStyles.historyView, themeStyles.historyView)}>
              {exportJobs.length === 0 ? (
                <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                  <p>No export jobs yet</p>
                  <Button variant="primary" onClick={() => setActiveTab('create')}>
                    Create Your First Export
                  </Button>
                </div>
              ) : (
                <div className={commonStyles.jobsList}>
                  {exportJobs.map(job => {
                    const statusConfig = getStatusBadge(job.status);
                    return (
                      <div
                        key={job.id}
                        className={cn(commonStyles.jobCard, themeStyles.jobCard)}
                      >
                        <div className={commonStyles.jobInfo}>
                          <div className={commonStyles.jobHeader}>
                            <h4 className={cn(commonStyles.jobName, themeStyles.jobName)}>
                              {job.name}
                            </h4>
                            <span className={cn(
                              commonStyles.statusBadge,
                              commonStyles[statusConfig.class],
                              themeStyles[statusConfig.class]
                            )}>
                              {statusConfig.label}
                            </span>
                          </div>
                          <div className={cn(commonStyles.jobMeta, themeStyles.jobMeta)}>
                            <span>{job.type}</span>
                            <span>•</span>
                            <span>{job.format.toUpperCase()}</span>
                            <span>•</span>
                            <span>{formatFileSize(job.file_size)}</span>
                          </div>
                          <div className={cn(commonStyles.jobDates, themeStyles.jobDates)}>
                            <span>Created: {new Date(job.created_at).toLocaleString()}</span>
                            {job.expires_at && (
                              <span>Expires: {new Date(job.expires_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>

                        {job.status === 'processing' && job.progress !== undefined && (
                          <div className={commonStyles.progressBar}>
                            <div
                              className={cn(commonStyles.progressFill, themeStyles.progressFill)}
                              style={{ width: `${job.progress}%` }}
                            />
                            <span className={commonStyles.progressText}>{job.progress}%</span>
                          </div>
                        )}

                        <div className={commonStyles.jobActions}>
                          {job.status === 'completed' && (
                            <Button variant="primary" size="sm" onClick={() => handleDownload(job)}>
                              Download
                            </Button>
                          )}
                          {job.status === 'processing' && (
                            <Button variant="ghost" size="sm" onClick={() => handleCancelJob(job.id)}>
                              Cancel
                            </Button>
                          )}
                          {job.status === 'failed' && (
                            <Button variant="secondary" size="sm">
                              Retry
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
