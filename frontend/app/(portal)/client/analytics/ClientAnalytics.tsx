// @AI-HINT: Client Analytics component with spending, project, and freelancer metrics
'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, TrendingDown, DollarSign, Briefcase, Users, Clock, 
  Download, Calendar, ArrowUpRight, ArrowDownRight, Star
} from 'lucide-react';
import Button from '@/app/components/Button/Button';

import common from './ClientAnalytics.common.module.css';
import light from './ClientAnalytics.light.module.css';
import dark from './ClientAnalytics.dark.module.css';

interface MetricCard {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  trend: 'up' | 'down';
}

interface SpendingData {
  month: string;
  amount: number;
}

interface ProjectMetric {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

const MOCK_METRICS: MetricCard[] = [
  { title: 'Total Spent', value: '$24,580', change: 12.5, icon: <DollarSign size={20} />, trend: 'up' },
  { title: 'Active Projects', value: '8', change: 3, icon: <Briefcase size={20} />, trend: 'up' },
  { title: 'Freelancers Hired', value: '24', change: 8, icon: <Users size={20} />, trend: 'up' },
  { title: 'Avg. Project Time', value: '2.3 weeks', change: -15, icon: <Clock size={20} />, trend: 'down' },
];

const SPENDING_DATA: SpendingData[] = [
  { month: 'Jan', amount: 3200 },
  { month: 'Feb', amount: 2800 },
  { month: 'Mar', amount: 4100 },
  { month: 'Apr', amount: 3600 },
  { month: 'May', amount: 5200 },
  { month: 'Jun', amount: 4800 },
];

const PROJECT_METRICS: ProjectMetric[] = [
  { status: 'Completed', count: 12, percentage: 48, color: '#27AE60' },
  { status: 'In Progress', count: 8, percentage: 32, color: '#4573df' },
  { status: 'Pending Review', count: 3, percentage: 12, color: '#ff9800' },
  { status: 'Cancelled', count: 2, percentage: 8, color: '#e81123' },
];

const TOP_FREELANCERS = [
  { name: 'Sarah Chen', role: 'Full Stack Developer', projects: 5, rating: 4.9, spent: '$8,200' },
  { name: 'Mike Johnson', role: 'UI/UX Designer', projects: 3, rating: 4.8, spent: '$4,500' },
  { name: 'Emily Parker', role: 'Mobile Developer', projects: 4, rating: 4.7, spent: '$6,100' },
  { name: 'Alex Rivera', role: 'DevOps Engineer', projects: 2, rating: 5.0, spent: '$3,200' },
];

const ClientAnalytics: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const [dateRange, setDateRange] = useState('6m');

  const maxSpending = Math.max(...SPENDING_DATA.map(d => d.amount));

  return (
    <main className={cn(common.main, themed.main)}>
      <header className={common.header}>
        <div>
          <h1 className={cn(common.title, themed.title)}>Analytics</h1>
          <p className={cn(common.subtitle, themed.subtitle)}>
            Track your spending, project performance, and freelancer collaboration.
          </p>
        </div>
        <div className={common.header_actions}>
          <select 
            className={cn(common.date_select, themed.date_select)}
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            aria-label="Select date range"
            title="Date range filter"
          >
            <option value="1m">Last Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last Year</option>
          </select>
          <Button variant="secondary">
            <Download size={16} /> Export Report
          </Button>
        </div>
      </header>

      {/* Metrics Cards */}
      <div className={common.metrics_grid}>
        {MOCK_METRICS.map((metric, idx) => (
          <div key={idx} className={cn(common.metric_card, themed.metric_card)}>
            <div className={cn(common.metric_icon, themed.metric_icon)}>
              {metric.icon}
            </div>
            <div className={common.metric_content}>
              <span className={cn(common.metric_title, themed.metric_title)}>
                {metric.title}
              </span>
              <span className={cn(common.metric_value, themed.metric_value)}>
                {metric.value}
              </span>
              <span className={cn(
                common.metric_change,
                metric.trend === 'up' ? common.trend_up : common.trend_down,
                metric.trend === 'up' ? themed.trend_up : themed.trend_down
              )}>
                {metric.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(metric.change)}% vs last period
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className={common.charts_grid}>
        {/* Spending Chart */}
        <div className={cn(common.chart_card, themed.chart_card)}>
          <div className={common.chart_header}>
            <h3 className={cn(common.chart_title, themed.chart_title)}>Monthly Spending</h3>
            <span className={cn(common.chart_subtitle, themed.chart_subtitle)}>
              Total: $23,700 this period
            </span>
          </div>
          <div className={common.bar_chart}>
            {SPENDING_DATA.map((data, idx) => (
              <div key={idx} className={common.bar_container}>
                <div 
                  className={cn(common.bar, themed.bar)}
                  data-height={Math.round((data.amount / maxSpending) * 100)}
                >
                  <span className={cn(common.bar_value, themed.bar_value)}>
                    ${(data.amount / 1000).toFixed(1)}k
                  </span>
                </div>
                <span className={cn(common.bar_label, themed.bar_label)}>
                  {data.month}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Project Status */}
        <div className={cn(common.chart_card, themed.chart_card)}>
          <div className={common.chart_header}>
            <h3 className={cn(common.chart_title, themed.chart_title)}>Project Status</h3>
            <span className={cn(common.chart_subtitle, themed.chart_subtitle)}>
              25 total projects
            </span>
          </div>
          <div className={common.project_stats}>
            {PROJECT_METRICS.map((metric, idx) => (
              <div key={idx} className={common.project_stat}>
                <div className={common.stat_header}>
                  <span 
                    className={cn(common.stat_dot, common[`stat_dot_${metric.status.toLowerCase().replace(' ', '_')}`])}
                  />
                  <span className={cn(common.stat_label, themed.stat_label)}>
                    {metric.status}
                  </span>
                  <span className={cn(common.stat_count, themed.stat_count)}>
                    {metric.count}
                  </span>
                </div>
                <div className={cn(common.stat_bar_bg, themed.stat_bar_bg)}>
                  <div 
                    className={cn(common.stat_bar_fill, common[`stat_bar_${metric.status.toLowerCase().replace(' ', '_')}`])}
                    data-width={metric.percentage}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Freelancers */}
      <div className={cn(common.freelancers_section, themed.freelancers_section)}>
        <div className={common.section_header}>
          <h3 className={cn(common.section_title, themed.section_title)}>
            Top Freelancers
          </h3>
          <span className={cn(common.section_subtitle, themed.section_subtitle)}>
            Your most hired collaborators
          </span>
        </div>
        <div className={common.freelancers_list}>
          {TOP_FREELANCERS.map((freelancer, idx) => (
            <div key={idx} className={cn(common.freelancer_card, themed.freelancer_card)}>
              <div className={cn(common.freelancer_avatar, themed.freelancer_avatar)}>
                {freelancer.name.charAt(0)}
              </div>
              <div className={common.freelancer_info}>
                <span className={cn(common.freelancer_name, themed.freelancer_name)}>
                  {freelancer.name}
                </span>
                <span className={cn(common.freelancer_role, themed.freelancer_role)}>
                  {freelancer.role}
                </span>
              </div>
              <div className={common.freelancer_stats}>
                <div className={common.freelancer_stat}>
                  <span className={cn(common.stat_value_sm, themed.stat_value_sm)}>
                    {freelancer.projects}
                  </span>
                  <span className={cn(common.stat_label_sm, themed.stat_label_sm)}>
                    Projects
                  </span>
                </div>
                <div className={common.freelancer_stat}>
                  <span className={cn(common.stat_value_sm, themed.stat_value_sm)}>
                    <Star size={12} fill="currentColor" /> {freelancer.rating}
                  </span>
                  <span className={cn(common.stat_label_sm, themed.stat_label_sm)}>
                    Rating
                  </span>
                </div>
                <div className={common.freelancer_stat}>
                  <span className={cn(common.stat_value_sm, themed.stat_value_sm)}>
                    {freelancer.spent}
                  </span>
                  <span className={cn(common.stat_label_sm, themed.stat_label_sm)}>
                    Spent
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default ClientAnalytics;
