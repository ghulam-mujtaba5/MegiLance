// @AI-HINT: Payment form supporting fiat and cryptocurrency payments with dynamic pricing
"use client";

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import CurrencySelector from '@/app/components/CurrencySelector/CurrencySelector';
import commonStyles from './PaymentForm.common.module.css';
import lightStyles from './PaymentForm.light.module.css';
import darkStyles from './PaymentForm.dark.module.css';

interface PaymentFormProps {
  projectId?: string;
  recipientId?: string;
  initialAmount?: number;
  initialCurrency?: string;
  paymentType: 'project' | 'milestone' | 'withdrawal' | 'deposit';
  onSuccess?: (payment: any) => void;
  onCancel?: () => void;
  className?: string;
}

interface PaymentMethod {
  type: 'card' | 'bank' | 'crypto' | 'wallet';
  label: string;
  icon: string;
}

export default function PaymentForm({
  projectId,
  recipientId,
  initialAmount = 0,
  initialCurrency = 'USD',
  paymentType,
  onSuccess,
  onCancel,
  className = ''
}: PaymentFormProps) {
  const { resolvedTheme } = useTheme();
  const [amount, setAmount] = useState(initialAmount);
  const [currency, setCurrency] = useState(initialCurrency);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod['type']>('card');
  const [description, setDescription] = useState('');
  const [isCrypto, setIsCrypto] = useState(false);
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimatedFee, setEstimatedFee] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // Theme guard
  if (!resolvedTheme) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const paymentMethods: PaymentMethod[] = [
    { type: 'card', label: 'Credit/Debit Card', icon: '💳' },
    { type: 'bank', label: 'Bank Transfer', icon: '🏦' },
    { type: 'crypto', label: 'Cryptocurrency', icon: '₿' },
    { type: 'wallet', label: 'Platform Wallet', icon: '💰' }
  ];

  // Calculate fees
  useEffect(() => {
    let fee = 0;
    if (paymentMethod === 'card') {
      fee = amount * 0.029 + 0.3; // 2.9% + $0.30
    } else if (paymentMethod === 'bank') {
      fee = Math.max(amount * 0.008, 5); // 0.8%, min $5
    } else if (paymentMethod === 'crypto') {
      fee = amount * 0.01; // 1% network fee
    }
    setEstimatedFee(fee);
    setTotalAmount(amount + fee);
  }, [amount, paymentMethod]);

  // Check if currency is crypto
  useEffect(() => {
    const cryptoCodes = ['BTC', 'ETH', 'USDC', 'USDT', 'BNB', 'SOL', 'MATIC'];
    setIsCrypto(cryptoCodes.includes(currency));
    if (cryptoCodes.includes(currency)) {
      setPaymentMethod('crypto');
    }
  }, [currency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    if (isCrypto && !cryptoAddress) {
      setError('Crypto wallet address is required');
      return;
    }

    setIsProcessing(true);

    try {
      const endpoint = isCrypto
        ? '/backend/api/multicurrency/crypto-payment'
        : '/backend/api/multicurrency/payments';

      const payload = isCrypto
        ? {
            cryptocurrency: currency,
            amount_crypto: amount,
            wallet_address: cryptoAddress,
            payment_type: paymentType,
            project_id: projectId,
            recipient_id: recipientId,
            description
          }
        : {
            project_id: projectId,
            recipient_id: recipientId,
            amount,
            currency,
            payment_method: paymentMethod,
            description,
            metadata: {
              type: paymentType,
              fee: estimatedFee
            }
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Payment failed');
      }

      const payment = await response.json();
      onSuccess?.(payment);
    } catch (err: any) {
      setError(err.message || 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(commonStyles.form, themeStyles.form, className)}
    >
      {/* Header */}
      <div className={cn(commonStyles.header, themeStyles.header)}>
        <h2 className={commonStyles.title}>
          {paymentType === 'deposit' && '💰 Add Funds'}
          {paymentType === 'withdrawal' && '💸 Withdraw Funds'}
          {paymentType === 'project' && '💼 Project Payment'}
          {paymentType === 'milestone' && '✅ Milestone Payment'}
        </h2>
        <p className={commonStyles.subtitle}>
          {paymentType === 'deposit' && 'Add funds to your MegiLance wallet'}
          {paymentType === 'withdrawal' && 'Withdraw funds to your account'}
          {paymentType === 'project' && 'Make a payment for project work'}
          {paymentType === 'milestone' && 'Release milestone payment'}
        </p>
      </div>

      {/* Amount */}
      <div className={cn(commonStyles.field, themeStyles.field)}>
        <label className={commonStyles.label}>Amount</label>
        <div className={cn(commonStyles.amountContainer, themeStyles.amountContainer)}>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className={cn(commonStyles.amountInput, themeStyles.amountInput)}
            placeholder="0.00"
            required
          />
        </div>
      </div>

      {/* Currency Selector */}
      <div className={cn(commonStyles.field, themeStyles.field)}>
        <label className={commonStyles.label}>Currency</label>
        <CurrencySelector
          selectedCurrency={currency}
          onCurrencyChange={setCurrency}
          amount={amount}
          showConversion={amount > 0}
          showCryptoToggle={true}
        />
      </div>

      {/* Payment Method (only for fiat) */}
      {!isCrypto && (
        <div className={cn(commonStyles.field, themeStyles.field)}>
          <label className={commonStyles.label}>Payment Method</label>
          <div className={commonStyles.methodGrid}>
            {paymentMethods
              .filter((m) => m.type !== 'crypto')
              .map((method) => (
                <button
                  key={method.type}
                  type="button"
                  onClick={() => setPaymentMethod(method.type)}
                  className={cn(
                    commonStyles.methodButton,
                    themeStyles.methodButton,
                    paymentMethod === method.type && commonStyles.methodButtonActive,
                    paymentMethod === method.type && themeStyles.methodButtonActive
                  )}
                >
                  <span className={commonStyles.methodIcon}>{method.icon}</span>
                  <span className={commonStyles.methodLabel}>{method.label}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Crypto Wallet Address */}
      {isCrypto && (
        <div className={cn(commonStyles.field, themeStyles.field)}>
          <label className={commonStyles.label}>
            {currency} Wallet Address
          </label>
          <input
            type="text"
            value={cryptoAddress}
            onChange={(e) => setCryptoAddress(e.target.value)}
            className={cn(commonStyles.input, themeStyles.input)}
            placeholder={`Enter your ${currency} wallet address`}
            required
          />
          <p className={cn(commonStyles.hint, themeStyles.hint)}>
            ⚠️ Double-check your wallet address. Transactions cannot be reversed.
          </p>
        </div>
      )}

      {/* Description */}
      <div className={cn(commonStyles.field, themeStyles.field)}>
        <label className={commonStyles.label}>
          Description {!projectId && <span>(Optional)</span>}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={cn(commonStyles.textarea, themeStyles.textarea)}
          placeholder="Payment description or notes..."
          rows={3}
        />
      </div>

      {/* Fee Breakdown */}
      <div className={cn(commonStyles.breakdown, themeStyles.breakdown)}>
        <div className={cn(commonStyles.breakdownRow, themeStyles.breakdownRow)}>
          <span>Amount:</span>
          <span className={commonStyles.breakdownValue}>
            {amount.toFixed(2)} {currency}
          </span>
        </div>
        <div className={cn(commonStyles.breakdownRow, themeStyles.breakdownRow)}>
          <span>Processing Fee:</span>
          <span className={commonStyles.breakdownValue}>
            {estimatedFee.toFixed(2)} {currency}
          </span>
        </div>
        <div className={cn(commonStyles.breakdownTotal, themeStyles.breakdownTotal)}>
          <span>Total:</span>
          <span className={commonStyles.breakdownTotalValue}>
            {totalAmount.toFixed(2)} {currency}
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className={cn(commonStyles.error, themeStyles.error)}>
          ⚠️ {error}
        </div>
      )}

      {/* Actions */}
      <div className={commonStyles.actions}>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} fullWidth>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          isLoading={isProcessing}
          disabled={isProcessing || amount <= 0}
          fullWidth
        >
          {isProcessing
            ? 'Processing...'
            : isCrypto
            ? `Pay ${totalAmount.toFixed(6)} ${currency}`
            : `Pay ${totalAmount.toFixed(2)} ${currency}`}
        </Button>
      </div>
    </form>
  );
}
