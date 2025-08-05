// @AI-HINT: This is the AI Monitoring page for admins to oversee the platform's AI systems. All styles are per-component only.
'use client';

import React, { useState, useEffect } from 'react';
import DashboardWidget from '@/app/components/DashboardWidget/DashboardWidget';
import commonStyles from './AIMonitoring.common.module.css';
import lightStyles from './AIMonitoring.light.module.css';
import darkStyles from './AIMonitoring.dark.module.css';
import { useTheme } from '@/app/contexts/ThemeContext';

// @AI-HINT: This is the AI Monitoring page for admins to oversee the platform's AI systems. All styles are per-component only. Now fully theme-switchable using global theme context.

interface AIStats {
  rankModelAccuracy: string;
  fraudDetections: number;
  priceEstimations: number;
  chatbotSessions: number;
}

interface FraudAlert {
  id: string;
  referenceId: string;
  reason: string;
  timestamp: string;
}

interface AIData {
  aiStats: AIStats;
  recentFraudAlerts: FraudAlert[];
}

const AIMonitoring: React.FC = () => {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
  const [data, setData] = useState<AIData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/ai-monitoring');
        if (!response.ok) {
          throw new Error('Failed to fetch AI monitoring data');
        }
        const result: AIData = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className={`AIMonitoring-status AIMonitoring-status--${theme}`}>Loading AI monitoring data...</div>;
  }

  if (error) {
    return <div className={`AIMonitoring-status AIMonitoring-status--error AIMonitoring-status--${theme}`}>Error: {error}</div>;
  }

  if (!data) {
    return null; // Or some other placeholder
  }

  const { aiStats, recentFraudAlerts } = data;

  return (
    <div className={`AIMonitoring AIMonitoring--${theme}`}>
      <header className="AIMonitoring-header">
        <h1>AI Systems Monitoring</h1>
        <p>Oversee the performance and status of platform AI models.</p>
      </header>

      <div className="AIMonitoring-widgets">
        <DashboardWidget title="Rank Model Accuracy" value={aiStats.rankModelAccuracy} />
        <DashboardWidget title="Fraud Detections (24h)" value={aiStats.fraudDetections.toLocaleString()} />
        <DashboardWidget title="Price Estimations (24h)" value={aiStats.priceEstimations.toLocaleString()} />
        <DashboardWidget title="Chatbot Sessions (24h)" value={aiStats.chatbotSessions.toLocaleString()} />
      </div>

      <div className={`Alerts-list-card Alerts-list-card--${theme}`}>
        <h2>Recent Fraud Alerts</h2>
        <div className="Alerts-list">
          {recentFraudAlerts.map(alert => (
            <div key={alert.id} className={`Alert-item Alert-item--${theme}`}>
              <div className="Alert-icon">⚠️</div>
              <div className="Alert-details">
                <p>{alert.reason}</p>
                <small>Reference: {alert.referenceId} | Timestamp: {alert.timestamp}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIMonitoring;
