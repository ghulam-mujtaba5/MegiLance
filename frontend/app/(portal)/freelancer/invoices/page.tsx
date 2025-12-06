// @AI-HINT: Invoice management page - Create, view, track invoices with payment status
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { invoicesApi } from '@/lib/api';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer } from '@/app/components/Animations/StaggerContainer';
import { StaggerItem } from '@/app/components/Animations/StaggerItem';
import commonStyles from './Invoices.common.module.css';
import lightStyles from './Invoices.light.module.css';
import darkStyles from './Invoices.dark.module.css';

interface Invoice {
  id: number;
  invoice_number: string;
  client_name: string;
  client_email: string;
  project_title: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  created_at: string;
  items: InvoiceItem[];
  notes?: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export default function InvoicesPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
  });

  // New invoice form
  const [newInvoice, setNewInvoice] = useState({
    client_name: '',
    client_email: '',
    project_title: '',
    due_date: '',
    notes: '',
    items: [{ description: '', quantity: 1, rate: 0, amount: 0 }] as InvoiceItem[],
  });

  useEffect(() => {
    setMounted(true);
    loadInvoices();
  }, [filter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoicesApi.list({ 
        status: filter !== 'all' ? filter : undefined 
      });
      
      // Use API data if available, otherwise fall back to demo data
      let invoiceData: Invoice[] = [];
      
      if (response && (response.invoices?.length > 0 || Array.isArray(response) && response.length > 0)) {
        invoiceData = response.invoices || response;
      } else {
        // Demo data for display when no real invoices exist
        invoiceData = [
          {
            id: 1,
            invoice_number: 'INV-2025-001',
            client_name: 'Tech Solutions Inc.',
            client_email: 'billing@techsolutions.com',
            project_title: 'Website Redesign',
            amount: 3500,
            currency: 'USD',
            status: 'paid',
            due_date: '2025-11-15',
            created_at: '2025-11-01',
            items: [
              { description: 'UI Design', quantity: 20, rate: 100, amount: 2000 },
              { description: 'Frontend Development', quantity: 15, rate: 100, amount: 1500 },
            ],
          },
          {
            id: 2,
            invoice_number: 'INV-2025-002',
            client_name: 'StartupXYZ',
            client_email: 'hello@startupxyz.io',
            project_title: 'Mobile App MVP',
            amount: 5000,
            currency: 'USD',
            status: 'sent',
            due_date: '2025-12-01',
            created_at: '2025-11-20',
            items: [
              { description: 'App Development', quantity: 40, rate: 125, amount: 5000 },
            ],
          },
          {
            id: 3,
            invoice_number: 'INV-2025-003',
            client_name: 'Creative Agency',
            client_email: 'accounts@creativeagency.com',
            project_title: 'Brand Identity',
            amount: 2000,
            currency: 'USD',
            status: 'overdue',
            due_date: '2025-11-10',
            created_at: '2025-10-25',
            items: [
              { description: 'Logo Design', quantity: 1, rate: 1200, amount: 1200 },
              { description: 'Brand Guidelines', quantity: 1, rate: 800, amount: 800 },
            ],
          },
          {
            id: 4,
            invoice_number: 'INV-2025-004',
            client_name: 'Enterprise Corp',
            client_email: 'finance@enterprise.com',
            project_title: 'API Integration',
            amount: 8500,
            currency: 'USD',
            status: 'draft',
            due_date: '2025-12-15',
            created_at: '2025-11-25',
            items: [
              { description: 'Backend Development', quantity: 50, rate: 150, amount: 7500 },
              { description: 'Documentation', quantity: 10, rate: 100, amount: 1000 },
            ],
          },
        ];
      }

      setInvoices(invoiceData);

      // Calculate stats from the invoice data
      const total = invoiceData.reduce((sum, inv) => sum + inv.amount, 0);
      const paid = invoiceData.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
      const pending = invoiceData.filter(inv => ['sent', 'draft'].includes(inv.status)).reduce((sum, inv) => sum + inv.amount, 0);
      const overdue = invoiceData.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0);

      setStats({ total, paid, pending, overdue });
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    try {
      const invoiceData = {
        ...newInvoice,
        amount: newInvoice.items.reduce((sum, item) => sum + item.amount, 0),
      };
      await invoicesApi.create(invoiceData);
      setShowCreateModal(false);
      setNewInvoice({
        client_name: '',
        client_email: '',
        project_title: '',
        due_date: '',
        notes: '',
        items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
      });
      loadInvoices();
    } catch (error) {
      console.error('Failed to create invoice:', error);
    }
  };

  const handleSendInvoice = async (invoiceId: number) => {
    try {
      await invoicesApi.send(invoiceId);
      loadInvoices();
    } catch (error) {
      console.error('Failed to send invoice:', error);
    }
  };

  const handleDeleteInvoice = async (invoiceId: number) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await invoicesApi.delete(invoiceId);
      loadInvoices();
    } catch (error) {
      console.error('Failed to delete invoice:', error);
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const items = [...newInvoice.items];
    items[index] = { ...items[index], [field]: value };
    if (field === 'quantity' || field === 'rate') {
      items[index].amount = Number(items[index].quantity) * Number(items[index].rate);
    }
    setNewInvoice({ ...newInvoice, items });
  };

  const addItem = () => {
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, { description: '', quantity: 1, rate: 0, amount: 0 }],
    });
  };

  const removeItem = (index: number) => {
    if (newInvoice.items.length === 1) return;
    const items = newInvoice.items.filter((_, i) => i !== index);
    setNewInvoice({ ...newInvoice, items });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'statusPaid';
      case 'sent': return 'statusSent';
      case 'overdue': return 'statusOverdue';
      case 'draft': return 'statusDraft';
      case 'cancelled': return 'statusCancelled';
      default: return 'statusDraft';
    }
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={cn(commonStyles.loading, themeStyles.loading)}>Loading invoices...</div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        {/* Header */}
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Invoices</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Create and manage invoices for your projects
              </p>
            </div>
            <button
              className={cn(commonStyles.createButton, themeStyles.createButton)}
              onClick={() => setShowCreateModal(true)}
            >
              + Create Invoice
            </button>
          </div>
        </ScrollReveal>

        {/* Stats */}
        <ScrollReveal delay={0.1}>
          <div className={commonStyles.statsGrid}>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={commonStyles.statIcon}>💰</span>
              <div>
                <p className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Invoiced</p>
                <p className={cn(commonStyles.statValue, themeStyles.statValue)}>{formatCurrency(stats.total)}</p>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard, commonStyles.statPaid)}>
              <span className={commonStyles.statIcon}>✓</span>
              <div>
                <p className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Paid</p>
                <p className={cn(commonStyles.statValue, themeStyles.statValuePaid)}>{formatCurrency(stats.paid)}</p>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard, commonStyles.statPending)}>
              <span className={commonStyles.statIcon}>⏳</span>
              <div>
                <p className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Pending</p>
                <p className={cn(commonStyles.statValue, themeStyles.statValuePending)}>{formatCurrency(stats.pending)}</p>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard, commonStyles.statOverdue)}>
              <span className={commonStyles.statIcon}>⚠️</span>
              <div>
                <p className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Overdue</p>
                <p className={cn(commonStyles.statValue, themeStyles.statValueOverdue)}>{formatCurrency(stats.overdue)}</p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Filters */}
        <ScrollReveal delay={0.2}>
          <div className={cn(commonStyles.filters, themeStyles.filters)}>
            {['all', 'draft', 'sent', 'paid', 'overdue'].map((f) => (
              <button
                key={f}
                className={cn(
                  commonStyles.filterButton,
                  themeStyles.filterButton,
                  filter === f && commonStyles.filterActive,
                  filter === f && themeStyles.filterActive
                )}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Invoices List */}
        <div className={commonStyles.invoicesList}>
          {invoices.length === 0 ? (
            <ScrollReveal delay={0.3}>
              <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                <span className={commonStyles.emptyIcon}>📄</span>
                <p>No invoices found</p>
                <button
                  className={cn(commonStyles.createButton, themeStyles.createButton)}
                  onClick={() => setShowCreateModal(true)}
                >
                  Create your first invoice
                </button>
              </div>
            </ScrollReveal>
          ) : (
            <StaggerContainer delay={0.3}>
              {invoices.map((invoice) => (
                <StaggerItem key={invoice.id}>
                  <div
                    className={cn(commonStyles.invoiceCard, themeStyles.invoiceCard)}
                    onClick={() => setSelectedInvoice(invoice)}
                  >
                    <div className={commonStyles.invoiceHeader}>
                      <div className={commonStyles.invoiceInfo}>
                        <span className={cn(commonStyles.invoiceNumber, themeStyles.invoiceNumber)}>
                          {invoice.invoice_number}
                        </span>
                        <span className={cn(
                          commonStyles.status,
                          commonStyles[getStatusColor(invoice.status)],
                          themeStyles[getStatusColor(invoice.status)]
                        )}>
                          {invoice.status}
                        </span>
                      </div>
                      <span className={cn(commonStyles.invoiceAmount, themeStyles.invoiceAmount)}>
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </span>
                    </div>
                    <div className={commonStyles.invoiceBody}>
                      <div className={commonStyles.clientInfo}>
                        <span className={cn(commonStyles.clientName, themeStyles.clientName)}>
                          {invoice.client_name}
                        </span>
                        <span className={cn(commonStyles.projectTitle, themeStyles.projectTitle)}>
                          {invoice.project_title}
                        </span>
                      </div>
                      <div className={cn(commonStyles.invoiceDates, themeStyles.invoiceDates)}>
                        <span>Created: {new Date(invoice.created_at).toLocaleDateString()}</span>
                        <span>Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className={commonStyles.invoiceActions}>
                      {invoice.status === 'draft' && (
                        <>
                          <button
                            className={cn(commonStyles.actionButton, themeStyles.actionButtonPrimary)}
                            onClick={(e) => { e.stopPropagation(); handleSendInvoice(invoice.id); }}
                          >
                            📤 Send
                          </button>
                          <button
                            className={cn(commonStyles.actionButton, themeStyles.actionButton)}
                            onClick={(e) => { e.stopPropagation(); }}
                          >
                            ✏️ Edit
                          </button>
                        </>
                      )}
                      {invoice.status === 'sent' && (
                        <button
                          className={cn(commonStyles.actionButton, themeStyles.actionButton)}
                          onClick={(e) => { e.stopPropagation(); }}
                        >
                          🔄 Resend
                        </button>
                      )}
                      <button
                        className={cn(commonStyles.actionButton, themeStyles.actionButton)}
                        onClick={(e) => { e.stopPropagation(); }}
                      >
                        📥 Download
                      </button>
                      {invoice.status === 'draft' && (
                        <button
                          className={cn(commonStyles.actionButton, themeStyles.actionButtonDanger)}
                          onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(invoice.id); }}
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>

        {/* Create Invoice Modal */}
        {showCreateModal && (
          <div className={cn(commonStyles.modal, themeStyles.modal)}>
            <div className={cn(commonStyles.modalContent, themeStyles.modalContent)}>
              <div className={commonStyles.modalHeader}>
                <h2>Create Invoice</h2>
                <button
                  className={cn(commonStyles.closeButton, themeStyles.closeButton)}
                  onClick={() => setShowCreateModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className={commonStyles.modalBody}>
                <div className={commonStyles.formGrid}>
                  <div className={commonStyles.formGroup}>
                    <label>Client Name *</label>
                    <input
                      type="text"
                      value={newInvoice.client_name}
                      onChange={(e) => setNewInvoice({ ...newInvoice, client_name: e.target.value })}
                      className={cn(commonStyles.input, themeStyles.input)}
                      placeholder="Enter client name"
                    />
                  </div>
                  <div className={commonStyles.formGroup}>
                    <label>Client Email *</label>
                    <input
                      type="email"
                      value={newInvoice.client_email}
                      onChange={(e) => setNewInvoice({ ...newInvoice, client_email: e.target.value })}
                      className={cn(commonStyles.input, themeStyles.input)}
                      placeholder="client@email.com"
                    />
                  </div>
                  <div className={commonStyles.formGroup}>
                    <label>Project Title</label>
                    <input
                      type="text"
                      value={newInvoice.project_title}
                      onChange={(e) => setNewInvoice({ ...newInvoice, project_title: e.target.value })}
                      className={cn(commonStyles.input, themeStyles.input)}
                      placeholder="Project name"
                    />
                  </div>
                  <div className={commonStyles.formGroup}>
                    <label>Due Date *</label>
                    <input
                      type="date"
                      value={newInvoice.due_date}
                      onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
                      className={cn(commonStyles.input, themeStyles.input)}
                    />
                  </div>
                </div>

                <div className={commonStyles.itemsSection}>
                  <h3>Line Items</h3>
                  <div className={commonStyles.itemsHeader}>
                    <span>Description</span>
                    <span>Qty</span>
                    <span>Rate</span>
                    <span>Amount</span>
                    <span></span>
                  </div>
                  {newInvoice.items.map((item, index) => (
                    <div key={index} className={commonStyles.itemRow}>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className={cn(commonStyles.input, themeStyles.input)}
                        placeholder="Service description"
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className={cn(commonStyles.input, themeStyles.input, commonStyles.inputSmall)}
                        min="1"
                      />
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                        className={cn(commonStyles.input, themeStyles.input, commonStyles.inputSmall)}
                        min="0"
                      />
                      <span className={cn(commonStyles.itemAmount, themeStyles.itemAmount)}>
                        {formatCurrency(item.amount)}
                      </span>
                      <button
                        className={cn(commonStyles.removeButton, themeStyles.removeButton)}
                        onClick={() => removeItem(index)}
                        disabled={newInvoice.items.length === 1}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    className={cn(commonStyles.addItemButton, themeStyles.addItemButton)}
                    onClick={addItem}
                  >
                    + Add Line Item
                  </button>
                </div>

                <div className={cn(commonStyles.totalSection, themeStyles.totalSection)}>
                  <span>Total:</span>
                  <span className={commonStyles.totalAmount}>
                    {formatCurrency(newInvoice.items.reduce((sum, item) => sum + item.amount, 0))}
                  </span>
                </div>

                <div className={commonStyles.formGroup}>
                  <label>Notes</label>
                  <textarea
                    value={newInvoice.notes}
                    onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                    className={cn(commonStyles.textarea, themeStyles.textarea)}
                    placeholder="Additional notes or payment terms..."
                    rows={3}
                  />
                </div>
              </div>

              <div className={commonStyles.modalFooter}>
                <button
                  className={cn(commonStyles.secondaryButton, themeStyles.secondaryButton)}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}
                  onClick={handleCreateInvoice}
                  disabled={!newInvoice.client_name || !newInvoice.client_email || !newInvoice.due_date}
                >
                  Create Invoice
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Detail Modal */}
        {selectedInvoice && (
          <div className={cn(commonStyles.modal, themeStyles.modal)}>
            <div className={cn(commonStyles.modalContent, themeStyles.modalContent, commonStyles.detailModal)}>
              <div className={commonStyles.modalHeader}>
                <h2>{selectedInvoice.invoice_number}</h2>
                <button
                  className={cn(commonStyles.closeButton, themeStyles.closeButton)}
                  onClick={() => setSelectedInvoice(null)}
                >
                  ✕
                </button>
              </div>

              <div className={commonStyles.invoiceDetail}>
                <div className={commonStyles.detailHeader}>
                  <div>
                    <h3 className={themeStyles.detailClientName}>{selectedInvoice.client_name}</h3>
                    <p className={themeStyles.detailClientEmail}>{selectedInvoice.client_email}</p>
                  </div>
                  <span className={cn(
                    commonStyles.status,
                    commonStyles[getStatusColor(selectedInvoice.status)],
                    themeStyles[getStatusColor(selectedInvoice.status)]
                  )}>
                    {selectedInvoice.status}
                  </span>
                </div>

                <div className={cn(commonStyles.detailMeta, themeStyles.detailMeta)}>
                  <div>
                    <span className={themeStyles.detailLabel}>Project</span>
                    <span>{selectedInvoice.project_title}</span>
                  </div>
                  <div>
                    <span className={themeStyles.detailLabel}>Created</span>
                    <span>{new Date(selectedInvoice.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className={themeStyles.detailLabel}>Due Date</span>
                    <span>{new Date(selectedInvoice.due_date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className={cn(commonStyles.detailItems, themeStyles.detailItems)}>
                  <h4>Items</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Qty</th>
                        <th>Rate</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.description}</td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.rate)}</td>
                          <td>{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3}><strong>Total</strong></td>
                        <td><strong>{formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className={commonStyles.modalFooter}>
                <button className={cn(commonStyles.secondaryButton, themeStyles.secondaryButton)}>
                  📥 Download PDF
                </button>
                {selectedInvoice.status === 'draft' && (
                  <button
                    className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}
                    onClick={() => { handleSendInvoice(selectedInvoice.id); setSelectedInvoice(null); }}
                  >
                    📤 Send Invoice
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
