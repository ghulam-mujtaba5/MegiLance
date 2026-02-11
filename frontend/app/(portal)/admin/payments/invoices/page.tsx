// @AI-HINT: Admin Invoices management page - list, view, and track invoice status
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { invoicesApi } from '@/lib/api';
import Button from '@/app/components/Button/Button';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { FileText, DollarSign, Clock, CheckCircle2 } from 'lucide-react';

import commonStyles from '../AdminPayments.common.module.css';
import lightStyles from '../AdminPayments.light.module.css';
import darkStyles from '../AdminPayments.dark.module.css';

interface Invoice {
  id: number;
  contract_id: number;
  from_user_id: number;
  to_user_id: number;
  total: number;
  subtotal?: number;
  tax_amount?: number;
  status: string;
  due_date?: string;
  paid_at?: string;
  created_at: string;
  notes?: string;
}

const statusColors: Record<string, string> = {
  pending: '#F2C94C',
  paid: '#27AE60',
  overdue: '#e81123',
  cancelled: '#888',
};

const AdminPaymentsInvoicesPage = () => {
  const { resolvedTheme } = useTheme();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const data: any = await invoicesApi.list({ status: statusFilter || undefined, page, page_size: 20 });
      setInvoices(data.invoices || []);
      setTotal(data.total || 0);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  if (!resolvedTheme) return null;
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const isDark = resolvedTheme === 'dark';

  const pendingCount = invoices.filter(i => i.status === 'pending' || i.status === 'overdue').length;
  const paidTotal = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0);
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;

  return (
    <PageTransition>
      <main className={cn(commonStyles.page, themeStyles.themeWrapper)}>
        <div className={commonStyles.container}>
          <ScrollReveal>
            <header className={commonStyles.header}>
              <div>
                <h1 className={commonStyles.title}>Invoices</h1>
                <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>Track and manage platform invoices.</p>
              </div>
              <div className={commonStyles.controls}>
                <select
                  className={cn(commonStyles.select, themeStyles.select)}
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  aria-label="Filter by status"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </header>
          </ScrollReveal>

          <ScrollReveal delay={0.05}>
            <div className={commonStyles.summary}>
              <div className={cn(commonStyles.card, themeStyles.card)}>
                <div className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}><Clock size={14} style={{ display: 'inline', marginRight: 4 }} /> Outstanding</div>
                <div className={cn(commonStyles.metric, themeStyles.metric)}>{pendingCount}</div>
              </div>
              <div className={cn(commonStyles.card, themeStyles.card)}>
                <div className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}><DollarSign size={14} style={{ display: 'inline', marginRight: 4 }} /> Paid Total</div>
                <div className={cn(commonStyles.metric, themeStyles.metric)}>${paidTotal.toFixed(2)}</div>
              </div>
              <div className={cn(commonStyles.card, themeStyles.card)}>
                <div className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}><CheckCircle2 size={14} style={{ display: 'inline', marginRight: 4 }} /> Total Invoices</div>
                <div className={cn(commonStyles.metric, themeStyles.metric)}>{total}</div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className={commonStyles.tableWrap}>
              <table className={cn(commonStyles.table, themeStyles.table)}>
                <thead>
                  <tr>
                    <th className={cn(commonStyles.th, themeStyles.th)}>Invoice</th>
                    <th className={cn(commonStyles.th, themeStyles.th)}>Contract</th>
                    <th className={cn(commonStyles.th, themeStyles.th)}>Total</th>
                    <th className={cn(commonStyles.th, themeStyles.th)}>Status</th>
                    <th className={cn(commonStyles.th, themeStyles.th)}>Due Date</th>
                    <th className={cn(commonStyles.th, themeStyles.th)}>Created</th>
                    <th className={cn(commonStyles.th, themeStyles.th)}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td className={cn(commonStyles.td, themeStyles.td)} colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
                  ) : invoices.length === 0 ? (
                    <tr><td className={cn(commonStyles.td, themeStyles.td)} colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No invoices found.</td></tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className={commonStyles.row}>
                        <td className={cn(commonStyles.td, themeStyles.td)}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FileText size={14} style={{ color: '#4573df' }} />
                            INV-{String(inv.id).padStart(4, '0')}
                          </div>
                        </td>
                        <td className={cn(commonStyles.td, themeStyles.td)}>#{inv.contract_id}</td>
                        <td className={cn(commonStyles.td, themeStyles.td)} style={{ fontWeight: 600 }}>${(inv.total || 0).toFixed(2)}</td>
                        <td className={cn(commonStyles.td, themeStyles.td)}>
                          <span className={cn(commonStyles.badge, themeStyles.badge)} style={{ borderColor: statusColors[inv.status] || '#888', color: statusColors[inv.status] || '#888' }}>
                            {inv.status}
                          </span>
                        </td>
                        <td className={cn(commonStyles.td, themeStyles.td)}>
                          {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}
                        </td>
                        <td className={cn(commonStyles.td, themeStyles.td)}>{new Date(inv.created_at).toLocaleDateString()}</td>
                        <td className={cn(commonStyles.td, themeStyles.td)} style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {inv.notes || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {total > 20 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: '1rem' }}>
                <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                <span style={{ padding: '8px 12px', fontSize: 14, color: isDark ? '#ccc' : '#555' }}>Page {page}</span>
                <Button variant="ghost" size="sm" onClick={() => setPage(p => p + 1)} disabled={invoices.length < 20}>Next</Button>
              </div>
            )}
          </ScrollReveal>
        </div>
      </main>
    </PageTransition>
  );
};

export default AdminPaymentsInvoicesPage;