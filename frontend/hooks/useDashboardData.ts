import { useEffect, useState } from 'react';

// @AI-HINT: Hook to fetch dashboard data for metrics, recent projects, and activity feed.
// Uses local fallback data when API is unavailable for FYP demonstration.

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

// Fallback data for when API is unavailable (FYP demo mode)
const FALLBACK_DASHBOARD_DATA: DashboardData = {
  metrics: [
    { id: 1, label: "Active Projects", value: "12", icon: "FaBriefcase", change: "+2", changeType: "increase" },
    { id: 2, label: "Pending Tasks", value: "8", icon: "FaTasks", change: "-1", changeType: "decrease" },
    { id: 3, label: "Team Members", value: "24", icon: "FaUsers", change: "+3", changeType: "increase" },
    { id: 4, label: "Revenue (Month)", value: "$45.8K", icon: "FaChartBar", change: "+5.2%", changeType: "increase" }
  ],
  recentProjects: [
    { id: 1, title: "E-commerce Platform Redesign", client: "TechCorp Inc.", status: "In Progress", progress: 75, deadline: "2025-08-15", budget: "$5,200" },
    { id: 2, title: "Mobile App Development", client: "StartupXYZ", status: "Review", progress: 90, deadline: "2025-08-10", budget: "$3,800" },
    { id: 3, title: "Brand Identity Package", client: "Creative Agency", status: "Completed", progress: 100, deadline: "2025-08-05", budget: "$2,100" },
    { id: 4, title: "AI Chatbot Integration", client: "FutureAI", status: "Overdue", progress: 60, deadline: "2025-07-30", budget: "$7,500" }
  ],
  activityFeed: [
    { id: 1, message: "Payment received from Innovate Inc.", time: "2h ago", icon: "FaCreditCard", amount: "+$2,500" },
    { id: 2, message: "Task \"Deploy to Staging\" completed", time: "5h ago", icon: "FaClipboardCheck" },
    { id: 3, message: "New project \"Brand Redesign\" created", time: "1d ago", icon: "FaRocket" },
    { id: 4, message: "@jane.doe joined the AI Dashboard team", time: "2d ago", icon: "FaUserClock" }
  ]
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
        // Get auth token from localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const res = await fetch('/backend/api/mock/dashboard', { signal: controller.signal, headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as DashboardData;
        if (isMounted) setData(json);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        // Use fallback data when API is unavailable (FYP demo mode)
        console.log('[useDashboardData] API unavailable, using fallback data');
        if (isMounted) {
          setData(FALLBACK_DASHBOARD_DATA);
          setError(null); // Clear error since we have fallback data
        }
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