// @AI-HINT: Profile completeness indicator - shows percentage and missing fields
'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface ProfileCompletenessData {
  percentage: number;
  completed: number;
  total: number;
  is_complete: boolean;
  missing_fields: string[];
  fields: Record<string, boolean>;
}

interface ProfileCompletenessProps {
  className?: string;
  showDetails?: boolean;
}

export default function ProfileCompleteness({ className, showDetails = true }: ProfileCompletenessProps) {
  const { resolvedTheme } = useTheme();
  const [data, setData] = useState<ProfileCompletenessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompleteness = async () => {
      try {
        const response = await api.users.getProfileCompleteness();
        setData(response as ProfileCompletenessData);
      } catch (err) {
        console.error('Failed to fetch profile completeness:', err);
        setError('Unable to load profile status');
      } finally {
        setLoading(false);
      }
    };

    fetchCompleteness();
  }, []);

  if (loading) {
    return (
      <div className={cn('animate-pulse rounded-lg p-4', className)}>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      </div>
    );
  }

  if (error || !data) {
    return null; // Silently fail - not critical
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const isDark = resolvedTheme === 'dark';

  return (
    <div className={cn(
      'rounded-xl p-4 border transition-colors',
      isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200',
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={cn('font-medium text-sm', isDark ? 'text-gray-200' : 'text-gray-700')}>
          Profile Completion
        </h3>
        <span className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>
          {data.percentage}%
        </span>
      </div>

      {/* Progress bar */}
      <div className={cn('h-2 rounded-full overflow-hidden', isDark ? 'bg-gray-700' : 'bg-gray-200')}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', getProgressColor(data.percentage))}
          style={{ width: `${data.percentage}%` }}
        />
      </div>

      {/* Missing fields */}
      {showDetails && data.missing_fields.length > 0 && (
        <div className="mt-3">
          <p className={cn('text-xs mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
            Complete these to improve visibility:
          </p>
          <ul className="flex flex-wrap gap-1">
            {data.missing_fields.slice(0, 4).map((field) => (
              <li
                key={field}
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                )}
              >
                {field}
              </li>
            ))}
            {data.missing_fields.length > 4 && (
              <li className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
              )}>
                +{data.missing_fields.length - 4} more
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Complete badge */}
      {data.is_complete && (
        <div className="mt-2 flex items-center gap-1 text-green-500">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-medium">Profile complete!</span>
        </div>
      )}
    </div>
  );
}
