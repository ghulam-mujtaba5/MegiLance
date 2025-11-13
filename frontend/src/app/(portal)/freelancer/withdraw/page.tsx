// @AI-HINT: Freelancer withdrawal page - route for withdrawing funds from MegiLance wallet
import { Metadata } from 'next';
import PaymentWizard from '@/components/wizards/PaymentWizard';

export const metadata: Metadata = {
  title: 'Withdraw Funds - MegiLance',
  description: 'Withdraw your earnings from MegiLance to your preferred payment method'
};

export default function WithdrawPage() {
  // In a real app, get user ID from session/auth
  const userId = 'current-user-id'; // Replace with actual auth
  const availableBalance = 2500.00; // Replace with actual balance from API

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <PaymentWizard 
        flowType="withdrawal"
        availableBalance={availableBalance}
        userId={userId}
      />
    </div>
  );
}
