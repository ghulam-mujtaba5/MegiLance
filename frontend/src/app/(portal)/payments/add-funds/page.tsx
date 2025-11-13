// @AI-HINT: Add funds page - route for adding money to MegiLance wallet
import { Metadata } from 'next';
import PaymentWizard from '@/components/wizards/PaymentWizard';

export const metadata: Metadata = {
  title: 'Add Funds - MegiLance',
  description: 'Add funds to your MegiLance wallet for projects and payments'
};

export default function AddFundsPage() {
  // In a real app, get user ID from session/auth
  const userId = 'current-user-id'; // Replace with actual auth

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <PaymentWizard 
        flowType="addFunds"
        userId={userId}
      />
    </div>
  );
}
