// @AI-HINT: Comprehensive wallet management client with balance, transactions, deposit/withdraw
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { useToaster } from '@/app/components/Toast/ToasterProvider';
import commonStyles from './Wallet.common.module.css';
import lightStyles from './Wallet.light.module.css';
import darkStyles from './Wallet.dark.module.css';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'earning';
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
  reference?: string;
}

interface WalletBalance {
  available: number;
  pending: number;
  total: number;
  currency: string;
}

interface PayoutMethod {
  id: string;
  type: 'bank' | 'paypal' | 'wise';
  name: string;
  last4: string;
  isDefault: boolean;
}

// Mock data for demonstration
const mockBalance: WalletBalance = {
  available: 12450.00,
  pending: 2500.00,
  total: 14950.00,
  currency: 'USD'
};

const mockTransactions: Transaction[] = [
  {
    id: 'txn-001',
    type: 'earning',
    amount: 2500.00,
    description: 'Project: E-commerce Platform',
    status: 'completed',
    createdAt: '2024-12-05T14:30:00Z',
    reference: 'PROJ-2024-001'
  },
  {
    id: 'txn-002',
    type: 'withdrawal',
    amount: -1000.00,
    description: 'Withdrawal to Bank Account ****4521',
    status: 'completed',
    createdAt: '2024-12-04T10:00:00Z',
    reference: 'WD-2024-102'
  },
  {
    id: 'txn-003',
    type: 'earning',
    amount: 750.00,
    description: 'Project: Mobile App UI Design',
    status: 'pending',
    createdAt: '2024-12-03T16:45:00Z',
    reference: 'PROJ-2024-002'
  },
  {
    id: 'txn-004',
    type: 'deposit',
    amount: 500.00,
    description: 'Added funds via Credit Card',
    status: 'completed',
    createdAt: '2024-12-02T09:15:00Z',
    reference: 'DEP-2024-045'
  },
  {
    id: 'txn-005',
    type: 'payment',
    amount: -350.00,
    description: 'Platform fee for December',
    status: 'completed',
    createdAt: '2024-12-01T00:00:00Z',
    reference: 'FEE-2024-012'
  }
];

const mockPayoutMethods: PayoutMethod[] = [
  { id: 'pm-1', type: 'bank', name: 'Chase Bank', last4: '4521', isDefault: true },
  { id: 'pm-2', type: 'paypal', name: 'PayPal', last4: 'gmail.com', isDefault: false }
];

type TabType = 'overview' | 'transactions' | 'withdraw' | 'deposit' | 'settings';

export default function WalletClient() {
  const { resolvedTheme } = useTheme();
  const { notify } = useToaster();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [balance, setBalance] = useState<WalletBalance>(mockBalance);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>(mockPayoutMethods);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>(mockPayoutMethods[0]?.id || '');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !resolvedTheme) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: balance.currency
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'earning': return '💰';
      case 'withdrawal': return '🏦';
      case 'deposit': return '💳';
      case 'payment': return '📋';
      case 'refund': return '↩️';
      default: return '💵';
    }
  };

  const getStatusBadge = (status: Transaction['status']) => {
    const baseClass = commonStyles.statusBadge;
    switch (status) {
      case 'completed':
        return cn(baseClass, themeStyles.statusCompleted);
      case 'pending':
        return cn(baseClass, themeStyles.statusPending);
      case 'failed':
        return cn(baseClass, themeStyles.statusFailed);
      default:
        return baseClass;
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      notify({ title: 'Invalid amount', description: 'Please enter a valid withdrawal amount.', variant: 'error', duration: 3000 });
      return;
    }
    if (amount > balance.available) {
      notify({ title: 'Insufficient funds', description: 'Withdrawal amount exceeds available balance.', variant: 'error', duration: 3000 });
      return;
    }

    setIsProcessing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setBalance(prev => ({
      ...prev,
      available: prev.available - amount,
      total: prev.total - amount
    }));
    
    setTransactions(prev => [{
      id: `txn-${Date.now()}`,
      type: 'withdrawal',
      amount: -amount,
      description: `Withdrawal to ${payoutMethods.find(m => m.id === selectedMethod)?.name || 'Bank Account'}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      reference: `WD-${Date.now()}`
    }, ...prev]);

    setWithdrawAmount('');
    setIsProcessing(false);
    notify({ title: 'Withdrawal initiated', description: `${formatCurrency(amount)} will be sent to your account within 1-3 business days.`, variant: 'success', duration: 5000 });
    setActiveTab('transactions');
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      notify({ title: 'Invalid amount', description: 'Please enter a valid deposit amount.', variant: 'error', duration: 3000 });
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setBalance(prev => ({
      ...prev,
      available: prev.available + amount,
      total: prev.total + amount
    }));
    
    setTransactions(prev => [{
      id: `txn-${Date.now()}`,
      type: 'deposit',
      amount: amount,
      description: 'Added funds via Credit Card',
      status: 'completed',
      createdAt: new Date().toISOString(),
      reference: `DEP-${Date.now()}`
    }, ...prev]);

    setDepositAmount('');
    setIsProcessing(false);
    notify({ title: 'Deposit successful', description: `${formatCurrency(amount)} has been added to your wallet.`, variant: 'success', duration: 5000 });
    setActiveTab('overview');
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'transactions', label: 'Transactions', icon: '📜' },
    { id: 'withdraw', label: 'Withdraw', icon: '🏦' },
    { id: 'deposit', label: 'Add Funds', icon: '💳' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <PageTransition>
      <main className={cn(commonStyles.page, themeStyles.page)}>
        <div className={commonStyles.container}>
          {/* Header */}
          <ScrollReveal>
            <header className={commonStyles.header}>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Wallet</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Manage your balance, transactions, and payout methods
              </p>
            </header>
          </ScrollReveal>

          {/* Balance Cards */}
          <ScrollReveal delay={0.1}>
            <div className={commonStyles.balanceGrid}>
              <div className={cn(commonStyles.balanceCard, commonStyles.balanceCardPrimary, themeStyles.balanceCardPrimary)}>
                <span className={commonStyles.balanceLabel}>Available Balance</span>
                <span className={commonStyles.balanceAmount}>{formatCurrency(balance.available)}</span>
                <span className={commonStyles.balanceSubtext}>Ready to withdraw</span>
              </div>
              <div className={cn(commonStyles.balanceCard, themeStyles.balanceCard)}>
                <span className={cn(commonStyles.balanceLabel, themeStyles.balanceLabel)}>Pending</span>
                <span className={cn(commonStyles.balanceAmountSecondary, themeStyles.balanceAmount)}>{formatCurrency(balance.pending)}</span>
                <span className={cn(commonStyles.balanceSubtext, themeStyles.balanceSubtext)}>In escrow or processing</span>
              </div>
              <div className={cn(commonStyles.balanceCard, themeStyles.balanceCard)}>
                <span className={cn(commonStyles.balanceLabel, themeStyles.balanceLabel)}>Total Earnings</span>
                <span className={cn(commonStyles.balanceAmountSecondary, themeStyles.balanceAmount)}>{formatCurrency(balance.total)}</span>
                <span className={cn(commonStyles.balanceSubtext, themeStyles.balanceSubtext)}>This month</span>
              </div>
            </div>
          </ScrollReveal>

          {/* Tabs */}
          <ScrollReveal delay={0.2}>
            <div className={cn(commonStyles.tabsContainer, themeStyles.tabsContainer)}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    commonStyles.tab,
                    themeStyles.tab,
                    activeTab === tab.id && commonStyles.tabActive,
                    activeTab === tab.id && themeStyles.tabActive
                  )}
                >
                  <span className={commonStyles.tabIcon}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </ScrollReveal>

          {/* Tab Content */}
          <ScrollReveal delay={0.3}>
            <div className={cn(commonStyles.content, themeStyles.content)}>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className={commonStyles.overviewContent}>
                  <div className={commonStyles.quickActions}>
                    <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Quick Actions</h3>
                    <div className={commonStyles.actionButtons}>
                      <button 
                        onClick={() => setActiveTab('withdraw')} 
                        className={cn(commonStyles.actionButton, themeStyles.actionButton)}
                      >
                        <span className={commonStyles.actionIcon}>🏦</span>
                        <span>Withdraw Funds</span>
                      </button>
                      <button 
                        onClick={() => setActiveTab('deposit')} 
                        className={cn(commonStyles.actionButton, themeStyles.actionButton)}
                      >
                        <span className={commonStyles.actionIcon}>💳</span>
                        <span>Add Funds</span>
                      </button>
                      <button 
                        onClick={() => setActiveTab('settings')} 
                        className={cn(commonStyles.actionButton, themeStyles.actionButton)}
                      >
                        <span className={commonStyles.actionIcon}>⚙️</span>
                        <span>Manage Payouts</span>
                      </button>
                    </div>
                  </div>

                  <div className={commonStyles.recentSection}>
                    <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Recent Activity</h3>
                    <div className={commonStyles.transactionList}>
                      {transactions.slice(0, 3).map(txn => (
                        <div key={txn.id} className={cn(commonStyles.transactionItem, themeStyles.transactionItem)}>
                          <span className={commonStyles.transactionIcon}>{getTransactionIcon(txn.type)}</span>
                          <div className={commonStyles.transactionDetails}>
                            <span className={cn(commonStyles.transactionDesc, themeStyles.transactionDesc)}>{txn.description}</span>
                            <span className={cn(commonStyles.transactionDate, themeStyles.transactionDate)}>{formatDate(txn.createdAt)}</span>
                          </div>
                          <div className={commonStyles.transactionRight}>
                            <span className={cn(
                              commonStyles.transactionAmount,
                              txn.amount > 0 ? themeStyles.amountPositive : themeStyles.amountNegative
                            )}>
                              {txn.amount > 0 ? '+' : ''}{formatCurrency(txn.amount)}
                            </span>
                            <span className={getStatusBadge(txn.status)}>{txn.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => setActiveTab('transactions')} 
                      className={cn(commonStyles.viewAllButton, themeStyles.viewAllButton)}
                    >
                      View All Transactions →
                    </button>
                  </div>
                </div>
              )}

              {/* Transactions Tab */}
              {activeTab === 'transactions' && (
                <div className={commonStyles.transactionsContent}>
                  <div className={commonStyles.filterBar}>
                    <select className={cn(commonStyles.filterSelect, themeStyles.filterSelect)}>
                      <option value="all">All Types</option>
                      <option value="earning">Earnings</option>
                      <option value="withdrawal">Withdrawals</option>
                      <option value="deposit">Deposits</option>
                      <option value="payment">Payments</option>
                    </select>
                    <select className={cn(commonStyles.filterSelect, themeStyles.filterSelect)}>
                      <option value="all">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  <div className={commonStyles.transactionList}>
                    {transactions.map(txn => (
                      <div key={txn.id} className={cn(commonStyles.transactionItem, themeStyles.transactionItem)}>
                        <span className={commonStyles.transactionIcon}>{getTransactionIcon(txn.type)}</span>
                        <div className={commonStyles.transactionDetails}>
                          <span className={cn(commonStyles.transactionDesc, themeStyles.transactionDesc)}>{txn.description}</span>
                          <span className={cn(commonStyles.transactionDate, themeStyles.transactionDate)}>
                            {formatDate(txn.createdAt)} • {txn.reference}
                          </span>
                        </div>
                        <div className={commonStyles.transactionRight}>
                          <span className={cn(
                            commonStyles.transactionAmount,
                            txn.amount > 0 ? themeStyles.amountPositive : themeStyles.amountNegative
                          )}>
                            {txn.amount > 0 ? '+' : ''}{formatCurrency(txn.amount)}
                          </span>
                          <span className={getStatusBadge(txn.status)}>{txn.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Withdraw Tab */}
              {activeTab === 'withdraw' && (
                <div className={commonStyles.formContent}>
                  <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Withdraw Funds</h3>
                  <p className={cn(commonStyles.formSubtitle, themeStyles.formSubtitle)}>
                    Available balance: <strong>{formatCurrency(balance.available)}</strong>
                  </p>
                  
                  <div className={commonStyles.formGroup}>
                    <label className={cn(commonStyles.formLabel, themeStyles.formLabel)}>Amount</label>
                    <div className={commonStyles.inputWrapper}>
                      <span className={commonStyles.currencyPrefix}>$</span>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="0.00"
                        className={cn(commonStyles.formInput, themeStyles.formInput)}
                        min="1"
                        max={balance.available}
                      />
                    </div>
                    <div className={commonStyles.quickAmounts}>
                      {[100, 500, 1000, balance.available].map(amt => (
                        <button
                          key={amt}
                          onClick={() => setWithdrawAmount(amt.toString())}
                          className={cn(commonStyles.quickAmountBtn, themeStyles.quickAmountBtn)}
                        >
                          {amt === balance.available ? 'Max' : formatCurrency(amt)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={commonStyles.formGroup}>
                    <label className={cn(commonStyles.formLabel, themeStyles.formLabel)}>Payout Method</label>
                    <div className={commonStyles.payoutMethods}>
                      {payoutMethods.map(method => (
                        <label
                          key={method.id}
                          className={cn(
                            commonStyles.payoutMethod,
                            themeStyles.payoutMethod,
                            selectedMethod === method.id && commonStyles.payoutMethodSelected,
                            selectedMethod === method.id && themeStyles.payoutMethodSelected
                          )}
                        >
                          <input
                            type="radio"
                            name="payoutMethod"
                            value={method.id}
                            checked={selectedMethod === method.id}
                            onChange={(e) => setSelectedMethod(e.target.value)}
                            className={commonStyles.radioInput}
                          />
                          <span className={commonStyles.payoutIcon}>
                            {method.type === 'bank' ? '🏦' : method.type === 'paypal' ? '💳' : '🌐'}
                          </span>
                          <div className={commonStyles.payoutDetails}>
                            <span className={cn(commonStyles.payoutName, themeStyles.payoutName)}>{method.name}</span>
                            <span className={cn(commonStyles.payoutLast4, themeStyles.payoutLast4)}>****{method.last4}</span>
                          </div>
                          {method.isDefault && <span className={commonStyles.defaultBadge}>Default</span>}
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleWithdraw}
                    disabled={isProcessing || !withdrawAmount}
                    className={cn(commonStyles.submitButton, themeStyles.submitButton)}
                  >
                    {isProcessing ? 'Processing...' : 'Withdraw Funds'}
                  </button>
                  
                  <p className={cn(commonStyles.disclaimer, themeStyles.disclaimer)}>
                    Withdrawals typically take 1-3 business days to process.
                  </p>
                </div>
              )}

              {/* Deposit Tab */}
              {activeTab === 'deposit' && (
                <div className={commonStyles.formContent}>
                  <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Add Funds</h3>
                  <p className={cn(commonStyles.formSubtitle, themeStyles.formSubtitle)}>
                    Add funds to your wallet for project payments
                  </p>
                  
                  <div className={commonStyles.formGroup}>
                    <label className={cn(commonStyles.formLabel, themeStyles.formLabel)}>Amount</label>
                    <div className={commonStyles.inputWrapper}>
                      <span className={commonStyles.currencyPrefix}>$</span>
                      <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="0.00"
                        className={cn(commonStyles.formInput, themeStyles.formInput)}
                        min="10"
                      />
                    </div>
                    <div className={commonStyles.quickAmounts}>
                      {[50, 100, 500, 1000].map(amt => (
                        <button
                          key={amt}
                          onClick={() => setDepositAmount(amt.toString())}
                          className={cn(commonStyles.quickAmountBtn, themeStyles.quickAmountBtn)}
                        >
                          {formatCurrency(amt)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={cn(commonStyles.paymentInfo, themeStyles.paymentInfo)}>
                    <span className={commonStyles.paymentIcon}>💳</span>
                    <span>Credit/Debit Card ending in ****4242</span>
                    <button className={cn(commonStyles.changeButton, themeStyles.changeButton)}>Change</button>
                  </div>

                  <button
                    onClick={handleDeposit}
                    disabled={isProcessing || !depositAmount}
                    className={cn(commonStyles.submitButton, themeStyles.submitButton)}
                  >
                    {isProcessing ? 'Processing...' : 'Add Funds'}
                  </button>
                  
                  <p className={cn(commonStyles.disclaimer, themeStyles.disclaimer)}>
                    Funds will be available immediately after processing.
                  </p>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className={commonStyles.settingsContent}>
                  <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Payout Methods</h3>
                  
                  <div className={commonStyles.payoutMethodsList}>
                    {payoutMethods.map(method => (
                      <div key={method.id} className={cn(commonStyles.payoutMethodCard, themeStyles.payoutMethodCard)}>
                        <span className={commonStyles.payoutIcon}>
                          {method.type === 'bank' ? '🏦' : method.type === 'paypal' ? '💳' : '🌐'}
                        </span>
                        <div className={commonStyles.payoutDetails}>
                          <span className={cn(commonStyles.payoutName, themeStyles.payoutName)}>{method.name}</span>
                          <span className={cn(commonStyles.payoutLast4, themeStyles.payoutLast4)}>****{method.last4}</span>
                        </div>
                        {method.isDefault && <span className={commonStyles.defaultBadge}>Default</span>}
                        <div className={commonStyles.payoutActions}>
                          <button className={cn(commonStyles.actionLink, themeStyles.actionLink)}>Edit</button>
                          <button className={cn(commonStyles.actionLink, commonStyles.actionLinkDanger)}>Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button className={cn(commonStyles.addMethodButton, themeStyles.addMethodButton)}>
                    + Add Payout Method
                  </button>

                  <div className={commonStyles.settingsSection}>
                    <h4 className={cn(commonStyles.settingsSubtitle, themeStyles.settingsSubtitle)}>Auto-Payout</h4>
                    <div className={cn(commonStyles.settingRow, themeStyles.settingRow)}>
                      <div>
                        <span className={themeStyles.settingLabel}>Automatic withdrawals</span>
                        <p className={cn(commonStyles.settingDesc, themeStyles.settingDesc)}>
                          Automatically withdraw funds when balance exceeds a threshold
                        </p>
                      </div>
                      <label className={commonStyles.toggle}>
                        <input type="checkbox" />
                        <span className={commonStyles.toggleSlider}></span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>
        </div>
      </main>
    </PageTransition>
  );
}
