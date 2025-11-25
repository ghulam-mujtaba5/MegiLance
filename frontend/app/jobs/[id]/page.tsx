// @AI-HINT: Job detail page with proposal submission form for freelancers
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import styles from './JobDetail.module.css';

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
}

const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior React/Next.js Engineer',
    company: 'MegiLance Labs',
    location: 'Remote',
    type: 'Full-time',
    budget: '$120k–$160k',
    description: 'Build premium-grade interfaces with Next.js, TypeScript, and modular CSS. Own performance and a11y.',
    featured: true,
    requirements: ['5+ years React experience', 'TypeScript proficiency', 'CSS modules expertise', 'Testing experience'],
    responsibilities: ['Build UI components', 'Code reviews', 'Performance optimization', 'Mentoring juniors'],
    postedAt: '2025-11-20',
  },
  {
    id: '2',
    title: 'Solidity Engineer (USDC Escrow)',
    company: 'StableCircle',
    location: 'EU Remote',
    type: 'Contract',
    budget: '$90–$130/hr',
    description: 'Design audited smart contracts for escrow and milestone payouts. Strong testing culture required.',
    requirements: ['3+ years Solidity', 'Audit experience', 'DeFi knowledge', 'Testing frameworks'],
    responsibilities: ['Smart contract development', 'Security audits', 'Documentation', 'Gas optimization'],
    postedAt: '2025-11-18',
  },
  {
    id: '3',
    title: 'AI/ML Engineer (Ranking)',
    company: 'SignalRank',
    location: 'Hybrid — London',
    type: 'Full-time',
    budget: '$150k–$190k',
    description: 'Ship ranking models for marketplace quality. Own data pipeline, evaluation, and production inference.',
    requirements: ['ML/AI expertise', 'Python proficiency', 'Production ML experience', 'Data engineering skills'],
    responsibilities: ['Model development', 'Pipeline maintenance', 'A/B testing', 'Performance monitoring'],
    postedAt: '2025-11-15',
  },
  {
    id: '4',
    title: 'Product Designer',
    company: 'BlueOrbit',
    location: 'Remote',
    type: 'Part-time',
    budget: '$60–$90/hr',
    description: 'Design investor-grade experiences across marketing and portal UIs. Figma mastery required.',
    requirements: ['5+ years design', 'Figma expertise', 'Design systems', 'User research'],
    responsibilities: ['UI/UX design', 'Prototyping', 'User testing', 'Design documentation'],
    postedAt: '2025-11-22',
  },
  {
    id: '5',
    title: 'DevOps Engineer',
    company: 'Opsly',
    location: 'Remote',
    type: 'Full-time',
    budget: '$130k–$170k',
    description: 'Own CI/CD, observability, and infra as code. Experience with Vercel, Docker, and DX excellence.',
    requirements: ['CI/CD expertise', 'Docker/K8s', 'IaC tools', 'Monitoring systems'],
    responsibilities: ['Infrastructure management', 'Deployment automation', 'Security', 'Documentation'],
    postedAt: '2025-11-19',
  },
  {
    id: '6',
    title: 'Technical Writer',
    company: 'DocForge',
    location: 'Remote',
    type: 'Contract',
    budget: '$70–$100/hr',
    description: 'Create clear guides, API docs, and UX copy. Align with brand tone and a11y standards.',
    requirements: ['Technical writing', 'API documentation', 'Markdown/MDX', 'Developer experience'],
    responsibilities: ['Documentation', 'API guides', 'Tutorials', 'Style guides'],
    postedAt: '2025-11-21',
  },
];

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [job, setJob] = useState<Job | null>(null);
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
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    const foundJob = mockJobs.find(j => j.id === params.id);
    setJob(foundJob || null);
  }, [params.id]);

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login?redirect=' + encodeURIComponent(`/jobs/${job?.id}`));
        return;
      }

      // Validate form
      if (proposalData.coverLetter.length < 50) {
        setError('Cover letter must be at least 50 characters');
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
        setError(data.detail || 'Failed to submit proposal');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!job) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.notFound}>
            <h1>Job Not Found</h1>
            <p>The job you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <Button onClick={() => router.push('/jobs')}>Back to Jobs</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={cn(styles.page, resolvedTheme === 'dark' ? styles.dark : styles.light)}>
      <div className={styles.container}>
        <button className={styles.backButton} onClick={() => router.back()}>
          ← Back to Jobs
        </button>

        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>{job.title}</h1>
            {job.featured && <span className={styles.badge}>Featured</span>}
          </div>
          <div className={styles.meta}>
            <span className={styles.company}>{job.company}</span>
            <span className={styles.separator}>•</span>
            <span>{job.location}</span>
            <span className={styles.separator}>•</span>
            <span>{job.type}</span>
            <span className={styles.separator}>•</span>
            <span className={styles.budget}>{job.budget}</span>
          </div>
          {job.postedAt && (
            <p className={styles.posted}>Posted on {new Date(job.postedAt).toLocaleDateString()}</p>
          )}
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2>Description</h2>
            <p>{job.description}</p>
          </section>

          {job.requirements && job.requirements.length > 0 && (
            <section className={styles.section}>
              <h2>Requirements</h2>
              <ul className={styles.list}>
                {job.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </section>
          )}

          {job.responsibilities && job.responsibilities.length > 0 && (
            <section className={styles.section}>
              <h2>Responsibilities</h2>
              <ul className={styles.list}>
                {job.responsibilities.map((resp, i) => (
                  <li key={i}>{resp}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className={styles.actions}>
          {submitted ? (
            <div className={styles.successMessage}>
              ✓ Your proposal has been submitted successfully!
            </div>
          ) : showProposalForm ? (
            <form className={styles.proposalForm} onSubmit={handleSubmitProposal}>
              <h2>Submit Your Proposal</h2>
              
              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.formGroup}>
                <label htmlFor="coverLetter">Cover Letter (min. 50 characters)</label>
                <textarea
                  id="coverLetter"
                  rows={6}
                  placeholder="Introduce yourself and explain why you're a great fit for this role..."
                  value={proposalData.coverLetter}
                  onChange={(e) => setProposalData(p => ({ ...p, coverLetter: e.target.value }))}
                  required
                  minLength={50}
                />
                <small>{proposalData.coverLetter.length}/50 characters minimum</small>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="estimatedHours">Estimated Hours</label>
                  <input
                    id="estimatedHours"
                    type="number"
                    placeholder="e.g., 40"
                    min="1"
                    value={proposalData.estimatedHours}
                    onChange={(e) => setProposalData(p => ({ ...p, estimatedHours: e.target.value }))}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="hourlyRate">Hourly Rate ($)</label>
                  <input
                    id="hourlyRate"
                    type="number"
                    placeholder="e.g., 75"
                    min="1"
                    step="0.01"
                    value={proposalData.hourlyRate}
                    onChange={(e) => setProposalData(p => ({ ...p, hourlyRate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="bidAmount">Total Bid ($)</label>
                  <input
                    id="bidAmount"
                    type="number"
                    placeholder="Auto-calculated or custom"
                    value={proposalData.bidAmount || (parseFloat(proposalData.estimatedHours || '0') * parseFloat(proposalData.hourlyRate || '0')).toString()}
                    onChange={(e) => setProposalData(p => ({ ...p, bidAmount: e.target.value }))}
                  />
                  <small>Leave blank to auto-calculate from hours × rate</small>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="deliveryTime">Availability</label>
                  <select
                    id="deliveryTime"
                    value={proposalData.deliveryTime}
                    onChange={(e) => setProposalData(p => ({ ...p, deliveryTime: e.target.value }))}
                    required
                  >
                    <option value="">Select...</option>
                    <option value="immediate">Immediate</option>
                    <option value="1-2_weeks">1-2 Weeks</option>
                    <option value="1_month">1 Month</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>
              </div>

              {!isAuthenticated && (
                <div className={styles.loginPrompt}>
                  <p>You need to be logged in as a freelancer to submit proposals.</p>
                  <Button variant="primary" onClick={() => router.push('/login?redirect=' + encodeURIComponent(`/jobs/${job?.id}`))}>
                    Sign In
                  </Button>
                </div>
              )}

              <div className={styles.formActions}>
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
            <div className={styles.applySection}>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setShowProposalForm(true)}
              >
                Apply Now
              </Button>
              <Button variant="secondary" size="lg">
                Save Job
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
