// @AI-HINT: Entry point for freelancer gigs management - protected route
import { Suspense } from 'react';
import type { Metadata } from 'next';
import GigsList from './GigsList';

export const metadata: Metadata = {
  title: 'My Gigs | MegiLance',
  description: 'Manage your gigs, track performance, and grow your freelance business on MegiLance.',
  openGraph: {
    title: 'My Gigs | MegiLance',
    description: 'Manage your gigs and track performance on MegiLance.',
  },
};

function GigsListLoading() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '3px solid #e5e7eb',
          borderTopColor: '#4573df',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p>Loading your gigs...</p>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function GigsPage() {
  return (
    <Suspense fallback={<GigsListLoading />}>
      <GigsList />
    </Suspense>
  );
}
