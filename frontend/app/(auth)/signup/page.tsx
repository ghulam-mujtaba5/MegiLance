// @AI-HINT: This is the Next.js route file for the Signup page. It delegates to the Signup component and passes theme via context/props only.
import dynamic from 'next/dynamic';
import Skeleton from '@/app/components/Animations/Skeleton/Skeleton';

// Dynamically import the Signup component with SSR disabled
const Signup = dynamic(() => import('./Signup'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-96" />
});

export default function SignupPage() {
  return <Signup />;
}