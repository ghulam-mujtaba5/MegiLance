// @AI-HINT: Freelancer withdrawal page - route for withdrawing funds from MegiLance wallet
'use client';

import { Metadata } from 'next';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import PaymentWizard from '@/src/components/wizards/PaymentWizard';
import { useFreelancerData } from '@/hooks/useFreelancer';

import common from './Withdraw.common.module.css';
import light from './Withdraw.light.module.css';
import dark from './Withdraw.dark.module.css';

export default function WithdrawPage() {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const { analytics, loading } = useFreelancerData();
  
  // Parse balance from analytics
  const availableBalance = parseFloat(
    analytics?.walletBalance?.replace(/[$,]/g, '') || '0'
  );

  if (!resolvedTheme) return null;

  return (
    <div className={cn(common.container, themed.container)}>
      <PaymentWizard 
        flowType="withdrawal"
        availableBalance={availableBalance}
        userId="current-user"
      />
    </div>
  );
}
