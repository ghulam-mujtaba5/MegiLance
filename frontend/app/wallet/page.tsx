// @AI-HINT: Wallet page scaffold using premium EmptyState and global Toaster.

'use client';

import React from 'react';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { useToaster } from '@/app/components/Toast/ToasterProvider';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import styles from './Wallet.common.module.css';

const WalletPage: React.FC = () => {
  const { notify } = useToaster();
  return (
    <PageTransition>
      <main className={styles.page}>
        <div className={styles.container}>
          <ScrollReveal>
            <header className={styles.header}>
              <h1 className={styles.title}>Wallet</h1>
              <p className={styles.subtitle}>Manage balances, payouts, and transaction history.</p>
            </header>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <EmptyState
              title="No transactions yet"
              description="You don’t have any transactions. Connect a payout method to get started."
              action={
                <button
                  type="button"
                  className={styles.buttonPrimary}
                  onClick={() => notify({ title: 'Connect payout', description: 'Payout setup flow coming soon.', variant: 'info', duration: 3000 })}
                >
                  Connect Payout Method
                </button>
              }
            />
          </ScrollReveal>
        </div>
      </main>
    </PageTransition>
  );
};

export default WalletPage;
