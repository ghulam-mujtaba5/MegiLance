// @AI-HINT: Custom hook for managing authentication state and user profile
// Handles login/logout, token refresh, and user data fetching
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api, { setAuthToken, clearAuthData, getAuthToken, APIError } from '@/lib/api';

export interface User {
  id: number;
  email: string;
  name: string;
  user_type: 'client' | 'freelancer' | 'admin';
  role: string;
  bio?: string;
  skills?: string;
  hourly_rate?: number;
  profile_image_url?: string;
  location?: string;
  title?: string;
  is_verified?: boolean;
  joined_at?: string;
}

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = useMemo(() => !!user, [user]);

  // Load user from storage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Try to get user from localStorage first for quick render
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          try {
            const parsed = JSON.parse(cachedUser);
            setUser(parsed);
          } catch {
            // Invalid cache, ignore
          }
        }

        // Verify token and get fresh user data
        const userData = await api.auth.me();
        const normalizedUser: User = {
          id: Number(userData.id),
          email: userData.email,
          name: userData.name || userData.full_name || '',
          user_type: (userData.user_type || userData.role || 'client').toLowerCase() as User['user_type'],
          role: userData.role || userData.user_type || 'client',
          bio: userData.bio,
          skills: userData.skills,
          hourly_rate: userData.hourly_rate,
          profile_image_url: userData.profile_image_url || userData.avatar_url,
          location: userData.location,
          title: userData.title,
          is_verified: userData.is_verified,
          joined_at: userData.joined_at,
        };

        setUser(normalizedUser);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        setError(null);
      } catch (err) {
        console.error('Failed to load user:', err);
        if (err instanceof APIError && err.status === 401) {
          // Token expired, clear auth data
          clearAuthData();
          setUser(null);
        }
        setError(err instanceof Error ? err.message : 'Failed to load user');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.auth.login(email, password);
      
      // Check if 2FA is required
      if ((response as any).requires_2fa) {
        throw new Error('2FA_REQUIRED');
      }

      const normalizedUser: User = {
        id: Number(response.user.id),
        email: response.user.email,
        name: response.user.name || '',
        user_type: (response.user.user_type || response.user.role || 'client').toLowerCase() as User['user_type'],
        role: response.user.role || response.user.user_type || 'client',
        bio: response.user.bio,
        skills: response.user.skills,
        hourly_rate: response.user.hourly_rate,
        profile_image_url: response.user.profile_image_url,
        location: response.user.location,
        title: response.user.title,
        is_verified: response.user.is_verified,
        joined_at: response.user.joined_at,
      };

      setUser(normalizedUser);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      localStorage.setItem('auth_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);

      // Set cookie for middleware
      document.cookie = `auth_token=${response.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

      // Redirect based on role
      const redirectPath = normalizedUser.user_type === 'admin' 
        ? '/admin/dashboard'
        : normalizedUser.user_type === 'freelancer'
          ? '/freelancer/dashboard'
          : '/client/dashboard';

      router.push(redirectPath);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const logout = useCallback(() => {
    clearAuthData();
    setUser(null);
    router.push('/login');
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await api.auth.me();
      const normalizedUser: User = {
        id: Number(userData.id),
        email: userData.email,
        name: userData.name || userData.full_name || '',
        user_type: (userData.user_type || userData.role || 'client').toLowerCase() as User['user_type'],
        role: userData.role || userData.user_type || 'client',
        bio: userData.bio,
        skills: userData.skills,
        hourly_rate: userData.hourly_rate,
        profile_image_url: userData.profile_image_url || userData.avatar_url,
        location: userData.location,
        title: userData.title,
        is_verified: userData.is_verified,
        joined_at: userData.joined_at,
      };

      setUser(normalizedUser);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
    } catch (err) {
      console.error('Failed to refresh user:', err);
      throw err;
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    try {
      await api.auth.updateProfile(data);
      await refreshUser();
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  }, [refreshUser]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refreshUser,
    updateProfile,
  };
}

export default useAuth;
