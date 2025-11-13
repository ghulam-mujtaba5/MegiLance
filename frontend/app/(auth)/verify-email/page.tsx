// @AI-HINT: Email verification page - verifies email with token from URL
import dynamic from 'next/dynamic';
import Skeleton from '@/app/components/Animations/Skeleton/Skeleton';

const VerifyEmail = dynamic(() => import('./VerifyEmail'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-96" />
});

export default function VerifyEmailPage() {
  return <VerifyEmail />;
}
