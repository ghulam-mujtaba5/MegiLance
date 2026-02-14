// @AI-HINT: Admin AI Monitoring page. Theme-aware, accessible, animated KPIs, SVG charts, and logs list.
'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal, StaggerContainer } from '@/components/Animations';
import { useAdminData } from '@/hooks/useAdmin';
import common from './AIMonitoring.common.module.css';
import light from './AIMonitoring.light.module.css';
import dark from './AIMonitoring.dark.module.css';

interface KPI { id: string; label: string; value: string; trend?: 'up' | 'down' | 'flat'; delta?: string; }
interface LogRow { id: string; ts: string; level: 'info' | 'warn' | 'error'; message: string; model: string; latencyMs: number; }

const LEVELS = ['All', 'info', 'warn', 'error'] as const;
const TIME_RANGES = ['24h', '7d', '30d'] as const;

// Demo latency data points (ms) per hour/day
const LATENCY_DATA = [142, 128, 135, 110, 118, 95, 102, 88, 105, 92, 98, 85, 112, 104, 96, 89, 108, 115, 99, 91, 87, 94, 101, 97];
const ERROR_RATE_DATA = [2.1, 1.8, 2.4, 1.5, 3.2, 2.0, 1.6, 1.9, 2.8, 1.4, 1.7, 2.3];
const THROUGHPUT_DATA = [420, 380, 510, 460, 490, 530, 480, 520, 550, 500, 470, 540];

const MODEL_STATS = [
  { name: 'Fraud Detection', calls: 12840, avgLatency: 95, errorRate: 1.2, accuracy: 97.3 },
  { name: 'Price Estimation', calls: 8920, avgLatency: 142, errorRate: 0.8, accuracy: 94.1 },
  { name: 'Rank & Match', calls: 15300, avgLatency: 68, errorRate: 0.5, accuracy: 96.8 },
  { name: 'Chatbot NLP', calls: 6450, avgLatency: 210, errorRate: 2.1, accuracy: 91.5 },
];

function buildPolyline(data: number[], width: number, height: number, padding = 20): string {
  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);
  const range = maxVal - minVal || 1;
  return data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((v - minVal) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');
}

function buildAreaPath(data: number[], width: number, height: number, padding = 20): string {
  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);
  const range = maxVal - minVal || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((v - minVal) / range) * (height - padding * 2);
    return `${x},${y}`;
  });
  const firstX = padding;
  const lastX = width - padding;
  const bottom = height - padding;
  return `M ${firstX},${bottom} L ${points.join(' L ')} L ${lastX},${bottom} Z`;
}

const AIMonitoring: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const { ai, loading, error } = useAdminData();

  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('All');
  const [timeRange, setTimeRange] = useState<(typeof TIME_RANGES)[number]>('24h');

  const kpis: KPI[] = useMemo(() => {
    if (!ai?.aiStats) return [
      { id: 'k1', label: 'Model Accuracy', value: '96.2%', trend: 'up', delta: '+0.4%' },
      { id: 'k2', label: 'Total API Calls', value: '43,510', trend: 'up', delta: '+12%' },
      { id: 'k3', label: 'Avg Latency', value: '102ms', trend: 'down', delta: '-8ms' },
      { id: 'k4', label: 'Error Rate', value: '1.8%', trend: 'down', delta: '-0.3%' },
      { id: 'k5', label: 'Fraud Detections', value: '847', trend: 'up', delta: '+23' },
      { id: 'k6', label: 'Active Models', value: '4', trend: 'flat', delta: '' },
    ];
    return [
      { id: 'k1', label: 'Model Accuracy', value: ai.aiStats.rankModelAccuracy ?? '0%', trend: 'up', delta: '+0.4%' },
      { id: 'k2', label: 'Total API Calls', value: String(((ai.aiStats.fraudDetections ?? 0) + (ai.aiStats.priceEstimations ?? 0) + (ai.aiStats.chatbotSessions ?? 0)).toLocaleString()), trend: 'up', delta: '+12%' },
      { id: 'k3', label: 'Avg Latency', value: '102ms', trend: 'down', delta: '-8ms' },
      { id: 'k4', label: 'Error Rate', value: '1.8%', trend: 'down', delta: '-0.3%' },
      { id: 'k5', label: 'Fraud Detections', value: String(ai.aiStats.fraudDetections ?? 0), trend: 'up', delta: '+23' },
      { id: 'k6', label: 'Active Models', value: '4', trend: 'flat', delta: '' },
    ];
  }, [ai?.aiStats]);

  const logs: LogRow[] = useMemo(() => {
    if (!Array.isArray(ai?.recentFraudAlerts)) return [
      { id: '1', ts: new Date().toISOString(), level: 'info', message: 'Rank model re-trained successfully', model: 'Rank & Match', latencyMs: 1240 },
      { id: '2', ts: new Date(Date.now() - 300000).toISOString(), level: 'warn', message: 'High latency detected on price estimation endpoint', model: 'Price Estimation', latencyMs: 890 },
      { id: '3', ts: new Date(Date.now() - 600000).toISOString(), level: 'error', message: 'Chatbot timeout — fallback response served', model: 'Chatbot NLP', latencyMs: 5000 },
      { id: '4', ts: new Date(Date.now() - 900000).toISOString(), level: 'info', message: 'Fraud detection batch completed: 142 profiles scanned', model: 'Fraud Detection', latencyMs: 4200 },
      { id: '5', ts: new Date(Date.now() - 1200000).toISOString(), level: 'warn', message: 'Model accuracy dipped below 95% threshold', model: 'Price Estimation', latencyMs: 0 },
      { id: '6', ts: new Date(Date.now() - 1800000).toISOString(), level: 'info', message: 'Daily API usage summary generated', model: 'System', latencyMs: 320 },
    ];
    return (ai.recentFraudAlerts as any[]).map((l, idx) => ({
      id: String(l.id ?? idx),
      ts: l.timestamp ?? '',
      level: 'warn' as LogRow['level'],
      message: l.reason ?? '',
      model: 'Fraud Detection',
      latencyMs: 0,
    }));
  }, [ai?.recentFraudAlerts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter(l =>
      (level === 'All' || l.level === level) &&
      (!q || l.message.toLowerCase().includes(q) || l.model.toLowerCase().includes(q))
    );
  }, [logs, query, level]);

  const handleExport = useCallback(() => {
    const csv = ['Timestamp,Level,Model,Message,Latency(ms)',
      ...filtered.map(l => `"${l.ts}","${l.level}","${l.model}","${l.message}",${l.latencyMs}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  const trendIcon = (t?: 'up' | 'down' | 'flat') => {
    if (t === 'up') return '↑';
    if (t === 'down') return '↓';
    return '–';
  };

  const levelBadgeClass = (l: string) => {
    if (l === 'error') return cn(common.badge, common.badgeError);
    if (l === 'warn') return cn(common.badge, common.badgeWarn);
    return cn(common.badge, common.badgeInfo);
  };

  if (!resolvedTheme) return null;

  return (
    <PageTransition className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <ScrollReveal className={common.header}>
          <div>
            <h1 className={common.title}>AI Monitoring</h1>
            <p className={cn(common.subtitle, themed.subtitle)}>Track AI model performance, latency, errors, and throughput across all services.</p>
          </div>
          <div className={common.controls} aria-label="AI monitoring controls">
            <label className={common.srOnly} htmlFor="q">Search</label>
            <input id="q" className={cn(common.input, themed.input)} type="search" placeholder="Search logs…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <label className={common.srOnly} htmlFor="level">Level</label>
            <select id="level" className={cn(common.select, themed.select)} value={level} onChange={(e) => setLevel(e.target.value as (typeof LEVELS)[number])}>
              {LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <label className={common.srOnly} htmlFor="timeRange">Time range</label>
            <select id="timeRange" className={cn(common.select, themed.select)} value={timeRange} onChange={(e) => setTimeRange(e.target.value as (typeof TIME_RANGES)[number])}>
              {TIME_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button type="button" className={cn(common.button, themed.button)} onClick={handleExport}>Export CSV</button>
          </div>
        </ScrollReveal>

        <StaggerContainer>
          {/* ── KPI Cards ── */}
          <ScrollReveal className={common.kpis} aria-label="AI KPIs">
            {loading && <div className={common.skeletonRow} aria-busy="true" />}
            {error && <div className={common.error}>Failed to load AI metrics.</div>}
            {kpis.map(k => (
              <div key={k.id} className={cn(common.card, themed.card)} tabIndex={0} aria-labelledby={`kpi-${k.id}-label`}>
                <div id={`kpi-${k.id}-label`} className={cn(common.cardLabel, themed.cardTitle)}>{k.label}</div>
                <div className={cn(common.metric, themed.metric)}>{k.value}</div>
                {k.delta && (
                  <div className={cn(common.trend, k.trend === 'up' ? common.trendUp : k.trend === 'down' ? common.trendDown : common.trendFlat)}>
                    {trendIcon(k.trend)} {k.delta}
                  </div>
                )}
              </div>
            ))}
          </ScrollReveal>

          {/* ── Charts Row ── */}
          <ScrollReveal className={common.grid}>
            {/* Latency Chart */}
            <div className={cn(common.panel, themed.panel)} aria-label="Latency chart">
              <div className={common.panelHeader}>
                <div className={cn(common.cardTitle, themed.cardTitle)}>Latency (ms)</div>
                <div className={cn(common.chipRow)}>
                  <span className={cn(common.chip, themed.chipActive)}>Avg: {Math.round(LATENCY_DATA.reduce((a, b) => a + b) / LATENCY_DATA.length)}ms</span>
                  <span className={cn(common.chip)}>P95: {Math.round(LATENCY_DATA.sort((a, b) => a - b)[Math.floor(LATENCY_DATA.length * 0.95)])}ms</span>
                </div>
              </div>
              <svg width="100%" height="200" viewBox="0 0 340 200" preserveAspectRatio="none" role="img" aria-label="Latency over time">
                <desc>Area chart showing API latency over time with values ranging from {Math.min(...LATENCY_DATA)}ms to {Math.max(...LATENCY_DATA)}ms</desc>
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map(i => (
                  <line key={i} x1="20" y1={20 + i * 40} x2="320" y2={20 + i * 40} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4" />
                ))}
                {/* Y-axis labels */}
                <text x="16" y="24" fontSize="9" fill="currentColor" opacity="0.5" textAnchor="end">{Math.max(...LATENCY_DATA)}</text>
                <text x="16" y="184" fontSize="9" fill="currentColor" opacity="0.5" textAnchor="end">{Math.min(...LATENCY_DATA)}</text>
                {/* Area fill */}
                <path d={buildAreaPath(LATENCY_DATA, 340, 200)} fill="currentColor" opacity="0.08" />
                {/* Line */}
                <polyline points={buildPolyline(LATENCY_DATA, 340, 200)} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
                {/* Data dots */}
                {LATENCY_DATA.map((v, i) => {
                  const maxV = Math.max(...LATENCY_DATA);
                  const minV = Math.min(...LATENCY_DATA);
                  const x = (i / (LATENCY_DATA.length - 1)) * 300 + 20;
                  const y = 200 - 20 - ((v - minV) / (maxV - minV)) * 160;
                  return <circle key={i} cx={x} cy={y} r="2.5" fill="currentColor" opacity="0.6" />;
                })}
              </svg>
            </div>

            {/* Error Rate Chart */}
            <div className={cn(common.panel, themed.panel)} aria-label="Error rate chart">
              <div className={common.panelHeader}>
                <div className={cn(common.cardTitle, themed.cardTitle)}>Error Rate (%)</div>
                <span className={cn(common.chip, themed.chipActive)}>Avg: {(ERROR_RATE_DATA.reduce((a, b) => a + b) / ERROR_RATE_DATA.length).toFixed(1)}%</span>
              </div>
              <svg width="100%" height="200" viewBox="0 0 340 200" preserveAspectRatio="none" role="img" aria-label="Error rate per period">
                <desc>Bar chart showing error rate percentages over time</desc>
                {[0, 1, 2, 3, 4].map(i => (
                  <line key={i} x1="20" y1={20 + i * 40} x2="320" y2={20 + i * 40} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4" />
                ))}
                {ERROR_RATE_DATA.map((v, i) => {
                  const maxV = Math.max(...ERROR_RATE_DATA);
                  const barW = 18;
                  const gap = (300 - ERROR_RATE_DATA.length * barW) / (ERROR_RATE_DATA.length + 1);
                  const x = 20 + gap + i * (barW + gap);
                  const barH = (v / (maxV * 1.2)) * 160;
                  const y = 180 - barH;
                  const isHigh = v > 2.5;
                  return (
                    <g key={i}>
                      <rect x={x} y={y} width={barW} height={barH} rx="3" fill={isHigh ? 'var(--error, #e81123)' : 'currentColor'} opacity={isHigh ? 0.85 : 0.6} />
                      <text x={x + barW / 2} y={y - 4} fontSize="8" fill="currentColor" opacity="0.6" textAnchor="middle">{v}%</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </ScrollReveal>

          {/* ── Throughput Chart ── */}
          <ScrollReveal className={cn(common.panel, themed.panel)} aria-label="Throughput chart">
            <div className={common.panelHeader}>
              <div className={cn(common.cardTitle, themed.cardTitle)}>Throughput (requests/min)</div>
              <span className={cn(common.chip, themed.chipActive)}>Total: {THROUGHPUT_DATA.reduce((a, b) => a + b).toLocaleString()}</span>
            </div>
            <svg width="100%" height="160" viewBox="0 0 640 160" preserveAspectRatio="none" role="img" aria-label="Request throughput over time">
              <desc>Area chart showing request throughput</desc>
              {[0, 1, 2, 3].map(i => (
                <line key={i} x1="20" y1={15 + i * 40} x2="620" y2={15 + i * 40} stroke="currentColor" strokeOpacity="0.08" strokeDasharray="4" />
              ))}
              <path d={buildAreaPath(THROUGHPUT_DATA, 640, 160, 20)} fill="currentColor" opacity="0.06" />
              <polyline points={buildPolyline(THROUGHPUT_DATA, 640, 160, 20)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
            </svg>
          </ScrollReveal>

          {/* ── Model Performance Table ── */}
          <ScrollReveal className={cn(common.panel, themed.panel)} aria-label="Model performance breakdown">
            <div className={cn(common.cardTitle, themed.cardTitle)}>Model Performance</div>
            <div className={common.tableWrap}>
              <table className={common.table} role="table">
                <thead>
                  <tr>
                    <th className={cn(common.th, themed.th)}>Model</th>
                    <th className={cn(common.th, themed.th)}>API Calls</th>
                    <th className={cn(common.th, themed.th)}>Avg Latency</th>
                    <th className={cn(common.th, themed.th)}>Error Rate</th>
                    <th className={cn(common.th, themed.th)}>Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {MODEL_STATS.map(m => (
                    <tr key={m.name} className={cn(common.tr, themed.tr)}>
                      <td className={common.td}>{m.name}</td>
                      <td className={common.td}>{m.calls.toLocaleString()}</td>
                      <td className={common.td}>{m.avgLatency}ms</td>
                      <td className={common.td}>
                        <span className={m.errorRate > 2 ? common.textError : ''}>{m.errorRate}%</span>
                      </td>
                      <td className={common.td}>
                        <div className={common.accuracyBar}>
                          <div className={cn(common.accuracyFill, themed.accuracyFill)} style={{ width: `${m.accuracy}%` }} />
                          <span className={common.accuracyLabel}>{m.accuracy}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>

          {/* ── Logs ── */}
          <ScrollReveal className={cn(common.panel, themed.panel)} aria-label="Recent logs">
            <div className={cn(common.cardTitle, themed.cardTitle)}>Recent Logs</div>
            {loading && <div className={common.skeletonRow} aria-busy="true" />}
            {error && <div className={common.error}>Failed to load logs.</div>}
            <div className={cn(common.list)} role="list">
              {filtered.map(l => (
                <div key={l.id} role="listitem" className={cn(common.item, themed.item)}>
                  <div className={common.logHeader}>
                    <span className={levelBadgeClass(l.level)}>{l.level.toUpperCase()}</span>
                    <span className={common.logModel}>{l.model}</span>
                    <span className={common.logTs}>{new Date(l.ts).toLocaleString()}</span>
                  </div>
                  <div className={common.meta}>{l.message}{l.latencyMs > 0 && ` • ${l.latencyMs}ms`}</div>
                </div>
              ))}
            </div>
            {filtered.length === 0 && !loading && (
              <div role="status" aria-live="polite" className={common.emptyState}>No logs match your filters.</div>
            )}
          </ScrollReveal>
        </StaggerContainer>
      </div>
    </PageTransition>
  );
};

export default AIMonitoring;
