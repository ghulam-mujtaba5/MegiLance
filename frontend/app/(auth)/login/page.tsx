// @AI-HINT: This is the Next.js route file for the Login page. It delegates to the Login component and passes theme via context/props only.
'use client';

import dynamic from 'next/dynamic';
import Skeleton from '@/app/components/Animations/Skeleton/Skeleton';

// Dynamically import the Login component
const Login = dynamic(() => import('./Login'), {
  loading: () => <Skeleton className="w-full h-96" />
});

const LoginPage = () => {
  return <Login />;
};

export default LoginPage;