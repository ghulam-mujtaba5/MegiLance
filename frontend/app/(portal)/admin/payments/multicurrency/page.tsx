// @AI-HINT: Multi-Currency Payments Management Page
'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal } from '@/app/components/Animations';
import Button from '@/app/components/Button/Button';

const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', enabled: true },
  { code: 'EUR', name: 'Euro', symbol: '€', enabled: true },
  { code: 'GBP', name: 'British Pound', symbol: '£', enabled: true },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', enabled: true },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', enabled: false },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', enabled: false },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', enabled: false },
];

const EXCHANGE_RATES = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  PKR: 278.5,
  INR: 83.2,
  CAD: 1.35,
  AUD: 1.52,
};

export default function MultiCurrencyPage() {
  const { resolvedTheme } = useTheme();
  const [currencies, setCurrencies] = useState(SUPPORTED_CURRENCIES);
  const [baseCurrency, setBaseCurrency] = useState('USD');

  const toggleCurrency = (code: string) => {
    setCurrencies(prev =>
      prev.map(c => c.code === code ? { ...c, enabled: !c.enabled } : c)
    );
  };

  return (
    <PageTransition>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <ScrollReveal>
          <header style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Multi-Currency Management
            </h1>
            <p style={{ opacity: 0.8 }}>
              Configure supported currencies and exchange rates for the platform
            </p>
          </header>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div style={{ 
            padding: '1.5rem', 
            borderRadius: '0.75rem', 
            border: '1px solid', 
            borderColor: resolvedTheme === 'dark' ? '#334155' : '#e5e7eb',
            backgroundColor: resolvedTheme === 'dark' ? '#1e293b' : '#ffffff',
            marginBottom: '2rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
              Base Currency
            </h2>
            <select
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid',
                borderColor: resolvedTheme === 'dark' ? '#334155' : '#d1d5db',
                backgroundColor: resolvedTheme === 'dark' ? '#0f172a' : '#ffffff',
                color: resolvedTheme === 'dark' ? '#f1f5f9' : '#111827',
              }}
            >
              {currencies.map(c => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.symbol})
                </option>
              ))}
            </select>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', opacity: 0.7 }}>
              All amounts will be converted from this base currency
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div style={{ 
            padding: '1.5rem', 
            borderRadius: '0.75rem', 
            border: '1px solid', 
            borderColor: resolvedTheme === 'dark' ? '#334155' : '#e5e7eb',
            backgroundColor: resolvedTheme === 'dark' ? '#1e293b' : '#ffffff',
            marginBottom: '2rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
              Supported Currencies
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {currencies.map(currency => (
                <div
                  key={currency.code}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    backgroundColor: resolvedTheme === 'dark' ? '#0f172a' : '#f9fafb',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                      {currency.symbol} {currency.name} ({currency.code})
                    </div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                      1 {baseCurrency} = {(EXCHANGE_RATES[currency.code as keyof typeof EXCHANGE_RATES] / EXCHANGE_RATES[baseCurrency as keyof typeof EXCHANGE_RATES]).toFixed(4)} {currency.code}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: currency.enabled ? '#dcfce7' : '#fef9c3',
                      color: currency.enabled ? '#166534' : '#854d0e',
                    }}>
                      {currency.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <Button
                      variant={currency.enabled ? 'danger' : 'primary'}
                      size="sm"
                      onClick={() => toggleCurrency(currency.code)}
                    >
                      {currency.enabled ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <div style={{ 
            padding: '1.5rem', 
            borderRadius: '0.75rem', 
            border: '1px solid', 
            borderColor: resolvedTheme === 'dark' ? '#334155' : '#e5e7eb',
            backgroundColor: resolvedTheme === 'dark' ? '#1e293b' : '#ffffff',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
              Exchange Rate Settings
            </h2>
            <p style={{ marginBottom: '1rem', fontSize: '0.875rem', opacity: 0.7 }}>
              Exchange rates are updated automatically from market data. Manual overrides can be configured below.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button variant="outline">Configure Rate Provider</Button>
              <Button variant="outline">Manual Rate Override</Button>
              <Button variant="primary">Update Rates Now</Button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </PageTransition>
  );
}
