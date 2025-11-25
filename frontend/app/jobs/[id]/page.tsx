// @AI-HINT: Job detail page with proposal submission form for freelancers - Uses real API data
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import commonStyles from './JobDetail.common.module.css';
import lightStyles from './JobDetail.light.module.css';
import darkStyles from './JobDetail.dark.module.css';

interface Project {
  id: number;
  title: string;
  description: string;
  category: string;
  budget_type: 'fixed' | 'hourly';
  budget_min: number | null;
  budget_max: number | null;
  experience_level: string;
  estimated_duration: string | null;
  skills: string | string[];
  client_id: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract';
  budget: string;
  description: string;
  featured?: boolean;
  requirements?: string[];
  responsibilities?: string[];
  postedAt?: string;
  category?: string;
  skills?: string[];
  experienceLevel?: string;
  estimatedDuration?: string;
}

// Convert API project to display Job format
const projectToJob = (project: Project): Job => {
  // Format budget based on budget_type and min/max
  let budget = 'Negotiable';
  if (project.budget_min !== null && project.budget_max !== null) {
    if (project.budget_type === 'hourly') {
      budget = `$${project.budget_min}–$${project.budget_max}/hr`;
    } else {
      budget = `$${project.budget_min.toLocaleString()}–$${project.budget_max.toLocaleString()}`;
    }
  } else if (project.budget_min !== null) {
    budget = project.budget_type === 'hourly' ? `$${project.budget_min}+/hr` : `$${project.budget_min.toLocaleString()}+`;
  } else if (project.budget_max !== null) {
    budget = project.budget_type === 'hourly' ? `Up to $${project.budget_max}/hr` : `Up to $${project.budget_max.toLocaleString()}`;
  }

  // Map experience level to job type
  const typeMap: Record<string, 'Full-time' | 'Part-time' | 'Contract'> = {
    'expert': 'Full-time',
    'intermediate': 'Part-time',
    'entry': 'Contract',
  };

  // Parse skills
  const skillsList = Array.isArray(project.skills) 
    ? project.skills 
    : typeof project.skills === 'string' 
      ? project.skills.split(',').filter(Boolean).map(s => s.trim())
      : [];

  // Generate requirements based on experience level
  const requirementsMap: Record<string, string[]> = {
    'expert': [
      '5+ years of relevant experience',
      'Strong portfolio demonstrating expertise',
      'Excellent communication skills',
      'Ability to work independently',
    ],
    'intermediate': [
      '2-5 years of relevant experience',
      'Portfolio showcasing previous work',
      'Good communication skills',
      'Team collaboration experience',
    ],
    'entry': [
      'Basic understanding of required skills',
      'Eagerness to learn and grow',
      'Good communication skills',
      'Portfolio or samples welcome',
    ],
  };

  // Generate responsibilities based on category
  const responsibilitiesMap: Record<string, string[]> = {
    'development': [
      'Write clean, maintainable code',
      'Participate in code reviews',
      'Collaborate with team members',
      'Document technical decisions',
    ],
    'design': [
      'Create user-centered designs',
      'Build and maintain design systems',
      'Collaborate with developers',
      'Conduct user research',
    ],
    'marketing': [
      'Develop marketing strategies',
      'Create compelling content',
      'Analyze campaign performance',
      'Manage marketing channels',
    ],
    'writing': [
      'Create high-quality content',
      'Research and fact-check',
      'Meet deadlines consistently',
      'Adapt to brand voice',
    ],
    'default': [
      'Deliver high-quality work',
      'Communicate progress regularly',
      'Meet project milestones',
      'Collaborate effectively',
    ],
  };

  return {
    id: String(project.id),
    title: project.title,
    company: 'MegiLance Client',
    location: 'Remote',
    type: typeMap[project.experience_level] || 'Contract',
    budget,
    description: project.description,
    featured: project.experience_level === 'expert',
    requirements: requirementsMap[project.experience_level] || requirementsMap['entry'],
    responsibilities: responsibilitiesMap[project.category?.toLowerCase()] || responsibilitiesMap['default'],
    postedAt: project.created_at,
    category: project.category,
    skills: skillsList,
    experienceLevel: project.experience_level,
    estimatedDuration: project.estimated_duration || undefined,
  };
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalData, setProposalData] = useState({
    coverLetter: '',
    bidAmount: '',
    deliveryTime: '',
    estimatedHours: '',
    hourlyRate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
  }, []);

  // Fetch project from API
  const fetchProject = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      
      // Try authenticated endpoint first if user is logged in
      if (token) {
        const response = await fetch(`/backend/api/projects/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const project: Project = await response.json();
          setJob(projectToJob(project));
          return;
        }
      }
      
      // Fallback to search endpoint (public)
      const searchResponse = await fetch(`/backend/api/search/projects?limit=100`);
      if (searchResponse.ok) {
        const projects: Project[] = await searchResponse.json();
        const foundProject = projects.find(p => String(p.id) === String(params.id));
        if (foundProject) {
          setJob(projectToJob(foundProject));
          return;
        }
      }
      
      setError('Project not found');
    } catch (err) {
      console.error('Error fetching project:', err);
      setError('Unable to load project details. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login?redirect=' + encodeURIComponent(`/jobs/${job?.id}`));
        return;
      }

      // Validate form
      if (proposalData.coverLetter.length < 50) {
        setSubmitError('Cover letter must be at least 50 characters');
        setSubmitting(false);
        return;
      }

      // Calculate bid amount from hourly rate and hours if not set
      const estimatedHours = parseInt(proposalData.estimatedHours) || 40;
      const hourlyRate = parseFloat(proposalData.hourlyRate) || parseFloat(proposalData.bidAmount) / estimatedHours;
      const bidAmount = parseFloat(proposalData.bidAmount) || (estimatedHours * hourlyRate);

      // Submit proposal to backend
      const response = await fetch('/backend/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          project_id: parseInt(job?.id || '1'),
          cover_letter: proposalData.coverLetter,
          bid_amount: bidAmount,
          estimated_hours: estimatedHours,
          hourly_rate: hourlyRate,
          availability: proposalData.deliveryTime || 'flexible',
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setShowProposalForm(false);
      } else {
        const data = await response.json();
        setSubmitError(data.detail || 'Failed to submit proposal');
      }
    } catch (err) {
      setSubmitError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Prevent flash during theme resolution
  if (!resolvedTheme) return null;

  // Loading state
  if (loading) {
    return (
      <main className={cn(commonStyles.page, themeStyles.page)}>
        <div className={commonStyles.container}>
          <div className={cn(commonStyles.loadingContainer, themeStyles.loadingContainer)}>
            <div className={commonStyles.spinner} />
            <p>Loading project details...</p>
          </div>
        </div>
      </main>
    );
  }

  // Error state or not found
  if (error || !job) {
    return (
      <main className={cn(commonStyles.page, themeStyles.page)}>
        <div className={commonStyles.container}>
          <div className={cn(commonStyles.notFound, themeStyles.notFound)}>
            <span className={commonStyles.notFoundIcon}>🔍</span>
            <h1>Project Not Found</h1>
            <p>{error || "The project you're looking for doesn't exist or has been removed."}</p>
            <Button onClick={() => router.push('/jobs')}>Browse Projects</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={cn(commonStyles.page, themeStyles.page)}>
      <div className={commonStyles.container}>
        <button className={cn(commonStyles.backButton, themeStyles.backButton)} onClick={() => router.back()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={commonStyles.backIcon}>
            <path d="M19 12H5m7-7-7 7 7 7"/>
          </svg>
          Back to Projects
        </button>

        <div className={cn(commonStyles.header, themeStyles.header)}>
          <div className={commonStyles.headerTop}>
            {job.featured && (
              <span className={cn(commonStyles.featuredBadge, themeStyles.featuredBadge)}>
                ⭐ Featured Project
              </span>
            )}
            {job.category && (
              <span className={cn(commonStyles.categoryBadge, themeStyles.categoryBadge)}>
                {job.category}
              </span>
            )}
          </div>
          
          <h1 className={cn(commonStyles.title, themeStyles.title)}>{job.title}</h1>
          
          <div className={cn(commonStyles.meta, themeStyles.meta)}>
            <span className={commonStyles.metaItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={commonStyles.metaIcon}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              {job.company}
            </span>
            <span className={commonStyles.metaItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={commonStyles.metaIcon}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {job.location}
            </span>
            <span className={commonStyles.metaItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={commonStyles.metaIcon}>
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              {job.type}
            </span>
          </div>

          <div className={cn(commonStyles.budgetCard, themeStyles.budgetCard)}>
            <div className={commonStyles.budgetContent}>
              <span className={commonStyles.budgetLabel}>Project Budget</span>
              <span className={cn(commonStyles.budgetValue, themeStyles.budgetValue)}>{job.budget}</span>
            </div>
            {job.experienceLevel && (
              <div className={cn(commonStyles.experienceTag, themeStyles.experienceTag)}>
                {job.experienceLevel.charAt(0).toUpperCase() + job.experienceLevel.slice(1)} Level
              </div>
            )}
          </div>

          {job.postedAt && (
            <p className={cn(commonStyles.posted, themeStyles.posted)}>
              Posted on {new Date(job.postedAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          )}
        </div>

        <div className={cn(commonStyles.content, themeStyles.content)}>
          <section className={commonStyles.section}>
            <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={commonStyles.sectionIcon}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              Project Description
            </h2>
            <p className={cn(commonStyles.descriptionText, themeStyles.descriptionText)}>{job.description}</p>
          </section>

          {job.skills && job.skills.length > 0 && (
            <section className={commonStyles.section}>
              <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={commonStyles.sectionIcon}>
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                </svg>
                Required Skills
              </h2>
              <div className={commonStyles.skillsGrid}>
                {job.skills.map((skill, i) => (
                  <span key={i} className={cn(commonStyles.skillTag, themeStyles.skillTag)}>{skill}</span>
                ))}
              </div>
            </section>
          )}

          {job.requirements && job.requirements.length > 0 && (
            <section className={commonStyles.section}>
              <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={commonStyles.sectionIcon}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
                Requirements
              </h2>
              <ul className={cn(commonStyles.list, themeStyles.list)}>
                {job.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </section>
          )}

          {job.responsibilities && job.responsibilities.length > 0 && (
            <section className={commonStyles.section}>
              <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={commonStyles.sectionIcon}>
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                </svg>
                Responsibilities
              </h2>
              <ul className={cn(commonStyles.list, themeStyles.list)}>
                {job.responsibilities.map((resp, i) => (
                  <li key={i}>{resp}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className={commonStyles.actions}>
          {submitted ? (
            <div className={cn(commonStyles.successMessage, themeStyles.successMessage)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={commonStyles.successIcon}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22,4 12,14.01 9,11.01"/>
              </svg>
              Your proposal has been submitted successfully! We'll notify you when the client responds.
            </div>
          ) : showProposalForm ? (
            <form className={cn(commonStyles.proposalForm, themeStyles.proposalForm)} onSubmit={handleSubmitProposal}>
              <h2 className={cn(commonStyles.formTitle, themeStyles.formTitle)}>Submit Your Proposal</h2>
              
              {submitError && <div className={cn(commonStyles.error, themeStyles.error)}>{submitError}</div>}

              <div className={commonStyles.formGroup}>
                <label htmlFor="coverLetter" className={cn(commonStyles.formLabel, themeStyles.formLabel)}>
                  Cover Letter (min. 50 characters)
                </label>
                <textarea
                  id="coverLetter"
                  className={cn(commonStyles.textarea, themeStyles.textarea)}
                  rows={6}
                  placeholder="Introduce yourself and explain why you're a great fit for this project..."
                  value={proposalData.coverLetter}
                  onChange={(e) => setProposalData(p => ({ ...p, coverLetter: e.target.value }))}
                  required
                  minLength={50}
                />
                <small className={cn(commonStyles.charCount, themeStyles.charCount)}>
                  {proposalData.coverLetter.length}/50 characters minimum
                </small>
              </div>

              <div className={commonStyles.formRow}>
                <div className={commonStyles.formGroup}>
                  <label htmlFor="estimatedHours" className={cn(commonStyles.formLabel, themeStyles.formLabel)}>
                    Estimated Hours
                  </label>
                  <input
                    id="estimatedHours"
                    type="number"
                    className={cn(commonStyles.input, themeStyles.input)}
                    placeholder="e.g., 40"
                    min="1"
                    value={proposalData.estimatedHours}
                    onChange={(e) => setProposalData(p => ({ ...p, estimatedHours: e.target.value }))}
                    required
                  />
                </div>

                <div className={commonStyles.formGroup}>
                  <label htmlFor="hourlyRate" className={cn(commonStyles.formLabel, themeStyles.formLabel)}>
                    Hourly Rate ($)
                  </label>
                  <input
                    id="hourlyRate"
                    type="number"
                    className={cn(commonStyles.input, themeStyles.input)}
                    placeholder="e.g., 75"
                    min="1"
                    step="0.01"
                    value={proposalData.hourlyRate}
                    onChange={(e) => setProposalData(p => ({ ...p, hourlyRate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className={commonStyles.formRow}>
                <div className={commonStyles.formGroup}>
                  <label htmlFor="bidAmount" className={cn(commonStyles.formLabel, themeStyles.formLabel)}>
                    Total Bid ($)
                  </label>
                  <input
                    id="bidAmount"
                    type="number"
                    className={cn(commonStyles.input, themeStyles.input)}
                    placeholder="Auto-calculated or custom"
                    value={proposalData.bidAmount || (parseFloat(proposalData.estimatedHours || '0') * parseFloat(proposalData.hourlyRate || '0')).toString()}
                    onChange={(e) => setProposalData(p => ({ ...p, bidAmount: e.target.value }))}
                  />
                  <small className={cn(commonStyles.charCount, themeStyles.charCount)}>
                    Leave blank to auto-calculate from hours × rate
                  </small>
                </div>

                <div className={commonStyles.formGroup}>
                  <label htmlFor="deliveryTime" className={cn(commonStyles.formLabel, themeStyles.formLabel)}>
                    Availability
                  </label>
                  <select
                    id="deliveryTime"
                    className={cn(commonStyles.select, themeStyles.select)}
                    value={proposalData.deliveryTime}
                    onChange={(e) => setProposalData(p => ({ ...p, deliveryTime: e.target.value }))}
                    required
                  >
                    <option value="">Select your availability...</option>
                    <option value="immediate">Immediate</option>
                    <option value="1-2_weeks">1-2 Weeks</option>
                    <option value="1_month">1 Month</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>
              </div>

              {!isAuthenticated && (
                <div className={cn(commonStyles.loginPrompt, themeStyles.loginPrompt)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={commonStyles.promptIcon}>
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p>You need to be logged in as a freelancer to submit proposals.</p>
                  <Button variant="primary" onClick={() => router.push('/login?redirect=' + encodeURIComponent(`/jobs/${job?.id}`))}>
                    Sign In to Continue
                  </Button>
                </div>
              )}

              <div className={commonStyles.formActions}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowProposalForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={submitting}
                  disabled={!isAuthenticated}
                >
                  Submit Proposal
                </Button>
              </div>
            </form>
          ) : (
            <div className={cn(commonStyles.applySection, themeStyles.applySection)}>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setShowProposalForm(true)}
              >
                Apply Now
              </Button>
              <Button variant="secondary" size="lg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={commonStyles.saveIcon}>
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                Save Project
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
