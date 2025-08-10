import { useEffect, useState } from 'react';

// @AI-HINT: Hook to fetch dashboard data for metrics, recent projects, and activity feed.

export type DashboardMetric = {
  id: number;
  label: string;
  value: string;
  icon: string; // e.g., FaBriefcase
  change?: string;
  changeType?: 'increase' | 'decrease';
};

export type DashboardProject = {
  id: number;
  title: string;
  client: string;
  status: 'In Progress' | 'Review' | 'Completed' | 'Overdue';
  progress: number; // 0-100
  deadline: string; // ISO-like
  budget?: string;
};

export type DashboardActivity = {
  id: number;
  message: string;
  time: string;
  icon: string; // e.g., FaDollarSign
  amount?: string;
};

export type DashboardData = {
  metrics: DashboardMetric[];
  recentProjects: DashboardProject[];
  activityFeed: DashboardActivity[];
};

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/dashboard', { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as DashboardData;
        if (isMounted) setData(json);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        if (isMounted) setError(err?.message ?? 'Failed to load dashboard data');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  return { data, loading, error } as const;
} 