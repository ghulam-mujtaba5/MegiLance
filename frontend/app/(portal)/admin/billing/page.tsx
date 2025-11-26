// @AI-HINT: Admin billing management - subscriptions, plans, revenue analytics
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './Billing.common.module.css';
import lightStyles from './Billing.light.module.css';
import darkStyles from './Billing.dark.module.css';

interface Subscription {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface RevenueStats {
  mrr: number;
  arr: number;
  totalRevenue: number;
  activeSubscriptions: number;
  churnRate: number;
  averageRevenuePerUser: number;
  trialConversionRate: number;
  growthRate: number;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  subscriberCount: number;
  isPopular: boolean;
}

export default function AdminBillingPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'plans' | 'invoices'>('overview');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    setMounted(true);
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      // Mock data
      const mockStats: RevenueStats = {
        mrr: 47850,
        arr: 574200,
        totalRevenue: 1247000,
        activeSubscriptions: 1245,
        churnRate: 2.3,
        averageRevenuePerUser: 38.43,
        trialConversionRate: 24.5,
        growthRate: 12.8
      };

      const mockPlans: Plan[] = [
        { id: 'free', name: 'Free', price: 0, billingCycle: 'monthly', features: ['5 proposals/month', 'Basic profile', 'Community support'], subscriberCount: 8450, isPopular: false },
        { id: 'starter', name: 'Starter', price: 19, billingCycle: 'monthly', features: ['25 proposals/month', 'Featured profile', 'Priority support', 'Analytics'], subscriberCount: 890, isPopular: false },
        { id: 'professional', name: 'Professional', price: 49, billingCycle: 'monthly', features: ['Unlimited proposals', 'Top search results', 'Dedicated support', 'Advanced analytics', 'API access'], subscriberCount: 312, isPopular: true },
        { id: 'enterprise', name: 'Enterprise', price: 199, billingCycle: 'monthly', features: ['Everything in Pro', 'Custom integrations', 'SLA guarantee', 'Account manager', 'White-label options'], subscriberCount: 43, isPopular: false }
      ];

      const mockSubscriptions: Subscription[] = [
        { id: 'sub_001', userId: 'user_123', userName: 'John Smith', userEmail: 'john@example.com', plan: 'professional', status: 'active', amount: 49, currency: 'USD', billingCycle: 'monthly', currentPeriodStart: '2025-01-01', currentPeriodEnd: '2025-02-01', cancelAtPeriodEnd: false },
        { id: 'sub_002', userId: 'user_456', userName: 'Sarah Johnson', userEmail: 'sarah@example.com', plan: 'enterprise', status: 'active', amount: 199, currency: 'USD', billingCycle: 'monthly', currentPeriodStart: '2025-01-15', currentPeriodEnd: '2025-02-15', cancelAtPeriodEnd: false },
        { id: 'sub_003', userId: 'user_789', userName: 'Mike Wilson', userEmail: 'mike@example.com', plan: 'starter', status: 'past_due', amount: 19, currency: 'USD', billingCycle: 'monthly', currentPeriodStart: '2025-01-10', currentPeriodEnd: '2025-02-10', cancelAtPeriodEnd: false },
        { id: 'sub_004', userId: 'user_012', userName: 'Emily Davis', userEmail: 'emily@example.com', plan: 'professional', status: 'trialing', amount: 49, currency: 'USD', billingCycle: 'monthly', currentPeriodStart: '2025-01-20', currentPeriodEnd: '2025-02-20', cancelAtPeriodEnd: false },
        { id: 'sub_005', userId: 'user_345', userName: 'Alex Chen', userEmail: 'alex@example.com', plan: 'starter', status: 'cancelled', amount: 19, currency: 'USD', billingCycle: 'monthly', currentPeriodStart: '2025-01-05', currentPeriodEnd: '2025-02-05', cancelAtPeriodEnd: true }
      ];

      setStats(mockStats);
      setPlans(mockPlans);
      setSubscriptions(mockSubscriptions);
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active': return commonStyles.statusActive;
      case 'trialing': return commonStyles.statusTrialing;
      case 'past_due': return commonStyles.statusPastDue;
      case 'cancelled': return commonStyles.statusCancelled;
      default: return '';
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sub.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>Billing & Subscriptions</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Manage subscriptions, plans, and revenue analytics
          </p>
        </div>
        <button className={cn(commonStyles.exportButton, themeStyles.exportButton)}>
          Export Report
        </button>
      </div>

      {loading ? (
        <div className={cn(commonStyles.loading, themeStyles.loading)}>Loading billing data...</div>
      ) : (
        <>
          {/* Revenue Stats */}
          {stats && (
            <div className={commonStyles.statsGrid}>
              <div className={cn(commonStyles.statCard, themeStyles.statCard, commonStyles.statHighlight)}>
                <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Monthly Recurring Revenue</div>
                <div className={cn(commonStyles.statValue, themeStyles.statValue)}>${stats.mrr.toLocaleString()}</div>
                <div className={cn(commonStyles.statChange, commonStyles.positive)}>+{stats.growthRate}% vs last month</div>
              </div>
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Annual Recurring Revenue</div>
                <div className={cn(commonStyles.statValue, themeStyles.statValue)}>${stats.arr.toLocaleString()}</div>
              </div>
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Active Subscriptions</div>
                <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.activeSubscriptions.toLocaleString()}</div>
              </div>
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Churn Rate</div>
                <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.churnRate}%</div>
              </div>
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>ARPU</div>
                <div className={cn(commonStyles.statValue, themeStyles.statValue)}>${stats.averageRevenuePerUser}</div>
              </div>
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Trial Conversion</div>
                <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.trialConversionRate}%</div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className={cn(commonStyles.tabs, themeStyles.tabs)}>
            {['overview', 'subscriptions', 'plans', 'invoices'].map((tab) => (
              <button
                key={tab}
                className={cn(commonStyles.tab, themeStyles.tab, activeTab === tab && commonStyles.tabActive, activeTab === tab && themeStyles.tabActive)}
                onClick={() => setActiveTab(tab as typeof activeTab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className={commonStyles.overviewGrid}>
              <div className={cn(commonStyles.chartCard, themeStyles.chartCard)}>
                <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>Revenue Trend</h3>
                <div className={commonStyles.chartPlaceholder}>
                  <div className={cn(commonStyles.chartBar, themeStyles.chartBar)} style={{ height: '60%' }}></div>
                  <div className={cn(commonStyles.chartBar, themeStyles.chartBar)} style={{ height: '75%' }}></div>
                  <div className={cn(commonStyles.chartBar, themeStyles.chartBar)} style={{ height: '65%' }}></div>
                  <div className={cn(commonStyles.chartBar, themeStyles.chartBar)} style={{ height: '80%' }}></div>
                  <div className={cn(commonStyles.chartBar, themeStyles.chartBar)} style={{ height: '90%' }}></div>
                  <div className={cn(commonStyles.chartBar, themeStyles.chartBar)} style={{ height: '100%' }}></div>
                </div>
                <div className={cn(commonStyles.chartLabels, themeStyles.chartLabels)}>
                  <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
                </div>
              </div>
              <div className={cn(commonStyles.chartCard, themeStyles.chartCard)}>
                <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>Plan Distribution</h3>
                <div className={commonStyles.planDistribution}>
                  {plans.map(plan => (
                    <div key={plan.id} className={commonStyles.planBar}>
                      <div className={commonStyles.planBarHeader}>
                        <span className={cn(commonStyles.planName, themeStyles.planName)}>{plan.name}</span>
                        <span className={cn(commonStyles.planCount, themeStyles.planCount)}>{plan.subscriberCount}</span>
                      </div>
                      <div className={cn(commonStyles.planBarTrack, themeStyles.planBarTrack)}>
                        <div 
                          className={cn(commonStyles.planBarFill, themeStyles.planBarFill)}
                          style={{ width: `${(plan.subscriberCount / 8450) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Subscriptions Tab */}
          {activeTab === 'subscriptions' && (
            <div className={cn(commonStyles.panel, themeStyles.panel)}>
              <div className={commonStyles.filters}>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(commonStyles.searchInput, themeStyles.searchInput)}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={cn(commonStyles.select, themeStyles.select)}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="trialing">Trialing</option>
                  <option value="past_due">Past Due</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className={commonStyles.tableWrapper}>
                <table className={commonStyles.table}>
                  <thead>
                    <tr className={cn(commonStyles.tableHeader, themeStyles.tableHeader)}>
                      <th>User</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Amount</th>
                      <th>Period End</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubscriptions.map(sub => (
                      <tr key={sub.id} className={cn(commonStyles.tableRow, themeStyles.tableRow)}>
                        <td>
                          <div className={cn(commonStyles.userName, themeStyles.userName)}>{sub.userName}</div>
                          <div className={cn(commonStyles.userEmail, themeStyles.userEmail)}>{sub.userEmail}</div>
                        </td>
                        <td>
                          <span className={cn(commonStyles.planBadge, themeStyles.planBadge)}>{sub.plan}</span>
                        </td>
                        <td>
                          <span className={cn(commonStyles.statusBadge, getStatusBadgeClass(sub.status))}>
                            {sub.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className={cn(commonStyles.amount, themeStyles.amount)}>
                          ${sub.amount}/{sub.billingCycle === 'monthly' ? 'mo' : 'yr'}
                        </td>
                        <td className={cn(commonStyles.date, themeStyles.date)}>
                          {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                        </td>
                        <td>
                          <button className={cn(commonStyles.actionButton, themeStyles.actionButton)}>
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Plans Tab */}
          {activeTab === 'plans' && (
            <div className={commonStyles.plansGrid}>
              {plans.map(plan => (
                <div key={plan.id} className={cn(commonStyles.planCard, themeStyles.planCard, plan.isPopular && commonStyles.popularPlan)}>
                  {plan.isPopular && <div className={commonStyles.popularBadge}>Most Popular</div>}
                  <h3 className={cn(commonStyles.planTitle, themeStyles.planTitle)}>{plan.name}</h3>
                  <div className={cn(commonStyles.planPrice, themeStyles.planPrice)}>
                    <span className={commonStyles.priceAmount}>${plan.price}</span>
                    <span className={commonStyles.pricePeriod}>/month</span>
                  </div>
                  <div className={cn(commonStyles.subscribers, themeStyles.subscribers)}>
                    {plan.subscriberCount.toLocaleString()} subscribers
                  </div>
                  <ul className={commonStyles.featureList}>
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className={cn(commonStyles.feature, themeStyles.feature)}>
                        <span className={commonStyles.checkIcon}>✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button className={cn(commonStyles.editPlanButton, themeStyles.editPlanButton)}>
                    Edit Plan
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div className={cn(commonStyles.panel, themeStyles.panel)}>
              <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                <div className={commonStyles.emptyIcon}>📄</div>
                <h3>Invoice Management</h3>
                <p>View and manage all platform invoices here. Integration with payment provider pending.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
