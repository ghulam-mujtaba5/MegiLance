// @AI-HINT: Loading UI for portal routes (dashboard, settings, etc.)
// Uses Next.js loading.js convention - wrapped in Suspense automatically
import React from 'react';

export default function PortalLoading() {
  return (
    <div
      className="flex items-center justify-center min-h-[60vh]"
      role="status"
      aria-label="Loading dashboard content"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Skeleton pulse effect */}
        <div className="w-12 h-12 border-3 border-gray-200 dark:border-gray-700 border-t-[#4573df] rounded-full animate-spin" />
        <div className="space-y-2 w-48">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4 mx-auto" />
        </div>
      </div>
    </div>
  );
}
