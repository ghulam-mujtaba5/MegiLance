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
        const [usersRes, projRes, payRes, supRes, aiRes, dashRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/projects'),
          fetch('/api/admin/payments'),
          fetch('/api/admin/support'),
          fetch('/api/admin/ai-monitoring'),
          fetch('/api/admin/dashboard'),
        ]);
        if ([usersRes, projRes, payRes, supRes, aiRes, dashRes].some(r => !r.ok)) {
          throw new Error('One or more admin API requests failed');
        }
        const [usersJson, projJson, payJson, supJson, aiJson, dashJson] = await Promise.all([
          usersRes.json(),
          projRes.json(),
          payRes.json(),
          supRes.json(),
          aiRes.json(),
          dashRes.json(),
        ]);
        if (!mounted) return;
        setUsers(usersJson?.users ?? usersJson);
        setProjects(projJson?.projects ?? projJson);
        setPayments(payJson?.payments ?? payJson);
        setTickets(supJson?.tickets ?? supJson);
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