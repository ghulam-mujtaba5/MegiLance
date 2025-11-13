// @AI-HINT: Add payout method page - settings route for configuring withdrawal methods
import { Metadata } from 'next';
import PayoutMethodWizard from '@/components/wizards/PayoutMethodWizard';

export const metadata: Metadata = {
  title: 'Add Payout Method - MegiLance',
  description: 'Configure a new payout method for receiving your earnings'
};

export default function AddPayoutMethodPage() {
  // In a real app, get user ID from session/auth
  const userId = 'current-user-id'; // Replace with actual auth

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <PayoutMethodWizard userId={userId} />
    </div>
  );
}
