// @AI-HINT: Admin data analytics export page for generating and downloading reports
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '../../../components/Button/Button';
import Input from '@/app/components/Input/Input';
import Select from '@/app/components/Select/Select';
import { PageTransition, ScrollReveal, StaggerContainer, StaggerItem } from '@/app/components/Animations';
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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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
      // Fetch real export data from API
      const apiModule = await import('@/lib/api') as any;
      const exportApi = apiModule.exportApi || {};

      const [jobsRes, templatesRes] = await Promise.all([
        exportApi.getJobs?.().catch(() => null),
        exportApi.getTemplates?.().catch(() => null),
      ]);

      // Transform API data or use defaults
      const jobsArray = Array.isArray(jobsRes) ? jobsRes : jobsRes?.jobs || jobsRes?.items || [];
      if (jobsArray.length > 0) {
        setExportJobs(jobsArray.map((j: any) => ({
          id: j.id?.toString(),
          name: j.name,
          type: j.type,
          status: j.status,
          format: j.format,
          file_size: j.file_size,
          download_url: j.download_url,
          created_at: j.created_at,
          completed_at: j.completed_at,
          expires_at: j.expires_at,
          progress: j.progress
        })));
      } else {
        // Demo export jobs
        setExportJobs([
          { id: '1', name: 'Monthly Users Report', type: 'users', status: 'completed', format: 'csv', file_size: 245000, download_url: '/exports/users_monthly.csv', created_at: new Date(Date.now() - 3600000).toISOString(), completed_at: new Date(Date.now() - 3500000).toISOString(), expires_at: new Date(Date.now() + 604800000).toISOString() },
          { id: '2', name: 'Q4 Transactions', type: 'transactions', status: 'processing', format: 'xlsx', created_at: new Date(Date.now() - 600000).toISOString(), progress: 65 },
        ]);
      }

      const templatesArray = Array.isArray(templatesRes) ? templatesRes : templatesRes?.templates || [];
      if (templatesArray.length > 0) {
        setTemplates(templatesArray);
      } else {
        setTemplates([
          { id: '1', name: 'Full User Backup', description: 'All user data fields', type: 'users', fields: fieldOptions.users, is_default: true },
          { id: '2', name: 'Financial Summary', description: 'Transaction totals and fees', type: 'transactions', fields: ['id', 'amount', 'fee', 'status', 'created_at'], is_default: false }
        ]);
      }

    } catch (error) {
      console.error('Failed to load export data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExport = async () => {
    if (!exportName) {
      showToast('Please enter an export name', 'error');
      return;
    }
    
    setIsExporting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newJob: ExportJob = {
        id: Date.now().toString(),
        name: exportName,
        type: dataType,
        status: 'processing',
        format: format,
        created_at: new Date().toISOString(),
        progress: 0
      };
      
      setExportJobs([newJob, ...exportJobs]);
      setActiveTab('history');
      setExportName('');
      
      // Simulate progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setExportJobs(prev => prev.map(j => j.id === newJob.id ? { ...j, progress } : j));
        
        if (progress >= 100) {
          clearInterval(interval);
          setExportJobs(prev => prev.map(j => j.id === newJob.id ? { 
            ...j, 
            status: 'completed', 
            completed_at: new Date().toISOString(),
            download_url: '#',
            file_size: 1024 * 1024 // 1MB dummy
          } : j));
        }
      }, 500);
      
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleField = (field: string) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter(f => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const selectAllFields = () => {
    setSelectedFields(fieldOptions[dataType]);
  };

  if (!mounted || !resolvedTheme) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <header className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Data Export</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Generate reports and export platform data
              </p>
            </div>
            <div className={commonStyles.headerActions}>
              <Button 
                variant={activeTab === 'create' ? 'primary' : 'outline'} 
                onClick={() => setActiveTab('create')}
              >
                New Export
              </Button>
              <Button 
                variant={activeTab === 'history' ? 'primary' : 'outline'} 
                onClick={() => setActiveTab('history')}
              >
                Export History
              </Button>
            </div>
          </header>
        </ScrollReveal>

        <div className={commonStyles.content}>
          {activeTab === 'create' && (
            <div className={commonStyles.createGrid}>
              <ScrollReveal delay={0.1}>
                <div className={cn(commonStyles.configCard, themeStyles.card)}>
                  <h3>Export Configuration</h3>
                  
                  <div className={commonStyles.formGroup}>
                    <label>Export Name</label>
                    <Input
                      value={exportName}
                      onChange={(e) => setExportName(e.target.value)}
                      placeholder="e.g., Monthly User Report"
                    />
                  </div>

                  <div className={commonStyles.formRow}>
                    <div className={commonStyles.formGroup}>
                      <label>Data Type</label>
                      <Select
                        value={dataType}
                        onChange={(e) => {
                          setDataType(e.target.value as DataType);
                          setSelectedFields([]);
                        }}
                        options={[
                          { value: 'users', label: 'Users' },
                          { value: 'projects', label: 'Projects' },
                          { value: 'transactions', label: 'Transactions' },
                          { value: 'analytics', label: 'Analytics' },
                        ]}
                      />
                    </div>
                    <div className={commonStyles.formGroup}>
                      <label>Format</label>
                      <Select
                        value={format}
                        onChange={(e) => setFormat(e.target.value as any)}
                        options={[
                          { value: 'csv', label: 'CSV' },
                          { value: 'json', label: 'JSON' },
                          { value: 'xlsx', label: 'Excel (XLSX)' },
                          { value: 'pdf', label: 'PDF' },
                        ]}
                      />
                    </div>
                  </div>

                  <div className={commonStyles.formRow}>
                    <div className={commonStyles.formGroup}>
                      <label>Date Range (Start)</label>
                      <Input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                      />
                    </div>
                    <div className={commonStyles.formGroup}>
                      <label>Date Range (End)</label>
                      <Input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className={commonStyles.checkboxGroup}>
                    <label className={commonStyles.checkboxLabel}>
                      <input 
                        type="checkbox" 
                        checked={includeArchived}
                        onChange={(e) => setIncludeArchived(e.target.checked)}
                      />
                      Include archived records
                    </label>
                  </div>

                  <div className={commonStyles.actionFooter}>
                    <Button 
                      variant="primary" 
                      fullWidth 
                      onClick={handleCreateExport}
                      disabled={isExporting || !exportName}
                    >
                      {isExporting ? 'Starting Export...' : 'Start Export'}
                    </Button>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={0.2}>
                <div className={cn(commonStyles.fieldsCard, themeStyles.card)}>
                  <div className={commonStyles.cardHeader}>
                    <h3>Select Fields</h3>
                    <Button variant="ghost" size="sm" onClick={selectAllFields}>Select All</Button>
                  </div>
                  <div className={commonStyles.fieldsGrid}>
                    {fieldOptions[dataType].map(field => (
                      <label key={field} className={commonStyles.fieldCheckbox}>
                        <input 
                          type="checkbox" 
                          checked={selectedFields.includes(field)}
                          onChange={() => toggleField(field)}
                        />
                        <span>{field.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                  {selectedFields.length === 0 && (
                    <p className={commonStyles.emptyFields}>Select fields to include in the export</p>
                  )}
                </div>
              </ScrollReveal>
            </div>
          )}

          {activeTab === 'history' && (
            <StaggerContainer className={commonStyles.historyList}>
              {exportJobs.length === 0 ? (
                <div className={commonStyles.emptyState}>No export history found</div>
              ) : (
                exportJobs.map((job) => (
                  <StaggerItem key={job.id} className={cn(commonStyles.jobCard, themeStyles.card)}>
                    <div className={commonStyles.jobIcon}>
                      {job.format.toUpperCase()}
                    </div>
                    <div className={commonStyles.jobInfo}>
                      <h4>{job.name}</h4>
                      <div className={commonStyles.jobMeta}>
                        <span>{job.type}</span>
                        <span>•</span>
                        <span>{new Date(job.created_at).toLocaleDateString()}</span>
                        {job.file_size && (
                          <>
                            <span>•</span>
                            <span>{formatFileSize(job.file_size)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className={commonStyles.jobStatus}>
                      {job.status === 'processing' ? (
                        <div className={commonStyles.progressBar}>
                          <div className={commonStyles.progressFill} style={{ width: `${job.progress}%` }} />
                          <span className={commonStyles.progressText}>{job.progress}%</span>
                        </div>
                      ) : (
                        <span className={cn(commonStyles.statusBadge, 
                          job.status === 'completed' ? 'text-green-600 bg-green-100' : 
                          job.status === 'failed' ? 'text-red-600 bg-red-100' : 
                          'text-yellow-600 bg-yellow-100'
                        )}>
                          {job.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className={commonStyles.jobActions}>
                      {job.status === 'completed' && (
                        <Button variant="outline" size="sm" onClick={() => window.open(job.download_url)}>
                          Download
                        </Button>
                      )}
                    </div>
                  </StaggerItem>
                ))
              )}
            </StaggerContainer>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={cn(commonStyles.toast, toast.type === 'error' && commonStyles.toastError, themeStyles.toast)}>
          {toast.message}
        </div>
      )}
    </PageTransition>
  );
}
