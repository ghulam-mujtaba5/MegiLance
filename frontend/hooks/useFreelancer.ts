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
  successRate?: number;
  averageRating?: number;
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
        
        const [projectsJson, jobsJson, walletJson, paymentsJson, statsJson] = await Promise.all([
          fetchWithFallback('/backend/api/portal/freelancer/projects', { projects: [] }),
          fetchWithFallback('/backend/api/portal/freelancer/jobs', { jobs: [] }),
          fetchWithFallback('/backend/api/portal/freelancer/wallet', { balance: 0 }),
          fetchWithFallback('/backend/api/portal/freelancer/payments', { payments: [] }),
          fetchWithFallback('/backend/api/portal/freelancer/dashboard/stats', {}),
        ]);
        
        if (!mounted) return;

        // Map Projects
        const mappedProjects: FreelancerProject[] = (projectsJson.projects || []).map((p: any) => ({
          id: String(p.id),
          title: p.title || 'Untitled Project',
          clientName: p.client_name || 'Unknown Client',
          budget: `$${p.total_amount}`,
          postedTime: p.start_date || new Date().toISOString(),
          tags: [], // Not available in backend yet
          status: p.status === 'active' || p.status === 'in_progress' ? 'Active' : 
                  p.status === 'completed' ? 'Completed' : 'Pending'
        }));
        setProjects(mappedProjects);

        // Map Jobs
        const mappedJobs: FreelancerJob[] = (jobsJson.jobs || []).map((j: any) => ({
          id: String(j.id),
          title: j.title,
          clientName: j.client_name || 'Unknown Client',
          budget: j.budget_max,
          postedTime: j.created_at,
          skills: j.skills || [],
          status: 'Open'
        }));
        setJobs(mappedJobs);

        // Map Transactions
        const mappedTransactions: FreelancerTransaction[] = (paymentsJson.payments || []).map((t: any) => ({
          id: String(t.id),
          amount: `$${t.amount}`,
          date: t.created_at,
          description: t.description || t.payment_type || 'Transaction',
          type: t.payment_type === 'withdrawal' ? 'Withdrawal' : 'Payment',
          status: t.status === 'completed' ? 'Completed' : 
                  t.status === 'pending' ? 'Pending' : 'Failed'
        }));
        setTransactions(mappedTransactions);

        // Map Analytics
        setAnalytics({
          activeProjects: statsJson.active_projects || 0,
          pendingProposals: statsJson.pending_proposals || 0,
          walletBalance: `$${walletJson.balance || 0}`,
          rank: 'Silver', // Hardcoded for now, logic needed
          totalEarnings: `$${statsJson.total_earnings || 0}`,
          completedProjects: statsJson.completed_projects || 0,
          successRate: statsJson.success_rate || 0,
          averageRating: statsJson.average_rating || 0
        });

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