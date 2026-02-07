// @AI-HINT: Saved job searches page - manage saved search filters for quick job discovery
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import commonStyles from './SavedSearches.common.module.css';
import lightStyles from './SavedSearches.light.module.css';
import darkStyles from './SavedSearches.dark.module.css';

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: {
    category?: string;
    minBudget?: number;
    maxBudget?: number;
    skills?: string[];
    experienceLevel?: string;
    projectType?: string;
    location?: string;
  };
  alertEnabled: boolean;
  alertFrequency: 'instant' | 'daily' | 'weekly';
  matchCount: number;
  newMatches: number;
  lastRun: string;
  createdAt: string;
}

export default function SavedSearchesPage() {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  const [newSearch, setNewSearch] = useState({
    name: '',
    query: '',
    category: '',
    minBudget: '',
    maxBudget: '',
    skills: '',
    experienceLevel: '',
    projectType: '',
    alertEnabled: true,
    alertFrequency: 'daily' as 'instant' | 'daily' | 'weekly'
  });

  useEffect(() => {
    setMounted(true);
    fetchSavedSearches();
  }, []);

  const fetchSavedSearches = async () => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    setSearches([
      {
        id: '1',
        name: 'React Development Jobs',
        query: 'React developer',
        filters: {
          category: 'Web Development',
          minBudget: 50,
          maxBudget: 150,
          skills: ['React', 'TypeScript', 'Node.js'],
          experienceLevel: 'intermediate',
          projectType: 'fixed'
        },
        alertEnabled: true,
        alertFrequency: 'instant',
        matchCount: 47,
        newMatches: 5,
        lastRun: '2024-01-20T10:30:00Z',
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: 'UI/UX Design Projects',
        query: 'UI UX designer',
        filters: {
          category: 'Design',
          minBudget: 1000,
          skills: ['Figma', 'Adobe XD', 'User Research'],
          projectType: 'fixed'
        },
        alertEnabled: true,
        alertFrequency: 'daily',
        matchCount: 23,
        newMatches: 2,
        lastRun: '2024-01-20T08:00:00Z',
        createdAt: '2024-01-05T00:00:00Z'
      },
      {
        id: '3',
        name: 'Full-Stack Remote Work',
        query: 'full stack remote',
        filters: {
          category: 'Web Development',
          skills: ['Python', 'Django', 'PostgreSQL', 'React'],
          experienceLevel: 'expert',
          location: 'Remote'
        },
        alertEnabled: false,
        alertFrequency: 'weekly',
        matchCount: 15,
        newMatches: 0,
        lastRun: '2024-01-19T00:00:00Z',
        createdAt: '2024-01-10T00:00:00Z'
      },
      {
        id: '4',
        name: 'Mobile App Development',
        query: 'mobile app developer',
        filters: {
          category: 'Mobile Development',
          minBudget: 5000,
          skills: ['React Native', 'iOS', 'Android'],
          projectType: 'fixed'
        },
        alertEnabled: true,
        alertFrequency: 'daily',
        matchCount: 31,
        newMatches: 8,
        lastRun: '2024-01-20T08:00:00Z',
        createdAt: '2024-01-08T00:00:00Z'
      }
    ]);
    
    setLoading(false);
  };

  const handleCreateSearch = () => {
    const search: SavedSearch = {
      id: Date.now().toString(),
      name: newSearch.name,
      query: newSearch.query,
      filters: {
        category: newSearch.category || undefined,
        minBudget: newSearch.minBudget ? parseInt(newSearch.minBudget) : undefined,
        maxBudget: newSearch.maxBudget ? parseInt(newSearch.maxBudget) : undefined,
        skills: newSearch.skills ? newSearch.skills.split(',').map(s => s.trim()) : undefined,
        experienceLevel: newSearch.experienceLevel || undefined,
        projectType: newSearch.projectType || undefined
      },
      alertEnabled: newSearch.alertEnabled,
      alertFrequency: newSearch.alertFrequency,
      matchCount: 0,
      newMatches: 0,
      lastRun: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    setSearches([search, ...searches]);
    setShowCreateModal(false);
    setNewSearch({
      name: '',
      query: '',
      category: '',
      minBudget: '',
      maxBudget: '',
      skills: '',
      experienceLevel: '',
      projectType: '',
      alertEnabled: true,
      alertFrequency: 'daily'
    });
  };

  const toggleAlert = (id: string) => {
    setSearches(searches.map(s => 
      s.id === id ? { ...s, alertEnabled: !s.alertEnabled } : s
    ));
  };

  const deleteSearch = (id: string) => {
    if (confirm('Are you sure you want to delete this saved search?')) {
      setSearches(searches.filter(s => s.id !== id));
    }
  };

  const runSearch = (search: SavedSearch) => {
    // Navigate to jobs page with search params
    const params = new URLSearchParams();
    params.set('q', search.query);
    if (search.filters.category) params.set('category', search.filters.category);
    if (search.filters.minBudget) params.set('minBudget', search.filters.minBudget.toString());
    if (search.filters.maxBudget) params.set('maxBudget', search.filters.maxBudget.toString());
    router.push(`/freelancer/jobs?${params.toString()}`);
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'instant': return 'Instant';
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      default: return freq;
    }
  };

  if (!mounted) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={cn(commonStyles.loading, themeStyles.loading)}>Loading saved searches...</div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Saved Searches</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Manage your job search filters and alerts
              </p>
            </div>
            <button 
              className={cn(commonStyles.createButton, themeStyles.createButton)}
              onClick={() => setShowCreateModal(true)}
            >
              + New Saved Search
            </button>
          </div>
        </ScrollReveal>

        {/* Stats Summary */}
        <ScrollReveal delay={0.1}>
          <div className={commonStyles.statsGrid}>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={commonStyles.statIcon}>🔍</span>
              <div>
                <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{searches.length}</div>
                <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Saved Searches</div>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={commonStyles.statIcon}>🔔</span>
              <div>
                <div className={cn(commonStyles.statValue, themeStyles.statValue)}>
                  {searches.filter(s => s.alertEnabled).length}
                </div>
                <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Active Alerts</div>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={commonStyles.statIcon}>✨</span>
              <div>
                <div className={cn(commonStyles.statValue, themeStyles.statValue)}>
                  {searches.reduce((sum, s) => sum + s.newMatches, 0)}
                </div>
                <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>New Matches</div>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={commonStyles.statIcon}>📊</span>
              <div>
                <div className={cn(commonStyles.statValue, themeStyles.statValue)}>
                  {searches.reduce((sum, s) => sum + s.matchCount, 0)}
                </div>
                <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Matches</div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Saved Searches List */}
        {searches.length === 0 ? (
          <ScrollReveal delay={0.2}>
            <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
              <span className={commonStyles.emptyIcon}>🔍</span>
              <h2>No saved searches yet</h2>
              <p>Create your first saved search to get notified when new jobs match your criteria.</p>
              <button 
                className={cn(commonStyles.createButton, themeStyles.createButton)}
                onClick={() => setShowCreateModal(true)}
              >
                Create Saved Search
              </button>
            </div>
          </ScrollReveal>
        ) : (
          <StaggerContainer className={commonStyles.searchesList} delay={0.2}>
            {searches.map(search => (
              <StaggerItem key={search.id}>
                <div className={cn(commonStyles.searchCard, themeStyles.searchCard)}>
                  <div className={commonStyles.searchHeader}>
                    <div className={commonStyles.searchInfo}>
                      <h3 className={cn(commonStyles.searchName, themeStyles.searchName)}>
                        {search.name}
                        {search.newMatches > 0 && (
                          <span className={cn(commonStyles.newBadge, themeStyles.newBadge)}>
                            {search.newMatches} new
                          </span>
                        )}
                      </h3>
                      <p className={cn(commonStyles.searchQuery, themeStyles.searchQuery)}>
                        &quot;{search.query}&quot;
                      </p>
                    </div>
                    <div className={commonStyles.searchActions}>
                      <button 
                        className={cn(commonStyles.runButton, themeStyles.runButton)}
                        onClick={() => runSearch(search)}
                      >
                        Run Search
                      </button>
                      <button 
                        className={cn(commonStyles.editButton, themeStyles.editButton)}
                        onClick={() => setEditingSearch(search)}
                      >
                        ✏️
                      </button>
                      <button 
                        className={cn(commonStyles.deleteButton, themeStyles.deleteButton)}
                        onClick={() => deleteSearch(search.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className={commonStyles.filterTags}>
                    {search.filters.category && (
                      <span className={cn(commonStyles.filterTag, themeStyles.filterTag)}>
                        📁 {search.filters.category}
                      </span>
                    )}
                    {(search.filters.minBudget || search.filters.maxBudget) && (
                      <span className={cn(commonStyles.filterTag, themeStyles.filterTag)}>
                        💰 ${search.filters.minBudget || 0} - ${search.filters.maxBudget || '∞'}
                      </span>
                    )}
                    {search.filters.experienceLevel && (
                      <span className={cn(commonStyles.filterTag, themeStyles.filterTag)}>
                        📊 {search.filters.experienceLevel}
                      </span>
                    )}
                    {search.filters.projectType && (
                      <span className={cn(commonStyles.filterTag, themeStyles.filterTag)}>
                        📋 {search.filters.projectType}
                      </span>
                    )}
                    {search.filters.skills?.map(skill => (
                      <span key={skill} className={cn(commonStyles.skillTag, themeStyles.skillTag)}>
                        {skill}
                      </span>
                    ))}
                  </div>
                  
                  <div className={commonStyles.searchFooter}>
                    <div className={commonStyles.searchMeta}>
                      <span className={cn(commonStyles.metaItem, themeStyles.metaItem)}>
                        {search.matchCount} matches
                      </span>
                      <span className={cn(commonStyles.metaItem, themeStyles.metaItem)}>
                        Last run: {new Date(search.lastRun).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={commonStyles.alertToggle}>
                      <label className={cn(commonStyles.toggleLabel, themeStyles.toggleLabel)}>
                        <span>Alert: {getFrequencyLabel(search.alertFrequency)}</span>
                        <button 
                          className={cn(
                            commonStyles.toggle,
                            themeStyles.toggle,
                            search.alertEnabled && commonStyles.toggleActive,
                            search.alertEnabled && themeStyles.toggleActive
                          )}
                          onClick={() => toggleAlert(search.id)}
                        >
                          <span className={commonStyles.toggleKnob} />
                        </button>
                      </label>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        {/* Create/Edit Modal */}
        {(showCreateModal || editingSearch) && (
          <div className={cn(commonStyles.modalOverlay, themeStyles.modalOverlay)} onClick={() => { setShowCreateModal(false); setEditingSearch(null); }}>
            <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={e => e.stopPropagation()}>
              <h2 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>
                {editingSearch ? 'Edit Saved Search' : 'Create Saved Search'}
              </h2>
              
              <div className={commonStyles.formGroup}>
                <label className={cn(commonStyles.label, themeStyles.label)}>Search Name</label>
                <input
                  type="text"
                  className={cn(commonStyles.input, themeStyles.input)}
                  placeholder="e.g., React Development Jobs"
                  value={newSearch.name}
                  onChange={e => setNewSearch({ ...newSearch, name: e.target.value })}
                />
              </div>
              
              <div className={commonStyles.formGroup}>
                <label className={cn(commonStyles.label, themeStyles.label)}>Search Query</label>
                <input
                  type="text"
                  className={cn(commonStyles.input, themeStyles.input)}
                  placeholder="e.g., React developer"
                  value={newSearch.query}
                  onChange={e => setNewSearch({ ...newSearch, query: e.target.value })}
                />
              </div>
              
              <div className={commonStyles.formRow}>
                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.label, themeStyles.label)}>Category</label>
                  <select
                    className={cn(commonStyles.select, themeStyles.select)}
                    value={newSearch.category}
                    onChange={e => setNewSearch({ ...newSearch, category: e.target.value })}
                  >
                    <option value="">Any Category</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Mobile Development">Mobile Development</option>
                    <option value="Design">Design</option>
                    <option value="Writing">Writing</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.label, themeStyles.label)}>Experience Level</label>
                  <select
                    className={cn(commonStyles.select, themeStyles.select)}
                    value={newSearch.experienceLevel}
                    onChange={e => setNewSearch({ ...newSearch, experienceLevel: e.target.value })}
                  >
                    <option value="">Any Level</option>
                    <option value="entry">Entry Level</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>
              
              <div className={commonStyles.formRow}>
                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.label, themeStyles.label)}>Min Budget ($)</label>
                  <input
                    type="number"
                    className={cn(commonStyles.input, themeStyles.input)}
                    placeholder="0"
                    value={newSearch.minBudget}
                    onChange={e => setNewSearch({ ...newSearch, minBudget: e.target.value })}
                  />
                </div>
                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.label, themeStyles.label)}>Max Budget ($)</label>
                  <input
                    type="number"
                    className={cn(commonStyles.input, themeStyles.input)}
                    placeholder="No limit"
                    value={newSearch.maxBudget}
                    onChange={e => setNewSearch({ ...newSearch, maxBudget: e.target.value })}
                  />
                </div>
              </div>
              
              <div className={commonStyles.formGroup}>
                <label className={cn(commonStyles.label, themeStyles.label)}>Skills (comma-separated)</label>
                <input
                  type="text"
                  className={cn(commonStyles.input, themeStyles.input)}
                  placeholder="e.g., React, TypeScript, Node.js"
                  value={newSearch.skills}
                  onChange={e => setNewSearch({ ...newSearch, skills: e.target.value })}
                />
              </div>
              
              <div className={commonStyles.formRow}>
                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.label, themeStyles.label)}>Alert Frequency</label>
                  <select
                    className={cn(commonStyles.select, themeStyles.select)}
                    value={newSearch.alertFrequency}
                    onChange={e => setNewSearch({ ...newSearch, alertFrequency: e.target.value as 'instant' | 'daily' | 'weekly' })}
                  >
                    <option value="instant">Instant</option>
                    <option value="daily">Daily Digest</option>
                    <option value="weekly">Weekly Digest</option>
                  </select>
                </div>
                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.checkboxLabel, themeStyles.checkboxLabel)}>
                    <input
                      type="checkbox"
                      checked={newSearch.alertEnabled}
                      onChange={e => setNewSearch({ ...newSearch, alertEnabled: e.target.checked })}
                    />
                    <span>Enable email alerts</span>
                  </label>
                </div>
              </div>
              
              <div className={commonStyles.modalActions}>
                <button 
                  className={cn(commonStyles.cancelButton, themeStyles.cancelButton)}
                  onClick={() => { setShowCreateModal(false); setEditingSearch(null); }}
                >
                  Cancel
                </button>
                <button 
                  className={cn(commonStyles.saveButton, themeStyles.saveButton)}
                  onClick={handleCreateSearch}
                  disabled={!newSearch.name || !newSearch.query}
                >
                  {editingSearch ? 'Save Changes' : 'Create Search'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
