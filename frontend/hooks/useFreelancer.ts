import { useEffect, useState } from 'react';

// @AI-HINT: Hook to fetch freelancer portal datasets (projects, jobs, wallet, analytics).

export type FreelancerProject = { 
  id: string; 
  title: string; 
  clientName: string; 
  budget: string; 
  postedTime: string;
  tags: string[];
  status: 'Active' | 'Completed' | 'Pending';
};

export type FreelancerJob = { 
  id: string; 
  title: string; 
  clientName: string; 
  budget: string; 
  postedTime: string;
  skills: string[];
  status: 'Open' | 'Applied' | 'Hired';
};

export type FreelancerTransaction = { 
  id: string; 
  amount: string; 
  date: string; 
  description: string;
  type: 'Payment' | 'Withdrawal' | 'Refund';
  status: 'Completed' | 'Pending' | 'Failed';
};

export type FreelancerAnalytics = { 
  activeProjects: number;
  pendingProposals: number;
  walletBalance: string;
  rank: string;
  totalEarnings: string;
  completedProjects: number;
  profileViews?: number;
  applicationsSent?: number;
};

export function useFreelancerData() {
  const [projects, setProjects] = useState<FreelancerProject[] | null>(null);
  const [jobs, setJobs] = useState<FreelancerJob[] | null>(null);
  const [transactions, setTransactions] = useState<FreelancerTransaction[] | null>(null);
  const [analytics, setAnalytics] = useState<FreelancerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [projectsRes, jobsRes, transactionsRes, analyticsRes] = await Promise.all([
          fetch('/api/freelancer/projects'),
          fetch('/api/freelancer/jobs'),
          fetch('/api/freelancer/transactions'),
          fetch('/api/freelancer/analytics'),
        ]);
        
        if ([projectsRes, jobsRes, transactionsRes, analyticsRes].some(r => !r.ok)) {
          throw new Error('One or more freelancer API requests failed');
        }
        
        const [projectsJson, jobsJson, transactionsJson, analyticsJson] = await Promise.all([
          projectsRes.json(),
          jobsRes.json(),
          transactionsRes.json(),
          analyticsRes.json(),
        ]);
        
        if (!mounted) return;
        setProjects(projectsJson?.projects ?? projectsJson);
        setJobs(jobsJson?.jobs ?? jobsJson);
        setTransactions(transactionsJson?.transactions ?? transactionsJson);
        setAnalytics(analyticsJson?.analytics ?? analyticsJson);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? 'Failed to load freelancer data');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  return { projects, jobs, transactions, analytics, loading, error } as const;
} 