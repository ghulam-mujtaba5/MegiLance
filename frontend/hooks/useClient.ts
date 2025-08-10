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
        const [projectsRes, paymentsRes, freelancersRes, reviewsRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/payments'),
          fetch('/api/freelancers'),
          fetch('/api/reviews'),
        ]);
        
        if ([projectsRes, paymentsRes, freelancersRes, reviewsRes].some(r => !r.ok)) {
          throw new Error('One or more client API requests failed');
        }
        
        const [projectsJson, paymentsJson, freelancersJson, reviewsJson] = await Promise.all([
          projectsRes.json(),
          paymentsRes.json(),
          freelancersRes.json(),
          reviewsRes.json(),
        ]);
        
        if (!mounted) return;
        setProjects(projectsJson?.projects ?? projectsJson);
        setPayments(paymentsJson?.payments ?? paymentsJson);
        setFreelancers(freelancersJson?.freelancers ?? freelancersJson);
        setReviews(reviewsJson?.reviews ?? reviewsJson);
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