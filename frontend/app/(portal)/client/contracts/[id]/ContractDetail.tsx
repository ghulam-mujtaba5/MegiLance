'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { contractsApi as _contractsApi, milestonesApi as _milestonesApi } from '@/lib/api';
import { Button } from '@/app/components/Button';
import commonStyles from './ContractDetail.common.module.css';
import lightStyles from './ContractDetail.light.module.css';
import darkStyles from './ContractDetail.dark.module.css';

const contractsApi: any = _contractsApi;
const milestonesApi: any = _milestonesApi;

// @AI-HINT: Client view for managing a specific contract and its milestones

interface Milestone {
  id: number;
  description: string;
  amount: number;
  status: 'pending' | 'active' | 'submitted' | 'approved' | 'paid' | 'rejected';
  due_date?: string;
}

interface Contract {
  id: number;
  title: string;
  freelancer_id: number;
  client_id: number;
  total_budget: number;
  status: string;
  start_date: string;
  end_date?: string;
  milestones: Milestone[];
  freelancer?: {
    full_name: string;
    email: string;
  };
}

interface ContractDetailProps {
  contractId: number;
}

export default function ContractDetail({ contractId }: ContractDetailProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null); // ID of milestone being processed

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const data = await contractsApi.get(contractId);
        setContract(data);
      } catch (err) {
        console.error('Failed to fetch contract:', err);
        setError('Failed to load contract details.');
      } finally {
        setLoading(false);
      }
    };

    if (contractId) {
      fetchContract();
    }
  }, [contractId]);

  const handleMilestoneAction = async (milestoneId: number, action: 'approve' | 'reject') => {
    setActionLoading(milestoneId);
    try {
      if (action === 'approve') {
        await milestonesApi.approve(milestoneId);
      } else {
        await milestonesApi.reject(milestoneId);
      }
      // Refresh data
      const data = await contractsApi.get(contractId);
      setContract(data);
    } catch (err) {
      console.error(`Failed to ${action} milestone:`, err);
      alert(`Failed to ${action} milestone. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  if (!resolvedTheme) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (loading) {
    return <div className={cn(commonStyles.container, themeStyles.container)}>Loading contract details...</div>;
  }

  if (error || !contract) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={commonStyles.error}>{error || 'Contract not found'}</div>
        <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <h1 className={cn(commonStyles.title, themeStyles.title)}>{contract.title}</h1>
        <span className={commonStyles.statusBadge}>{contract.status}</span>
      </div>

      <div className={cn(commonStyles.section, themeStyles.section)}>
        <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Details</h2>
        <div className={commonStyles.grid}>
          <div>
            <label className={commonStyles.label}>Freelancer</label>
            <div>{contract.freelancer?.full_name || 'Unknown'}</div>
          </div>
          <div>
            <label className={commonStyles.label}>Budget</label>
            <div>${contract.total_budget.toLocaleString()}</div>
          </div>
          <div>
            <label className={commonStyles.label}>Start Date</label>
            <div>{new Date(contract.start_date).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      <div className={cn(commonStyles.section, themeStyles.section)}>
        <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Milestones</h2>
        <div className={commonStyles.milestoneList}>
          {contract.milestones && contract.milestones.length > 0 ? (
            contract.milestones.map((milestone) => (
              <div key={milestone.id} className={cn(commonStyles.milestoneItem, themeStyles.milestoneItem)}>
                <div className={commonStyles.milestoneInfo}>
                  <div className={commonStyles.milestoneDesc}>{milestone.description}</div>
                  <div className={commonStyles.milestoneMeta}>
                    ${milestone.amount.toLocaleString()} • Due: {milestone.due_date ? new Date(milestone.due_date).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <div className={commonStyles.milestoneActions}>
                  <span className={cn(commonStyles.statusBadge, commonStyles[milestone.status])}>
                    {milestone.status}
                  </span>
                  
                  {milestone.status === 'submitted' && (
                    <div className={commonStyles.actionButtons}>
                      <Button 
                        variant="success" 
                        size="sm" 
                        isLoading={actionLoading === milestone.id}
                        onClick={() => handleMilestoneAction(milestone.id, 'approve')}
                      >
                        Approve & Pay
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        isLoading={actionLoading === milestone.id}
                        onClick={() => handleMilestoneAction(milestone.id, 'reject')}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className={commonStyles.emptyState}>No milestones defined for this contract.</div>
          )}
        </div>
      </div>
      
      <div className={commonStyles.footer}>
        <Button variant="outline" onClick={() => router.push('/portal/client/contracts')}>
          Back to Contracts
        </Button>
      </div>
    </div>
  );
}
