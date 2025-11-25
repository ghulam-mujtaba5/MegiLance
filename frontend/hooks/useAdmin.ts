import { useEffect, useState } from 'react';

// @AI-HINT: Hook to fetch admin portal datasets (users, projects, payments, support tickets, AI monitoring, dashboard KPIs).

export type AdminUser = { id: string; name: string; email: string; role: 'Admin' | 'Client' | 'Freelancer'; status: 'Active' | 'Suspended'; joined: string };
export type AdminProject = { id: string; title: string; client: string; status: string; budget?: string; updatedAt?: string };
export type AdminPayment = { id: string; date: string; description: string; amount: string; status: string };
export type AdminSupportTicket = { id: string; subject: string; status: string; createdAt: string; priority?: string };
export type AdminAIMetric = { 
  aiStats: { 
    rankModelAccuracy: string; 
    fraudDetections: number; 
    priceEstimations: number; 
    chatbotSessions: number; 
  }; 
  recentFraudAlerts: Array<{ 
    id: string; 
    referenceId: string; 
    reason: string; 
    timestamp: string; 
  }>; 
};
export type AdminKPI = { id: string; label: string; value: string; trend?: string };

export function useAdminData() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [projects, setProjects] = useState<AdminProject[] | null>(null);
  const [payments, setPayments] = useState<AdminPayment[] | null>(null);
  const [tickets, setTickets] = useState<AdminSupportTicket[] | null>(null);
  const [ai, setAI] = useState<AdminAIMetric | null>(null);
  const [kpis, setKPIs] = useState<AdminKPI[] | null>(null);
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
        
        const [usersJson, projJson, payJson, supJson, aiJson, dashJson] = await Promise.all([
          fetchWithFallback('/backend/api/admin/users', []),
          fetchWithFallback('/backend/api/admin/projects', []),
          fetchWithFallback('/backend/api/admin/payments', []),
          fetchWithFallback('/backend/api/admin/support/tickets', []),
          fetchWithFallback('/backend/api/admin/ai/usage', {}),
          fetchWithFallback('/backend/api/admin/dashboard/stats', {}),
        ]);
        
        if (!mounted) return;
        setUsers(usersJson?.users ?? usersJson ?? []);
        setProjects(projJson?.projects ?? projJson ?? []);
        setPayments(payJson?.payments ?? payJson ?? []);
        setTickets(supJson?.tickets ?? supJson ?? []);
        setAI(aiJson);
        setKPIs(dashJson?.kpis ?? dashJson?.metrics ?? []);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? 'Failed to load admin data');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  return { users, projects, payments, tickets, ai, kpis, loading, error } as const;
} 