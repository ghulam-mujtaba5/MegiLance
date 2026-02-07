// @AI-HINT: Loading UI for auth routes (login, signup, etc.)
// Uses Next.js loading.js file convention for instant Suspense boundaries
import React from 'react';

export default function AuthLoading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      role="status"
      aria-label="Loading authentication page"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-[#4573df] rounded-full animate-spin" />
        <p className="text-sm text-gray-500 animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
