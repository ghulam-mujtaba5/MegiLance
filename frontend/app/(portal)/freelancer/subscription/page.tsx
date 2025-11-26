// @AI-HINT: Subscription Management page - View and manage subscription plans
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './Subscription.common.module.css';
import lightStyles from './Subscription.light.module.css';
import darkStyles from './Subscription.dark.module.css';

interface Plan {
  id: string;
  name: string;
  tier: 'free' | 'starter' | 'professional' | 'enterprise';
  price: number;
  billingPeriod: 'monthly' | 'yearly';
  features: string[];
  limits: {
    projects: number;
    proposals: number;
    storage: string;
    support: string;
  };
  popular?: boolean;
}

interface Subscription {
  id: string;
  plan: Plan;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface BillingHistory {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  invoiceUrl?: string;
}

export default function SubscriptionPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'plans' | 'billing'>('plans');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    setMounted(true);
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    setLoading(true);
    try {
      const mockPlans: Plan[] = [
        {
          id: 'free',
          name: 'Free',
          tier: 'free',
          price: 0,
          billingPeriod: 'monthly',
          features: ['5 proposals/month', '1 active project', 'Basic support', 'Standard profile'],
          limits: { projects: 1, proposals: 5, storage: '100MB', support: 'Community' }
        },
        {
          id: 'starter',
          name: 'Starter',
          tier: 'starter',
          price: 19,
          billingPeriod: 'monthly',
          features: ['25 proposals/month', '5 active projects', 'Email support', 'Featured profile', 'Analytics dashboard'],
          limits: { projects: 5, proposals: 25, storage: '5GB', support: 'Email' }
        },
        {
          id: 'professional',
          name: 'Professional',
          tier: 'professional',
          price: 49,
          billingPeriod: 'monthly',
          popular: true,
          features: ['Unlimited proposals', 'Unlimited projects', 'Priority support', 'Verified badge', 'Advanced analytics', 'Team collaboration', 'API access'],
          limits: { projects: -1, proposals: -1, storage: '50GB', support: 'Priority' }
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          tier: 'enterprise',
          price: 149,
          billingPeriod: 'monthly',
          features: ['Everything in Professional', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee', 'White-label options', 'Bulk invites', 'Advanced security'],
          limits: { projects: -1, proposals: -1, storage: 'Unlimited', support: 'Dedicated' }
        }
      ];

      const mockSubscription: Subscription = {
        id: 'sub_123',
        plan: mockPlans[2], // Professional
        status: 'active',
        currentPeriodStart: '2025-01-01T00:00:00Z',
        currentPeriodEnd: '2025-02-01T00:00:00Z',
        cancelAtPeriodEnd: false
      };

      const mockBillingHistory: BillingHistory[] = [
        { id: 'inv_001', date: '2025-01-01', amount: 49, status: 'paid', invoiceUrl: '#' },
        { id: 'inv_002', date: '2024-12-01', amount: 49, status: 'paid', invoiceUrl: '#' },
        { id: 'inv_003', date: '2024-11-01', amount: 49, status: 'paid', invoiceUrl: '#' },
        { id: 'inv_004', date: '2024-10-01', amount: 49, status: 'paid', invoiceUrl: '#' },
      ];

      setPlans(mockPlans);
      setSubscription(mockSubscription);
      setBillingHistory(mockBillingHistory);
    } catch (error) {
      console.error('Failed to fetch subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getYearlyPrice = (monthlyPrice: number) => {
    return Math.round(monthlyPrice * 12 * 0.8); // 20% discount for yearly
  };

  const handleUpgrade = (planId: string) => {
    console.log('Upgrading to:', planId);
    // API call would go here
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel your subscription?')) {
      setSubscription(prev => prev ? { ...prev, cancelAtPeriodEnd: true } : null);
    }
  };

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>Subscription</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Manage your subscription and billing
          </p>
        </div>
      </div>

      {loading ? (
        <div className={cn(commonStyles.loading, themeStyles.loading)}>Loading subscription data...</div>
      ) : (
        <>
          {/* Current Plan Card */}
          {subscription && (
            <div className={cn(commonStyles.currentPlan, themeStyles.currentPlan)}>
              <div className={commonStyles.currentPlanHeader}>
                <div>
                  <span className={cn(commonStyles.currentPlanLabel, themeStyles.currentPlanLabel)}>
                    Current Plan
                  </span>
                  <h2 className={cn(commonStyles.currentPlanName, themeStyles.currentPlanName)}>
                    {subscription.plan.name}
                  </h2>
                </div>
                <span className={cn(
                  commonStyles.statusBadge,
                  subscription.status === 'active' ? commonStyles.statusActive : commonStyles.statusCanceled
                )}>
                  {subscription.cancelAtPeriodEnd ? 'Canceling' : subscription.status}
                </span>
              </div>
              <div className={cn(commonStyles.currentPlanMeta, themeStyles.currentPlanMeta)}>
                <span>
                  ${subscription.plan.price}/month • Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
              {subscription.cancelAtPeriodEnd && (
                <div className={cn(commonStyles.cancelNotice, themeStyles.cancelNotice)}>
                  Your subscription will end on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className={cn(commonStyles.tabs, themeStyles.tabs)}>
            <button
              className={cn(commonStyles.tab, themeStyles.tab, activeTab === 'plans' && commonStyles.tabActive, activeTab === 'plans' && themeStyles.tabActive)}
              onClick={() => setActiveTab('plans')}
            >
              Plans
            </button>
            <button
              className={cn(commonStyles.tab, themeStyles.tab, activeTab === 'billing' && commonStyles.tabActive, activeTab === 'billing' && themeStyles.tabActive)}
              onClick={() => setActiveTab('billing')}
            >
              Billing History
            </button>
          </div>

          {activeTab === 'plans' && (
            <>
              {/* Billing Toggle */}
              <div className={commonStyles.billingToggle}>
                <button
                  className={cn(commonStyles.toggleOption, themeStyles.toggleOption, billingPeriod === 'monthly' && commonStyles.toggleActive, billingPeriod === 'monthly' && themeStyles.toggleActive)}
                  onClick={() => setBillingPeriod('monthly')}
                >
                  Monthly
                </button>
                <button
                  className={cn(commonStyles.toggleOption, themeStyles.toggleOption, billingPeriod === 'yearly' && commonStyles.toggleActive, billingPeriod === 'yearly' && themeStyles.toggleActive)}
                  onClick={() => setBillingPeriod('yearly')}
                >
                  Yearly <span className={commonStyles.discount}>Save 20%</span>
                </button>
              </div>

              {/* Plans Grid */}
              <div className={commonStyles.plansGrid}>
                {plans.map(plan => {
                  const price = billingPeriod === 'yearly' ? getYearlyPrice(plan.price) : plan.price;
                  const isCurrentPlan = subscription?.plan.id === plan.id;
                  
                  return (
                    <div 
                      key={plan.id} 
                      className={cn(
                        commonStyles.planCard, 
                        themeStyles.planCard,
                        plan.popular && commonStyles.popularPlan,
                        plan.popular && themeStyles.popularPlan,
                        isCurrentPlan && commonStyles.currentPlanCard
                      )}
                    >
                      {plan.popular && (
                        <div className={cn(commonStyles.popularBadge, themeStyles.popularBadge)}>
                          Most Popular
                        </div>
                      )}
                      <h3 className={cn(commonStyles.planName, themeStyles.planName)}>{plan.name}</h3>
                      <div className={commonStyles.planPrice}>
                        <span className={cn(commonStyles.priceAmount, themeStyles.priceAmount)}>
                          ${price}
                        </span>
                        <span className={cn(commonStyles.pricePeriod, themeStyles.pricePeriod)}>
                          /{billingPeriod === 'yearly' ? 'year' : 'month'}
                        </span>
                      </div>
                      <ul className={commonStyles.featuresList}>
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className={cn(commonStyles.feature, themeStyles.feature)}>
                            <span className={commonStyles.checkIcon}>✓</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <button
                        className={cn(
                          commonStyles.planButton,
                          themeStyles.planButton,
                          isCurrentPlan && commonStyles.currentButton
                        )}
                        onClick={() => !isCurrentPlan && handleUpgrade(plan.id)}
                        disabled={isCurrentPlan}
                      >
                        {isCurrentPlan ? 'Current Plan' : plan.price === 0 ? 'Downgrade' : 'Upgrade'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'billing' && (
            <div className={cn(commonStyles.billingPanel, themeStyles.billingPanel)}>
              <div className={commonStyles.billingHeader}>
                <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Payment History</h3>
                <button className={cn(commonStyles.updatePaymentButton, themeStyles.updatePaymentButton)}>
                  Update Payment Method
                </button>
              </div>
              
              <div className={commonStyles.billingTable}>
                <div className={cn(commonStyles.tableHeader, themeStyles.tableHeader)}>
                  <span>Date</span>
                  <span>Amount</span>
                  <span>Status</span>
                  <span>Invoice</span>
                </div>
                {billingHistory.map(item => (
                  <div key={item.id} className={cn(commonStyles.tableRow, themeStyles.tableRow)}>
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                    <span className={cn(commonStyles.amount, themeStyles.amount)}>${item.amount}</span>
                    <span className={cn(
                      commonStyles.paymentStatus,
                      item.status === 'paid' ? commonStyles.statusPaid : commonStyles.statusPending
                    )}>
                      {item.status}
                    </span>
                    <a href={item.invoiceUrl} className={cn(commonStyles.invoiceLink, themeStyles.invoiceLink)}>
                      Download
                    </a>
                  </div>
                ))}
              </div>

              {subscription && !subscription.cancelAtPeriodEnd && (
                <div className={commonStyles.cancelSection}>
                  <button 
                    className={cn(commonStyles.cancelButton, themeStyles.cancelButton)}
                    onClick={handleCancel}
                  >
                    Cancel Subscription
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
