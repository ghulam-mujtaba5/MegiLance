import { useEffect, useState } from 'react';
import api from '@/lib/api';

// @AI-HINT: Hook to fetch current user profile from /api/user.

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  profile_image_url?: string;
  user_type: string;
  // Add other fields as needed based on UserRead schema
};

export function useUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchUser() {
      setLoading(true);
      setError(null);
      try {
        const userData = await api.auth.me();
        if (isMounted) {
          // Map API response to CurrentUser type if needed, or just use the response
          setUser({
            id: Number(userData.id),
            name: userData.name,
            email: userData.email,
            profile_image_url: (userData as any).profile_image_url,
            user_type: userData.role // api.ts defines role in AuthUser
          });
        }
      } catch (err: any) {
        if (isMounted) setError(err?.message ?? 'Failed to load user');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchUser();
    return () => {
      isMounted = false;
    };
  }, []);

  return { user, loading, error } as const;
} 