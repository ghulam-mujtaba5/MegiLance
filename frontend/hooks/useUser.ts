import { useEffect, useState } from 'react';
import api from '@/lib/api';

// @AI-HINT: Hook to fetch current user profile from /api/auth/me endpoint.

export type CurrentUser = {
  id: number;
  name: string;
  fullName: string;
  email: string;
  avatar: string;
  profile_image_url?: string;
  user_type: string;
  notificationCount: number;
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
          const name = userData.name || (userData as any).full_name || 'User';
          setUser({
            id: Number(userData.id),
            name,
            fullName: name,
            email: userData.email,
            avatar: (userData as any).profile_image_url || (userData as any).avatar_url || '/images/avatars/avatar-1.png',
            profile_image_url: (userData as any).profile_image_url,
            user_type: userData.role || (userData as any).user_type || 'client',
            notificationCount: (userData as any).notification_count || 0,
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