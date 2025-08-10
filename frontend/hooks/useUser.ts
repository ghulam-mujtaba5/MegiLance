import { useEffect, useState } from 'react';

// @AI-HINT: Hook to fetch current user profile from /api/user.

export type CurrentUser = {
  fullName: string;
  email: string;
  avatar?: string;
  notificationCount?: number;
};

export function useUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function fetchUser() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/user', { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (isMounted) setUser(json);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        if (isMounted) setError(err?.message ?? 'Failed to load user');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchUser();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  return { user, loading, error } as const;
} 