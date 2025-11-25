import { useEffect, useState } from 'react';

// @AI-HINT: Hook to fetch client portal datasets (projects, payments, freelancers, reviews).

export type ClientProject = { 
  id: string; 
  title: string; 
  status: 'Open' | 'In Progress' | 'Completed'; 
  budget: string; 
  updatedAt?: string;
  updated?: string;
  description?: string;
  skills?: string[];
  client?: string;
};

export type ClientPayment = { 
  id: string; 
  date: string; 
  description: string; 
  amount: string; 
  status: 'Completed' | 'Pending' | 'Failed';
  type: 'Payment' | 'Refund';
};

export type ClientFreelancer = { 
  id: string; 
  name: string; 
  title: string; 
  rating: number; 
  hourlyRate: string;
  skills: string[];
  completedProjects: number;
};

export type ClientReview = { 
  id: string; 
  projectTitle: string; 
  freelancerName: string; 
  rating: number; 
  comment: string;
  date: string;
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
        // Get auth token from localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
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
        
        const [projectsJson, paymentsJson, freelancersJson, reviewsJson] = await Promise.all([
          fetchWithFallback('/backend/api/client/projects', []),
          fetchWithFallback('/backend/api/client/payments', []),
          fetchWithFallback('/backend/api/freelancers', []),
          fetchWithFallback('/backend/api/reviews', []), // Reviews endpoint
        ]);
        
        if (!mounted) return;
        setProjects(projectsJson?.projects ?? projectsJson ?? []);
        setPayments(paymentsJson?.payments ?? paymentsJson ?? []);
        setFreelancers(freelancersJson?.freelancers ?? freelancersJson ?? []);
        setReviews(reviewsJson?.reviews ?? reviewsJson ?? []);
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