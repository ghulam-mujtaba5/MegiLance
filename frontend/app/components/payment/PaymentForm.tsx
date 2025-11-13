// @AI-HINT: Payment form component - handles Stripe payment submission
'use client';

import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import { FaCreditCard, FaLock } from 'react-icons/fa';

import commonStyles from './PaymentForm.common.module.css';
import lightStyles from './PaymentForm.light.module.css';
import darkStyles from './PaymentForm.dark.module.css';

interface PaymentFormProps {
  amount: number;
  projectId?: string;
  milestoneId?: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  projectId,
  milestoneId,
  onSuccess,
  onError
}) => {
  const { resolvedTheme } = useTheme();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const styles = {
    container: cn(commonStyles.container, themeStyles.container),
    header: cn(commonStyles.header, themeStyles.header),
    title: cn(commonStyles.title, themeStyles.title),
    amount: cn(commonStyles.amount, themeStyles.amount),
    cardWrapper: cn(commonStyles.cardWrapper, themeStyles.cardWrapper),
    error: cn(commonStyles.error, themeStyles.error),
    footer: cn(commonStyles.footer, themeStyles.footer),
    securityBadge: cn(commonStyles.securityBadge, themeStyles.securityBadge),
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: resolvedTheme === 'dark' ? '#f8fafc' : '#1a1a1a',
        '::placeholder': {
          color: resolvedTheme === 'dark' ? '#94a3b8' : '#9ca3af',
        },
        backgroundColor: resolvedTheme === 'dark' ? '#1e293b' : '#ffffff',
      },
      invalid: {
        color: '#e81123',
      },
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create payment intent
      const token = localStorage.getItem('access_token');
      const response = await fetch('/backend/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          project_id: projectId,
          milestone_id: milestoneId,
          capture_method: milestoneId ? 'manual' : 'automatic', // Escrow for milestones
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { client_secret } = await response.json();

      // Get card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        onError?.(stripeError.message || 'Payment failed');
      } else if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'requires_capture') {
        onSuccess?.(paymentIntent.id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <FaCreditCard className="inline mr-2" />
          Payment Details
        </h2>
        <div className={styles.amount}>
          ${(amount / 100).toFixed(2)}
        </div>
      </div>

      <div className={styles.cardWrapper}>
        <CardElement options={cardElementOptions} />
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        fullWidth
        isLoading={loading}
        disabled={!stripe || loading}
      >
        {loading ? 'Processing...' : `Pay $${(amount / 100).toFixed(2)}`}
      </Button>

      <div className={styles.footer}>
        <div className={styles.securityBadge}>
          <FaLock className="mr-2" />
          Secured by Stripe
        </div>
      </div>
    </form>
  );
};

export default PaymentForm;
