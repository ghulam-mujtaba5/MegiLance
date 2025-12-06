import { useEffect, useState, useRef, useCallback } from 'react';
import api from '@/lib/api';

// @AI-HINT: Hook to fetch client portal datasets (projects, payments, freelancers, reviews).
// Uses proper cleanup to prevent memory leaks and request abortion issues.

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
  status: 'Completed' | 'Paid' | 'Pending' | 'Failed';
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
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    // Prevent duplicate concurrent fetches
    if (loadingRef.current) return;
    loadingRef.current = true;
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchWithFallback = async (promise: Promise<any>, fallback: any = []) => {
        try {
          const result = await promise;
          return result;
        } catch (err) {
          // Don't log abort errors
          if (err instanceof Error && err.name === 'AbortError') {
            throw err; // Re-throw to stop processing
          }
          console.warn('Fetch failed, using fallback:', err);
          return fallback;
        }
      };
      
      const [projectsData, paymentsData, freelancersData, reviewsData] = await Promise.all([
        fetchWithFallback(api.client.getProjects(), []),
        fetchWithFallback(api.client.getPayments(), []),
        fetchWithFallback(api.client.getFreelancers(), []),
        fetchWithFallback(api.client.getReviews(), []),
      ]);
        
      // Check if component is still mounted before updating state
      if (!mountedRef.current) return;
        
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
        amount: p.amount?.startsWith?.('$') ? p.amount : `$${parseFloat(p.amount || '0').toLocaleString()}`,
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
      // Don't update state if unmounted or if it's an abort error
      if (!mountedRef.current) return;
      if (e?.name === 'AbortError') return;
      setError(e?.message ?? 'Failed to load client data');
    } finally {
      loadingRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();
    
    return () => { 
      mountedRef.current = false; 
    };
  }, [load]);

  return { projects, payments, freelancers, reviews, loading, error } as const;
}