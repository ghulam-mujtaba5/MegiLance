'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api, { setAuthToken, setRefreshToken } from '@/lib/api';
import styles from './TestLogin.module.css';

interface DemoUser {
  email: string;
  password: string;
  role: string;
  description: string;
  dashboard: string;
  color: string;
}

const SHOW_DEMO_LOGIN = process.env.NEXT_PUBLIC_SHOW_DEMO_LOGIN === 'true' || process.env.NODE_ENV === 'development';

// @AI-HINT: FYP Quick Login page — available when NEXT_PUBLIC_SHOW_DEMO_LOGIN=true or in dev mode
function getDemoUsers(): DemoUser[] {
  if (!SHOW_DEMO_LOGIN) return [];
  return [
    {
      email: process.env.NEXT_PUBLIC_DEV_ADMIN_EMAIL || 'admin@megilance.com',
      password: process.env.NEXT_PUBLIC_DEV_ADMIN_PASSWORD || 'Admin@123',
      role: 'Admin',
      description: 'Full platform access, analytics, user management',
      dashboard: '/admin/dashboard',
      color: '#e81123'
    },
    {
      email: process.env.NEXT_PUBLIC_DEV_CLIENT_EMAIL || 'client1@example.com',
      password: process.env.NEXT_PUBLIC_DEV_CLIENT_PASSWORD || 'Client@123',
      role: 'Client',
      description: 'Post jobs, hire freelancers, manage projects',
      dashboard: '/client/dashboard',
      color: '#4573df'
    },
    {
      email: process.env.NEXT_PUBLIC_DEV_FREELANCER_EMAIL || 'freelancer1@example.com',
      password: process.env.NEXT_PUBLIC_DEV_FREELANCER_PASSWORD || 'Freelancer@123',
      role: 'Freelancer',
      description: 'Find jobs, submit proposals, track earnings',
      dashboard: '/freelancer/dashboard',
      color: '#27AE60'
    }
  ].filter(u => u.email && u.password);
}

export default function DevQuickLogin() {
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);

  useEffect(() => {
    setDemoUsers(getDemoUsers());
  }, []);

  if (!SHOW_DEMO_LOGIN) {
    return (
      <div className={styles.container}>
        <p>Demo login is not enabled on this environment.</p>
      </div>
    );
  }

  const loginAs = async (user: DemoUser) => {
    setLoading(user.role);
    setResult(null);
    
    try {
      const data = await api.auth.login(user.email, user.password);
      
      // Store tokens
      if (data.access_token) {
        setAuthToken(data.access_token);
      }
      if (data.refresh_token) {
        setRefreshToken(data.refresh_token);
      }
      
      setResult({
        success: true,
        message: `✅ Logged in as ${user.role}`,
        user: data.user
      });
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push(user.dashboard);
      }, 1000);
      
    } catch (error: any) {
      setResult({
        error: true,
        message: error.message
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>🚀 FYP Quick Login</h1>
        <p className={styles.subtitle}>
          {demoUsers.length > 0
            ? 'Click any button below to instantly login as a demo user and explore the platform'
            : 'No dev credentials configured. Set NEXT_PUBLIC_DEV_*_EMAIL and _PASSWORD in .env.local'}
        </p>
      </div>
      
      <div className={styles.userGrid}>
        {demoUsers.map((user) => (
          <div 
            key={user.email} 
            className={styles.userCard}
            style={{ borderColor: user.color }}
          >
            <div 
              className={styles.roleTag}
              style={{ backgroundColor: user.color }}
            >
              {user.role}
            </div>
            <h3 className={styles.userEmail}>{user.email}</h3>
            <p className={styles.userDescription}>{user.description}</p>
            <button 
              onClick={() => loginAs(user)} 
              disabled={loading !== null}
              className={styles.loginButton}
              style={{ backgroundColor: loading === user.role ? '#888' : user.color }}
            >
              {loading === user.role ? 'Logging in...' : `Login as ${user.role}`}
            </button>
          </div>
        ))}
      </div>
      
      {result && (
        <div className={result.error ? styles.errorResult : styles.successResult}>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
