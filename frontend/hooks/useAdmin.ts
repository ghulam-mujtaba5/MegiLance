import { useEffect, useState } from 'react';

// @AI-HINT: Hook to fetch admin portal datasets (users, projects, payments, support tickets, AI monitoring, dashboard KPIs, stats, recent activity).

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

// System stats from /admin/dashboard/stats endpoint
export type SystemStats = {
  total_users: number;
  total_clients: number;
  total_freelancers: number;
  total_projects: number;
  total_contracts: number;
  total_revenue: number;
  active_projects: number;
  pending_proposals: number;
};

// Recent activity from /admin/dashboard/recent-activity endpoint
export type RecentActivity = {
  type: string;
  description: string;
  timestamp: string;
  user_name: string;
  amount?: number | null;
};

export function useAdminData() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [projects, setProjects] = useState<AdminProject[] | null>(null);
  const [payments, setPayments] = useState<AdminPayment[] | null>(null);
  const [tickets, setTickets] = useState<AdminSupportTicket[] | null>(null);
  const [ai, setAI] = useState<AdminAIMetric | null>(null);
  const [kpis, setKPIs] = useState<AdminKPI[] | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Get auth token from localStorage (stored as access_token during login)
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        // Use the backend proxy endpoints - fetch each individually and handle failures gracefully
        const fetchWithFallback = async <T>(url: string, fallback: T): Promise<T> => {
          try {
            const res = await fetch(url, { headers });
            if (!res.ok) return fallback;
            return await res.json();
          } catch {
            return fallback;
          }
        };
        
        const [usersJson, projJson, payJson, supJson, aiJson, dashJson, activityJson] = await Promise.all([
          fetchWithFallback('/backend/api/admin/users', []),
          fetchWithFallback('/backend/api/admin/projects', []),
          fetchWithFallback('/backend/api/admin/payments', []),
          fetchWithFallback('/backend/api/admin/support/tickets', []),
          fetchWithFallback('/backend/api/admin/ai/usage', {}),
          fetchWithFallback<SystemStats | null>('/backend/api/admin/dashboard/stats', null),
          fetchWithFallback<RecentActivity[]>('/backend/api/admin/dashboard/recent-activity', []),
        ]);
        
        if (!mounted) return;
        setUsers(usersJson?.users ?? usersJson ?? []);
        setProjects(projJson?.projects ?? projJson ?? []);
        setPayments(payJson?.payments ?? payJson ?? []);
        setTickets(supJson?.tickets ?? supJson ?? []);
        setAI(aiJson);
        setSystemStats(dashJson);
        setRecentActivity(activityJson);
        
        // Transform systemStats into KPIs for backward compatibility
        if (dashJson) {
          const kpiList: AdminKPI[] = [
            { id: 'users', label: 'Total Users', value: dashJson.total_users?.toLocaleString() ?? '0' },
            { id: 'projects', label: 'Active Projects', value: dashJson.active_projects?.toLocaleString() ?? '0' },
            { id: 'revenue', label: 'Revenue', value: `$${((dashJson.total_revenue ?? 0) / 1000).toFixed(0)}k` },
            { id: 'proposals', label: 'Pending Proposals', value: dashJson.pending_proposals?.toLocaleString() ?? '0' },
          ];
          setKPIs(kpiList);
        } else {
          setKPIs([]);
        }
      } catch (e: unknown) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Failed to load admin data');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  return { users, projects, payments, tickets, ai, kpis, systemStats, recentActivity, loading, error } as const;
} 