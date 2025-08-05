// @AI-HINT: This component displays a grid of key performance metrics (KPIs). It's designed for high-impact visual data representation, a hallmark of investor-grade SaaS dashboards. It's fully responsive and themed.

import React from 'react';
import { DashboardMetric } from '../../types';
import './DashboardMetrics.common.css';
import './DashboardMetrics.light.css';
import './DashboardMetrics.dark.css';

interface DashboardMetricsProps {
  metrics: DashboardMetric[];
}

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ metrics }) => {
  return (
    <div className="DashboardMetrics">
      {metrics.map((metric) => (
        <div key={metric.id} className="DashboardMetricCard">
          <div className="MetricCard-icon-wrapper">
            <metric.icon className="MetricCard-icon" />
          </div>
          <div className="MetricCard-content">
            <span className="MetricCard-label">{metric.label}</span>
            <span className="MetricCard-value">{metric.value}</span>
            {metric.change && (
              <span className={`MetricCard-change MetricCard-change--${metric.changeType}`}>
                {metric.change}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardMetrics;
