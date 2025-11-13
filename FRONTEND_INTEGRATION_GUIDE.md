# Frontend Integration Guide

## New Backend Features to Integrate

### 1. Email Verification System

#### Update Registration Flow
**File**: `frontend/app/(auth)/signup/page.tsx`

Add email verification notice after registration:
```tsx
// After successful registration
if (response.ok) {
  const data = await response.json();
  
  // Show verification notice
  toast.success(
    'Registration successful! Please check your email to verify your account.',
    { duration: 6000 }
  );
  
  // Redirect to login with notice
  router.push('/login?verified=false');
}
```

#### Create Email Verification Page
**File**: `frontend/app/(auth)/verify-email/page.tsx`
```tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (token) {
      fetch(`/backend/api/auth/verify-email?token=${token}`)
        .then(res => res.ok ? setStatus('success') : setStatus('error'))
        .catch(() => setStatus('error'));
    }
  }, [token]);

  return (
    <div className={styles.container}>
      {status === 'loading' && <p>Verifying your email...</p>}
      {status === 'success' && (
        <>
          <h1>Email Verified!</h1>
          <p>Your email has been successfully verified. You can now log in.</p>
          <Link href="/login">Go to Login</Link>
        </>
      )}
      {status === 'error' && (
        <>
          <h1>Verification Failed</h1>
          <p>Invalid or expired verification link.</p>
        </>
      )}
    </div>
  );
}
```

#### Add Resend Verification Button
**File**: `frontend/app/(auth)/login/page.tsx`
```tsx
// Show if email not verified
{!user.email_verified && (
  <button onClick={handleResendVerification}>
    Resend Verification Email
  </button>
)}

const handleResendVerification = async () => {
  const response = await fetch('/backend/api/auth/resend-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: formData.email })
  });
  
  if (response.ok) {
    toast.success('Verification email sent! Check your inbox.');
  }
};
```

---

### 2. Two-Factor Authentication (2FA)

#### Create 2FA Setup Page
**File**: `frontend/app/(portal)/settings/security/2fa/page.tsx`
```tsx
'use client';

import { useState } from 'react';
import QRCode from 'qrcode.react';

export default function TwoFactorAuthPage() {
  const [qrCode, setQrCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');

  const handleEnable2FA = async () => {
    const response = await fetch('/backend/api/auth/2fa/enable', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    setQrCode(data.qr_code);
    setBackupCodes(data.backup_codes);
  };

  const handleVerify = async () => {
    const response = await fetch('/backend/api/auth/2fa/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code: verificationCode })
    });

    if (response.ok) {
      toast.success('2FA enabled successfully!');
    }
  };

  return (
    <div>
      <h1>Two-Factor Authentication</h1>
      
      {!qrCode ? (
        <button onClick={handleEnable2FA}>Enable 2FA</button>
      ) : (
        <>
          <h2>Scan QR Code</h2>
          <QRCode value={qrCode} />
          
          <h2>Backup Codes (Save these!)</h2>
          <ul>
            {backupCodes.map((code, i) => (
              <li key={i}><code>{code}</code></li>
            ))}
          </ul>
          
          <h2>Verify Setup</h2>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Enter 6-digit code"
          />
          <button onClick={handleVerify}>Verify & Enable</button>
        </>
      )}
    </div>
  );
}
```

#### Update Login Flow for 2FA
**File**: `frontend/app/(auth)/login/page.tsx`
```tsx
const handleLogin = async (e) => {
  e.preventDefault();
  
  const response = await fetch('/backend/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (data.requires_2fa) {
    // Show 2FA input
    setShow2FAInput(true);
  } else {
    // Normal login
    localStorage.setItem('access_token', data.access_token);
    router.push('/dashboard');
  }
};

const handleVerify2FA = async () => {
  const response = await fetch('/backend/api/auth/2fa/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      email, 
      password, 
      code: twoFactorCode 
    })
  });

  if (response.ok) {
    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    router.push('/dashboard');
  }
};
```

---

### 3. Stripe Payment Integration

#### Install Stripe Dependencies
```bash
cd frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
```

#### Create Stripe Provider
**File**: `frontend/components/providers/StripeProvider.tsx`
```tsx
'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function StripeProvider({ children }: { children: React.ReactNode }) {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
}
```

#### Create Payment Form Component
**File**: `frontend/components/payment/PaymentForm.tsx`
```tsx
'use client';

import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function PaymentForm({ projectId, amount }: { projectId: number, amount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);

    // Create payment intent
    const response = await fetch('/backend/api/stripe/payment-intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert to cents
        currency: 'usd',
        metadata: { project_id: projectId }
      })
    });

    const { client_secret } = await response.json();

    // Confirm payment
    const result = await stripe.confirmCardPayment(client_secret, {
      payment_method: {
        card: elements.getElement(CardElement)!
      }
    });

    if (result.error) {
      toast.error(result.error.message);
    } else {
      toast.success('Payment successful!');
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button disabled={!stripe || processing}>
        {processing ? 'Processing...' : `Pay $${amount}`}
      </button>
    </form>
  );
}
```

#### Add Stripe to Project Payment Page
**File**: `frontend/app/(portal)/projects/[id]/payment/page.tsx`
```tsx
import { StripeProvider } from '@/components/providers/StripeProvider';
import PaymentForm from '@/components/payment/PaymentForm';

export default function ProjectPaymentPage({ params }: { params: { id: string } }) {
  return (
    <StripeProvider>
      <div>
        <h1>Project Payment</h1>
        <PaymentForm projectId={parseInt(params.id)} amount={1000} />
      </div>
    </StripeProvider>
  );
}
```

---

### 4. WebSocket Real-time Features

#### Install Socket.IO Client
```bash
cd frontend
npm install socket.io-client
```

#### Create WebSocket Hook
**File**: `frontend/hooks/useWebSocket.ts`
```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) return;

    const newSocket = io('http://localhost:8000/ws', {
      auth: { token: accessToken }
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      setIsConnected(false);
    });

    newSocket.on('user_online', (data) => {
      setOnlineUsers(prev => [...prev, data.user_id]);
    });

    newSocket.on('user_offline', (data) => {
      setOnlineUsers(prev => prev.filter(id => id !== data.user_id));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinProject = (projectId: number) => {
    socket?.emit('join_project', { project_id: projectId });
  };

  const sendMessage = (receiverId: number, content: string) => {
    socket?.emit('send_message', { receiver_id: receiverId, content });
  };

  const startTyping = (chatId: number) => {
    socket?.emit('typing_start', { chat_id: chatId });
  };

  const stopTyping = (chatId: number) => {
    socket?.emit('typing_stop', { chat_id: chatId });
  };

  return {
    socket,
    isConnected,
    onlineUsers,
    joinProject,
    sendMessage,
    startTyping,
    stopTyping
  };
}
```

#### Create Real-time Messaging Component
**File**: `frontend/components/messaging/RealtimeChat.tsx`
```tsx
'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function RealtimeChat({ receiverId }: { receiverId: number }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { socket, isConnected, sendMessage, startTyping, stopTyping } = useWebSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', (data) => {
      setMessages(prev => [...prev, data]);
    });

    socket.on('typing', (data) => {
      if (data.user_id === receiverId) {
        setIsTyping(true);
      }
    });

    socket.on('stop_typing', (data) => {
      if (data.user_id === receiverId) {
        setIsTyping(false);
      }
    });

    return () => {
      socket.off('new_message');
      socket.off('typing');
      socket.off('stop_typing');
    };
  }, [socket, receiverId]);

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(receiverId, message);
      setMessage('');
      stopTyping(receiverId);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    startTyping(receiverId);
    
    // Stop typing after 2 seconds of inactivity
    setTimeout(() => stopTyping(receiverId), 2000);
  };

  return (
    <div>
      <div className={styles.messages}>
        {messages.map((msg, i) => (
          <div key={i} className={styles.message}>
            <p>{msg.content}</p>
          </div>
        ))}
        {isTyping && <p className={styles.typing}>User is typing...</p>}
      </div>
      
      <div className={styles.input}>
        <input
          value={message}
          onChange={handleTyping}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
        />
        <button onClick={handleSend} disabled={!isConnected}>
          Send
        </button>
      </div>
    </div>
  );
}
```

#### Add Online Status Indicator
**File**: `frontend/components/users/OnlineStatus.tsx`
```tsx
'use client';

import { useWebSocket } from '@/hooks/useWebSocket';

export default function OnlineStatus({ userId }: { userId: number }) {
  const { onlineUsers } = useWebSocket();
  const isOnline = onlineUsers.includes(userId);

  return (
    <span className={`${styles.status} ${isOnline ? styles.online : styles.offline}`}>
      {isOnline ? '● Online' : '○ Offline'}
    </span>
  );
}
```

---

### 5. Analytics Dashboard (Admin)

#### Create Analytics Dashboard Page
**File**: `frontend/app/(portal)/admin/analytics/page.tsx`
```tsx
'use client';

import { useEffect, useState } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';

export default function AnalyticsDashboard() {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetchDashboardSummary();
  }, []);

  const fetchDashboardSummary = async () => {
    const response = await fetch('/backend/api/analytics/dashboard/summary', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data = await response.json();
    setSummary(data);
  };

  if (!summary) return <div>Loading...</div>;

  return (
    <div className={styles.dashboard}>
      <h1>Analytics Dashboard</h1>
      
      <div className={styles.grid}>
        <div className={styles.card}>
          <h2>Active Users</h2>
          <p className={styles.stat}>{summary.users.active_users}</p>
          <p className={styles.label}>out of {summary.users.total_users} total</p>
        </div>

        <div className={styles.card}>
          <h2>Total Revenue</h2>
          <p className={styles.stat}>${summary.revenue.total_revenue.toFixed(2)}</p>
          <p className={styles.label}>{summary.revenue.transaction_count} transactions</p>
        </div>

        <div className={styles.card}>
          <h2>Project Completion</h2>
          <p className={styles.stat}>{summary.projects.completion_rate}%</p>
          <p className={styles.label}>{summary.projects.completed} completed</p>
        </div>

        <div className={styles.card}>
          <h2>Platform Health</h2>
          <p className={styles.stat}>{summary.health.user_satisfaction_rating}/5.0</p>
          <p className={styles.label}>User satisfaction</p>
        </div>
      </div>

      <div className={styles.charts}>
        {/* Add Chart.js charts here */}
      </div>
    </div>
  );
}
```

---

## Environment Variables

Add to `frontend/.env.local`:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
NEXT_PUBLIC_WS_URL=http://localhost:8000
```

## Dependencies to Install

```bash
cd frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
npm install socket.io-client
npm install qrcode.react
npm install chart.js react-chartjs-2
npm install @types/qrcode.react --save-dev
```

## Testing Checklist

- [ ] Email verification link works
- [ ] 2FA QR code displays correctly
- [ ] Stripe payment form accepts cards
- [ ] WebSocket connection establishes
- [ ] Real-time messages appear
- [ ] Online status updates
- [ ] Analytics dashboard loads data

## Next Steps
After frontend integration:
1. Test all features end-to-end
2. Update documentation
3. Prepare for deployment
