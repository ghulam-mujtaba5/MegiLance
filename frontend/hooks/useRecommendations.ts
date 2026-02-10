// @AI-HINT: Simple hook to fetch AI-powered freelancer recommendations for clients
'use client';

import { useEffect, useState } from 'react';
import { getAuthToken } from '@/lib/api';

export interface Recommendation {
  id: string;
  name: string;
  title: string;
  rating: number;
  hourlyRate: string;
  avatarUrl?: string;
  location?: string;
  matchScore?: number;
}

export function useRecommendations(limit: number = 5) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const attemptFetch = async (retryCount: number = 0): Promise<void> => {
      const maxRetries = 3;
      try {
        setLoading(true);
        
        const token = getAuthToken();
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`/api/matching/recommendations?limit=${limit}`, {
          credentials: 'include',
          headers,
        });
        
        if (response.status === 401 && retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return attemptFetch(retryCount + 1);
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch recommendations: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.recommendations && Array.isArray(data.recommendations)) {
          const mapped = data.recommendations.map((r: any) => ({
            id: String(r.freelancer_id),
            name: r.freelancer_name || 'Unknown',
            title: r.freelancer_bio ? r.freelancer_bio.substring(0, 50) + '...' : 'Freelancer',
            rating: r.match_factors?.avg_rating ? r.match_factors.avg_rating * 5 : 4.5,
            hourlyRate: r.hourly_rate ? `$${r.hourly_rate}/hr` : '$0/hr',
            avatarUrl: r.profile_image_url || '/avatars/default.jpg',
            location: r.location || 'Remote',
            matchScore: r.match_score,
          }));
          setRecommendations(mapped);
          setError(null);
        } else {
          setRecommendations([]);
          setError(null);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch recommendations');
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    attemptFetch();
  }, [limit]);

  return { recommendations, loading, error };
}
