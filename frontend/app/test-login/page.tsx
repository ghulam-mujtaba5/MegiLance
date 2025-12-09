'use client';

import { useState } from 'react';
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

// @AI-HINT: FYP Quick Login page - HARDCODED credentials for demo bypass
const DEMO_USERS: DemoUser[] = [
  {
    email: 'admin.real@megilance.com',
    password: 'Test123!@#',
    role: 'Admin',
    description: 'Full platform access, analytics, user management',
    dashboard: '/admin/dashboard',
    color: '#e81123'
  },
  {
    email: 'sarah.tech@megilance.com',
    password: 'Test123!@#',
    role: 'Client',
    description: 'Post jobs, hire freelancers, manage projects',
    dashboard: '/client/dashboard',
    color: '#4573df'
  },
  {
    email: 'alex.fullstack@megilance.com',
    password: 'Test123!@#',
    role: 'Freelancer',
    description: 'Find jobs, submit proposals, track earnings',
    dashboard: '/freelancer/dashboard',
    color: '#27AE60'
  }
];

export default function DevQuickLogin() {
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);

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
          Click any button below to instantly login as a demo user and explore the platform
        </p>
      </div>
      
      <div className={styles.userGrid}>
        {DEMO_USERS.map((user) => (
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
      
      <div className={styles.credentials}>
        <h3>📋 All Demo Credentials (Universal Password: Test123!@#)</h3>
        <table className={styles.credTable}>
          <thead>
            <tr>
              <th>Role</th>
              <th>Email</th>
              <th>Password</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Admin</td><td>admin.real@megilance.com</td><td>Test123!@#</td></tr>
            <tr><td>Client (Sarah)</td><td>sarah.tech@megilance.com</td><td>Test123!@#</td></tr>
            <tr><td>Client (Michael)</td><td>michael.ventures@megilance.com</td><td>Test123!@#</td></tr>
            <tr><td>Freelancer (Alex)</td><td>alex.fullstack@megilance.com</td><td>Test123!@#</td></tr>
            <tr><td>Freelancer (Emma)</td><td>emma.designer@megilance.com</td><td>Test123!@#</td></tr>
            <tr><td>Freelancer (James)</td><td>james.devops@megilance.com</td><td>Test123!@#</td></tr>
            <tr><td>Freelancer (Sophia)</td><td>sophia.data@megilance.com</td><td>Test123!@#</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
