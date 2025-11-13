// @AI-HINT: Admin analytics dashboard page
import dynamic from 'next/dynamic';
import Skeleton from '@/app/components/Animations/Skeleton/Skeleton';

const AnalyticsDashboard = dynamic(() => import('./AnalyticsDashboard'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-96" />
});

export default function AnalyticsPage() {
  return <AnalyticsDashboard />;
}
