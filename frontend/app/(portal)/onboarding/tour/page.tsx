// @AI-HINT: Onboarding tour page - first-time user experience
import { Metadata } from 'next';
import OnboardingTourWizard from '@/src/components/wizards/OnboardingTourWizard';

export const metadata: Metadata = {
  title: 'Welcome to MegiLance - Get Started',
  description: 'Complete your onboarding tour and learn how to use MegiLance'
};

export default function OnboardingPage() {
  // In a real app, get user ID and role from session/auth
  const userId = 'current-user-id'; // Replace with actual auth
  const userRole = 'freelancer'; // Replace with actual role from auth

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <OnboardingTourWizard 
        userId={userId}
        initialRole={userRole as 'freelancer' | 'client'}
      />
    </div>
  );
}
