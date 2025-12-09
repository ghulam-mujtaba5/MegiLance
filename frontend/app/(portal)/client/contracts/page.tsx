// @AI-HINT: Client Contracts List Page
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { contractsApi } from '@/lib/api';
import { Button } from '@/app/components/Button';
import { Badge } from '@/app/components/Badge';
import { PageTransition, StaggerContainer, StaggerItem } from '@/app/components/Animations';
import commonStyles from './Contracts.common.module.css';
import lightStyles from './Contracts.light.module.css';
import darkStyles from './Contracts.dark.module.css';

interface Contract {
  id: number;
  title: string;
  status: string;
  total_budget: number;
  start_date: string;
  freelancer?: {
    full_name: string;
  };
}

export default function ClientContractsPage() {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContracts() {
      try {
        const response = await contractsApi.list() as { contracts: Contract[] };
        // Handle both array response and object with contracts property
        const data = Array.isArray(response) ? response : (response.contracts || []);
        setContracts(data);
      } catch (error) {
        console.error('Failed to load contracts', error);
      } finally {
        setLoading(false);
      }
    }
    loadContracts();
  }, []);

  if (!resolvedTheme) return null;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <header className={commonStyles.header}>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>My Contracts</h1>
          <Button variant="primary" onClick={() => alert('Contract creation coming soon! Navigate to Projects to hire freelancers.')}>New Contract</Button>
        </header>

        {loading ? (
           <div className="p-8 text-center">Loading contracts...</div>
        ) : (
          <StaggerContainer className={commonStyles.grid}>
            {contracts.length > 0 ? (
              contracts.map((contract) => (
                <StaggerItem key={contract.id}>
                  <Link href={`/portal/client/contracts/${contract.id}`} className="block">
                    <div className={cn(commonStyles.card, themeStyles.card)}>
                      <div className={commonStyles.cardHeader}>
                        <h3 className={commonStyles.cardTitle}>{contract.title}</h3>
                        <Badge variant={contract.status === 'active' ? 'success' : 'default'}>{contract.status}</Badge>
                      </div>
                      <p className={commonStyles.cardText}>Freelancer: {contract.freelancer?.full_name || 'Unknown'}</p>
                      <p className={commonStyles.cardText}>Amount: ${contract.total_budget.toLocaleString()}</p>
                      <div className={commonStyles.cardMeta}>Started: {new Date(contract.start_date).toLocaleDateString()}</div>
                    </div>
                  </Link>
                </StaggerItem>
              ))
            ) : (
              <div className="col-span-full text-center p-8 text-gray-500">No contracts found.</div>
            )}
          </StaggerContainer>
        )}
      </div>
    </PageTransition>
  );
}
