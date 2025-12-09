import { useEffect, useState } from 'react';
import api from '@/lib/api';

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
  description?: string;
  budget: number; 
  postedTime: string;
  skills: string[];
  status: 'Open' | 'Applied' | 'Hired';
  // Optional fields used in UI mappings
  progress?: number;
  paid?: number;
  freelancers?: { id: string; name: string; avatarUrl?: string }[];
  updatedAt?: string;
  matchScore?: number;
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

export type MonthlyEarning = {
  month: string;
  amount: number;
};

export type FreelancerProposal = {
  id: string;
  projectTitle: string;
  status: 'Submitted' | 'Viewed' | 'Accepted' | 'Rejected' | 'Withdrawn';
  sentDate: string;
  bidAmount: string;
};

export function useFreelancerData() {
  const [projects, setProjects] = useState<FreelancerProject[] | null>(null);
  const [jobs, setJobs] = useState<FreelancerJob[] | null>(null);
  const [recommendedJobs, setRecommendedJobs] = useState<FreelancerJob[] | null>(null);
  const [proposals, setProposals] = useState<FreelancerProposal[] | null>(null);
  const [transactions, setTransactions] = useState<FreelancerTransaction[] | null>(null);
  const [analytics, setAnalytics] = useState<FreelancerAnalytics | null>(null);
  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Use the API client methods
        const fetchWithFallback = async (promise: Promise<any>, fallback: any = []) => {
          try {
            return await promise;
          } catch {
            return fallback;
          }
        };
        
        const [projectsJson, jobsJson, walletJson, paymentsJson, statsJson, earningsJson, rankJson, recommendedJson, proposalsJson] = await Promise.all([
          fetchWithFallback(api.portal.freelancer.getProjects(), { projects: [] }),
          fetchWithFallback(api.portal.freelancer.getJobs(), { jobs: [] }),
          fetchWithFallback(api.portal.freelancer.getWallet(), { balance: 0 }),
          fetchWithFallback(api.portal.freelancer.getPayments(), { payments: [] }),
          fetchWithFallback(api.portal.freelancer.getDashboardStats(), {}),
          fetchWithFallback(api.portal.freelancer.getMonthlyEarnings(6), { earnings: [] }),
          fetchWithFallback(api.gamification.getMyRank(), { rank: 'Silver', percentile: 50 }),
          fetchWithFallback(api.matching.findJobs(5), { recommendations: [] }),
          fetchWithFallback(api.portal.freelancer.getProposals({ limit: 5 }), { proposals: [] }),
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
          description: j.description,
          budget: j.budget_max,
          postedTime: j.created_at,
          skills: j.skills || [],
          status: 'Open'
        }));
        setJobs(mappedJobs);

        // Map Recommended Jobs
        const mappedRecommendedJobs: FreelancerJob[] = (recommendedJson.recommendations || []).map((r: any) => ({
          id: String(r.project_id),
          title: r.project_title,
          clientName: 'AI Matched', 
          description: r.project_description,
          budget: r.budget_max || r.budget_min || 0,
          postedTime: r.created_at,
          skills: [], 
          status: 'Open',
          matchScore: Math.round((r.match_score || 0) * 100)
        }));
        setRecommendedJobs(mappedRecommendedJobs);

        // Map Proposals
        const mappedProposals: FreelancerProposal[] = (proposalsJson.proposals || []).map((p: any) => ({
          id: String(p.id),
          projectTitle: p.project_title || 'Untitled Project', // Backend might need to return project title
          status: p.status === 'submitted' ? 'Submitted' : 
                  p.status === 'viewed' ? 'Viewed' : 
                  p.status === 'accepted' ? 'Accepted' : 
                  p.status === 'rejected' ? 'Rejected' : 'Withdrawn',
          sentDate: p.created_at,
          bidAmount: `$${p.hourly_rate * p.estimated_hours}` // Approximate total
        }));
        setProposals(mappedProposals);

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
          rank: rankJson.rank || 'Silver',
          totalEarnings: `$${statsJson.total_earnings || 0}`,
          completedProjects: statsJson.completed_projects || 0,
          successRate: statsJson.success_rate || 0,
          averageRating: statsJson.average_rating || 0
        });
        
        // Map Monthly Earnings
        setMonthlyEarnings(earningsJson.earnings || []);

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

  return { projects, jobs, recommendedJobs, proposals, transactions, analytics, monthlyEarnings, loading, error } as const;
} 