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
  budget: number; 
  postedTime: string;
  skills: string[];
  status: 'Open' | 'Applied' | 'Hired';
  // Optional fields used in UI mappings
  progress?: number;
  paid?: number;
  freelancers?: { id: string; name: string; avatarUrl?: string }[];
  updatedAt?: string;
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
  rank: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'N/A';
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
        // Get auth token from localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        // Use the backend proxy endpoints - fetch each individually and handle failures gracefully
        const fetchWithFallback = async (url: string, fallback: any = []) => {
          try {
            const res = await fetch(url, { headers });
            if (!res.ok) return fallback;
            return await res.json();
          } catch {
            return fallback;
          }
        };
        
        const [projectsJson, jobsJson, transactionsJson, analyticsJson] = await Promise.all([
          fetchWithFallback('/backend/api/portal/freelancer/projects', []),
          fetchWithFallback('/backend/api/portal/freelancer/jobs', []),
          fetchWithFallback('/backend/api/portal/freelancer/wallet', {}), // wallet has transactions
          fetchWithFallback('/backend/api/portal/freelancer/dashboard/stats', {}), // dashboard stats for analytics
        ]);
        
        if (!mounted) return;
        setProjects(projectsJson?.projects ?? projectsJson ?? []);
        setJobs(jobsJson?.jobs ?? jobsJson ?? []);
        setTransactions(transactionsJson?.transactions ?? transactionsJson?.recentTransactions ?? []);
        setAnalytics(analyticsJson?.analytics ?? analyticsJson ?? null);
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