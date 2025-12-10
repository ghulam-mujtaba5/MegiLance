// @AI-HINT: Entry point for gig creation wizard - protected route for freelancers
import { Suspense } from 'react';
import type { Metadata } from 'next';
import GigCreate from './GigCreate';

export const metadata: Metadata = {
  title: 'Create a Gig | MegiLance',
  description: 'Create a new gig and start selling your services on MegiLance. Set your packages, prices, and showcase your work.',
  openGraph: {
    title: 'Create a Gig | MegiLance',
    description: 'Create a new gig and start selling your services on MegiLance.',
  },
};

function GigCreateLoading() {
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
        <p>Loading gig creator...</p>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function GigCreatePage() {
  return (
    <Suspense fallback={<GigCreateLoading />}>
      <GigCreate />
    </Suspense>
  );
}
