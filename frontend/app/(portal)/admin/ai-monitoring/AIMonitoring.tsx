// @AI-HINT: Admin AI Monitoring page. Theme-aware, accessible, animated KPIs, SVG charts, and logs list.
'use client';

import React, { useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal, StaggerContainer } from '@/components/Animations';
import { useAdminData } from '@/hooks/useAdmin';
import common from './AIMonitoring.common.module.css';
import light from './AIMonitoring.light.module.css';
import dark from './AIMonitoring.dark.module.css';

interface KPI { id: string; label: string; value: string; }
interface LogRow { id: string; ts: string; level: 'info' | 'warn' | 'error'; message: string; model: string; latencyMs: number; }

const LEVELS = ['All', 'info', 'warn', 'error'] as const;

const AIMonitoring: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const { ai, loading, error } = useAdminData();

  const kpis: KPI[] = useMemo(() => {
    if (!ai?.aiStats) return [];
    return [
      { id: 'k1', label: 'Rank Model Accuracy', value: ai.aiStats.rankModelAccuracy ?? '0%' },
      { id: 'k2', label: 'Fraud Detections', value: String(ai.aiStats.fraudDetections ?? 0) },
      { id: 'k3', label: 'Price Estimations', value: String(ai.aiStats.priceEstimations ?? 0) },
      { id: 'k4', label: 'Chatbot Sessions', value: String(ai.aiStats.chatbotSessions ?? 0) },
    ];
  }, [ai?.aiStats]);

  const logs: LogRow[] = useMemo(() => {
    if (!Array.isArray(ai?.recentFraudAlerts)) return [];
    return (ai.recentFraudAlerts as any[]).map((l, idx) => ({
      id: String(l.id ?? idx),
      ts: l.timestamp ?? '',
      level: 'warn' as LogRow['level'],
      message: l.reason ?? '',
      model: 'Fraud Detection',
      latencyMs: 0,
    }));
  }, [ai?.recentFraudAlerts]);

  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter(l =>
      (level === 'All' || l.level === level) &&
      (!q || l.message.toLowerCase().includes(q) || l.model.toLowerCase().includes(q))
    );
  }, [logs, query, level]);

  return (
    <PageTransition className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <ScrollReveal className={common.header}>
          <div>
            <h1 className={common.title}>AI Monitoring</h1>
            <p className={cn(common.subtitle, themed.subtitle)}>Track AI usage, latency, errors, and cost. Filter logs by level and search text.</p>
          </div>
          <div className={common.controls} aria-label="AI monitoring controls">
            <label className={common.srOnly} htmlFor="q">Search</label>
            <input id="q" className={cn(common.input, themed.input)} type="search" placeholder="Search logs…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <label className={common.srOnly} htmlFor="level">Level</label>
            <select id="level" className={cn(common.select, themed.select)} value={level} onChange={(e) => setLevel(e.target.value as (typeof LEVELS)[number])}>
              {LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button type="button" className={cn(common.button, themed.button)}>Export Logs</button>
          </div>
        </ScrollReveal>

        <StaggerContainer>
          <ScrollReveal className={common.kpis} aria-label="AI KPIs">
            {loading && <div className={common.skeletonRow} aria-busy="true" />}
            {error && <div className={common.error}>Failed to load AI metrics.</div>}
            {kpis.map(k => (
              <div key={k.id} className={cn(common.card)} tabIndex={0} aria-labelledby={`kpi-${k.id}-label`}>
                <div id={`kpi-${k.id}-label`} className={cn(common.cardTitle, themed.cardTitle)}>{k.label}</div>
                <div className={cn(common.metric, themed.metric)}>{k.value}</div>
              </div>
            ))}
          </ScrollReveal>

          <ScrollReveal className={common.grid}>
            <div className={cn(common.panel, themed.panel)} aria-label="Latency chart">
              <div className={cn(common.cardTitle, themed.cardTitle)}>Latency (ms)</div>
              {/* Inline SVG area chart */}
              <svg width="100%" height="180" viewBox="0 0 300 180" preserveAspectRatio="none" role="img" aria-label="Latency over time">
                <desc>Area chart showing latency over time</desc>
                <rect x="0" y="0" width="300" height="180" fill="transparent" />
                <polyline points="0,140 30,120 60,125 90,100 120,110 150,90 180,95 210,80 240,100 270,85 300,92" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.85" />
              </svg>
            </div>

            <div className={cn(common.panel, themed.panel)} aria-label="Error rate">
              <div className={cn(common.cardTitle, themed.cardTitle)}>Error Rate</div>
              <svg width="100%" height="180" viewBox="0 0 300 180" preserveAspectRatio="none" role="img" aria-label="Error rate">
                <desc>Bar chart of error rate</desc>
                {([5,3,4,2,6,4,3] as const).map((h, i) => (
                  <rect key={i} x={15 + i * 40} y={160 - h * 20} width="24" height={h * 20} rx="3" ry="3" fill="currentColor" opacity="0.8" />
                ))}
              </svg>
            </div>
          </ScrollReveal>

          <ScrollReveal className={cn(common.panel, themed.panel)} aria-label="Recent logs">
            <div className={cn(common.cardTitle, themed.cardTitle)}>Recent Logs</div>
            {loading && <div className={common.skeletonRow} aria-busy="true" />}
            {error && <div className={common.error}>Failed to load logs.</div>}
            <div className={cn(common.list)} role="list">
              {filtered.map(l => (
                <div key={l.id} role="listitem" className={cn(common.item)}>
                  <div>{l.ts} — [{l.level.toUpperCase()}] {l.model}</div>
                  <div className={common.meta}>{l.message} • {l.latencyMs}ms</div>
                </div>
              ))}
            </div>
            {filtered.length === 0 && !loading && (
              <div role="status" aria-live="polite">No logs match your filters.</div>
            )}
          </ScrollReveal>
        </StaggerContainer>
      </div>
    </PageTransition>
  );
};

export default AIMonitoring;
