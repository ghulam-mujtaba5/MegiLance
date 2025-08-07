// @AI-HINT: This page allows freelancers to view their smart contracts for ongoing and completed jobs, now with a premium, theme-aware, and accessible table layout.
'use client';

import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import Badge from '@/app/components/Badge/Badge';
import commonStyles from './Contracts.common.module.css';
import lightStyles from './Contracts.light.module.css';
import darkStyles from './Contracts.dark.module.css';

// @AI-HINT: Mock data for contracts.
const mockContracts = [
  {
    id: 'contract_abc123',
    projectTitle: 'Build a Decentralized Exchange',
    clientName: 'DeFi Innovators Inc.',
    value: 5000, // USDC
    status: 'Active',
    contractAddress: '0x123...def',
  },
  {
    id: 'contract_def456',
    projectTitle: 'Create 3D NFT Avatars',
    clientName: 'Metaverse Creations',
    value: 2500,
    status: 'Completed',
    contractAddress: '0x456...abc',
  },
  {
    id: 'contract_ghi789',
    projectTitle: 'Audit a Smart Contract',
    clientName: 'SecureChain Labs',
    value: 1500,
    status: 'Disputed',
    contractAddress: '0x789...ghi',
  },
  {
    id: 'contract_jkl012',
    projectTitle: 'Develop a Web3 Wallet',
    clientName: 'Crypto Wallet Co.',
    value: 7500,
    status: 'Completed',
    contractAddress: '0x012...jkl',
  },
];

const getStatusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active': return 'info';
    case 'completed': return 'success';
    case 'disputed': return 'danger';
    default: return 'secondary';
  }
};

const ContractsPage: React.FC = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => {
    const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [theme]);

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Your Contracts</h1>
        <p className={styles.subtitle}>View and manage all your smart contracts.</p>
      </header>

      <main>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Project</th>
                <th>Client</th>
                <th>Value</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockContracts.map(contract => (
                <tr key={contract.id}>
                  <td>
                    <span className={styles.projectTitle}>{contract.projectTitle}</span>
                  </td>
                  <td>{contract.clientName}</td>
                  <td>
                    <span className={styles.value}>{contract.value} USDC</span>
                  </td>
                  <td>
                    <Badge variant={getStatusBadgeVariant(contract.status)}>{contract.status}</Badge>
                  </td>
                  <td>
                    <a 
                      href={`https://etherscan.io/address/${contract.contractAddress}`}
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={styles.link}
                    >
                      View on Etherscan
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default ContractsPage;
