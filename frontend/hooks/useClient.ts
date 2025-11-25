import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

// @AI-HINT: Hook to fetch client portal datasets (projects, payments, freelancers, reviews).

export type ClientProject = { 
  id: string; 
  title: string; 
  status: 'Open' | 'In Progress' | 'Completed' | 'Pending' | 'Cancelled'; 
  budget: string; 
  updatedAt?: string;
  updated?: string;
  description?: string;
  skills?: string[];
  client?: string;
  progress?: number;
  paid?: number;
  freelancers?: any[];
};

export type ClientPayment = { 
  id: string; 
  date: string; 
  description: string; 
  amount: string; 
  status: 'Completed' | 'Pending' | 'Failed';
  type: 'Payment' | 'Refund';
  project?: string;
  freelancer?: string;
  freelancerAvatarUrl?: string;
};

export type ClientFreelancer = { 
  id: string; 
  name: string; 
  title: string; 
  rating: number; 
  hourlyRate: string;
  skills: string[];
  completedProjects: number;
  avatarUrl?: string;
  location?: string;
  availability?: string;
};

export type ClientReview = { 
  id: string; 
  projectTitle: string; 
  freelancerName: string; 
  rating: number; 
  comment: string;
  date: string;
  avatarUrl?: string;
};

export function useClientData() {
  const [projects, setProjects] = useState<ClientProject[] | null>(null);
  const [payments, setPayments] = useState<ClientPayment[] | null>(null);
  const [freelancers, setFreelancers] = useState<ClientFreelancer[] | null>(null);
  const [reviews, setReviews] = useState<ClientReview[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const fetchWithFallback = async (promise: Promise<any>, fallback: any = []) => {
          try {
            return await promise;
          } catch {
            return fallback;
          }
        };
        
        const [projectsData, paymentsData, freelancersData, reviewsData] = await Promise.all([
          fetchWithFallback(api.client.getProjects(), []),
          fetchWithFallback(api.client.getPayments(), []),
          fetchWithFallback(api.client.getFreelancers(), []),
          fetchWithFallback(api.client.getReviews(), []),
        ]);
        
        if (!mounted) return;
        
        // Map projects
        const mappedProjects: ClientProject[] = (projectsData || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          status: p.status,
          budget: typeof p.budget === 'number' ? `$${p.budget.toLocaleString()}` : p.budget,
          updatedAt: p.updatedAt,
          progress: p.progress,
          paid: p.paid,
          freelancers: p.freelancers
        }));
        setProjects(mappedProjects);

        // Map payments
        const mappedPayments: ClientPayment[] = (paymentsData || []).map((p: any) => ({
          id: p.id,
          date: p.date,
          description: p.description,
          amount: p.amount.startsWith('$') ? p.amount : `$${parseFloat(p.amount).toLocaleString()}`,
          status: p.status,
          type: p.type,
          project: p.project,
          freelancer: p.freelancer,
          freelancerAvatarUrl: p.freelancerAvatarUrl
        }));
        setPayments(mappedPayments);

        // Map freelancers
        const mappedFreelancers: ClientFreelancer[] = (freelancersData || []).map((f: any) => ({
          id: f.id,
          name: f.name,
          title: f.title,
          rating: f.rating,
          hourlyRate: f.hourlyRate,
          skills: f.skills,
          completedProjects: f.completedProjects,
          avatarUrl: f.avatarUrl,
          location: f.location,
          availability: f.availability
        }));
        setFreelancers(mappedFreelancers);

        // Map reviews
        const mappedReviews: ClientReview[] = (reviewsData || []).map((r: any) => ({
          id: r.id,
          projectTitle: r.projectTitle,
          freelancerName: r.freelancerName,
          rating: r.rating,
          comment: r.comment,
          date: r.date,
          avatarUrl: r.avatarUrl
        }));
        setReviews(mappedReviews);

      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? 'Failed to load client data');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  return { projects, payments, freelancers, reviews, loading, error } as const;
}