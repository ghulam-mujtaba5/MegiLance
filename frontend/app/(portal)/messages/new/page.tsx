// @AI-HINT: Route page for new message wizard
import { Metadata } from 'next';
import MessagingWizard from '@/src/components/wizards/MessagingWizard';

export const metadata: Metadata = {
  title: 'New Message - MegiLance',
  description: 'Send a new message'
};

export default function NewMessagePage() {
  // Get user info from session (replace with actual auth)
  const userId = 'current-user-id';
  const userType = 'client'; // or 'freelancer'

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <MessagingWizard
        userId={userId}
        userType={userType}
      />
    </div>
  );
}
