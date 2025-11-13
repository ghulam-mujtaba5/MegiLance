// @AI-HINT: This page displays detailed information about a specific contract.
'use client';

import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FiArrowLeft, FiDownload, FiExternalLink } from 'react-icons/fi';

import Button from '@/app/components/Button/Button';
import Badge from '@/app/components/Badge/Badge';
import { useToaster } from '@/app/components/Toast/ToasterProvider';

import commonStyles from './ContractDetails.common.module.css';
import lightStyles from './ContractDetails.light.module.css';
import darkStyles from './ContractDetails.dark.module.css';

// Mock contract data - in a real app, this would come from an API
const mockContract = {
  id: 'contract_abc123',
  projectTitle: 'Build a Decentralized Exchange',
  clientName: 'DeFi Innovators Inc.',
  value: 5000, // USDC
  status: 'Active',
  contractAddress: '0x123...def',
  startDate: '2025-06-15',
  endDate: '2025-09-15',
  description: 'Develop a full-featured decentralized exchange with automated market maker functionality, liquidity pools, and yield farming capabilities.',
  milestones: [
    { id: 1, name: 'Smart Contract Development', status: 'Completed', amount: 2000 },
    { id: 2, name: 'Frontend Implementation', status: 'In Progress', amount: 1500 },
    { id: 3, name: 'Security Audit', status: 'Pending', amount: 1000 },
    { id: 4, name: 'Deployment & Testing', status: 'Pending', amount: 500 },
  ],
  terms: {
    paymentTerms: '50% upfront, 30% at milestone completion, 20% at final delivery',
    revisionPolicy: 'Up to 3 rounds of revisions included',
    cancellationPolicy: '7-day cancellation period with 50% refund',
  },
};

const getStatusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active': return 'info';
    case 'completed': return 'success';
    case 'disputed': return 'danger';
    case 'pending': return 'warning';
    default: return 'secondary';
  }
};

const ContractDetailsPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const toaster = useToaster();
  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  const handleBack = () => {
    router.back();
  };

  const handleDownload = () => {
    toaster.notify({ 
      title: 'Download started', 
      description: `Downloading contract for ${mockContract.projectTitle}`, 
      variant: 'success' 
    });
  };

  const handleViewOnEtherscan = () => {
    window.open(`https://etherscan.io/address/${mockContract.contractAddress}`, '_blank');
  };

  const totalMilestones = mockContract.milestones.length;
  const completedMilestones = mockContract.milestones.filter(m => m.status === 'Completed').length;
  const progressPercentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  return (
    <div className={cn(styles.container, resolvedTheme && styles[resolvedTheme])}>
      <header className={styles.header}>
        <Button 
          variant="secondary" 
          onClick={handleBack} 
          aria-label="Back to contracts"
          title="Back to contracts"
        >
          <FiArrowLeft /> Back
        </Button>
        
        <div className={styles.headerActions}>
          <Button 
            variant="secondary" 
            onClick={handleDownload}
            aria-label="Download contract"
            title="Download contract"
          >
            <FiDownload /> Download
          </Button>
          <Button 
            variant="primary" 
            onClick={handleViewOnEtherscan}
            aria-label="View on Etherscan"
            title="View on Etherscan"
          >
            <FiExternalLink /> View on Etherscan
          </Button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.contractHeader}>
          <div>
            <h1 className={styles.title}>{mockContract.projectTitle}</h1>
            <p className={styles.client}>for {mockContract.clientName}</p>
          </div>
          <div className={styles.contractMeta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Status</span>
              <Badge variant={getStatusBadgeVariant(mockContract.status)}>
                {mockContract.status}
              </Badge>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Value</span>
              <span className={styles.metaValue}>{mockContract.value} USDC</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Contract ID</span>
              <span className={styles.metaValue}>{mockContract.id}</span>
            </div>
          </div>
        </div>

        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <h2 className={styles.sectionTitle}>Project Progress</h2>
            <span className={styles.progressText}>{completedMilestones}/{totalMilestones} milestones completed</span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              data-progress={progressPercentage}
            ></div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Project Description</h2>
          <p className={styles.description}>{mockContract.description}</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Milestones</h2>
          <div className={styles.milestones}>
            {mockContract.milestones.map((milestone) => (
              <div key={milestone.id} className={styles.milestone}>
                <div className={styles.milestoneHeader}>
                  <h3 className={styles.milestoneTitle}>{milestone.name}</h3>
                  <Badge variant={getStatusBadgeVariant(milestone.status)}>
                    {milestone.status}
                  </Badge>
                </div>
                <div className={styles.milestoneAmount}>
                  {milestone.amount} USDC
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Contract Terms</h2>
          <div className={styles.termsGrid}>
            <div className={styles.termItem}>
              <h3 className={styles.termTitle}>Payment Terms</h3>
              <p className={styles.termDescription}>{mockContract.terms.paymentTerms}</p>
            </div>
            <div className={styles.termItem}>
              <h3 className={styles.termTitle}>Revision Policy</h3>
              <p className={styles.termDescription}>{mockContract.terms.revisionPolicy}</p>
            </div>
            <div className={styles.termItem}>
              <h3 className={styles.termTitle}>Cancellation Policy</h3>
              <p className={styles.termDescription}>{mockContract.terms.cancellationPolicy}</p>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Timeline</h2>
          <div className={styles.timeline}>
            <div className={styles.timelineItem}>
              <span className={styles.timelineLabel}>Start Date</span>
              <span className={styles.timelineValue}>{mockContract.startDate}</span>
            </div>
            <div className={styles.timelineItem}>
              <span className={styles.timelineLabel}>End Date</span>
              <span className={styles.timelineValue}>{mockContract.endDate}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContractDetailsPage;