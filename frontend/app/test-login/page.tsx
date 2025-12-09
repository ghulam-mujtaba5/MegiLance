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

const DEMO_USERS: DemoUser[] = [
  {
    email: 'admin@megilance.com',
    password: 'admin123',
    role: 'Admin',
    description: 'Full platform access, analytics, user management',
    dashboard: '/admin/dashboard',
    color: '#e81123'
  },
  {
    email: 'client1@example.com',
    password: 'password123',
    role: 'Client',
    description: 'Post jobs, hire freelancers, manage projects',
    dashboard: '/client/dashboard',
    color: '#4573df'
  },
  {
    email: 'freelancer1@example.com',
    password: 'password123',
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
        <h3>📋 All Demo Credentials</h3>
        <table className={styles.credTable}>
          <thead>
            <tr>
              <th>Role</th>
              <th>Email</th>
              <th>Password</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Admin</td><td>admin@megilance.com</td><td>admin123</td></tr>
            <tr><td>Client 1</td><td>client1@example.com</td><td>password123</td></tr>
            <tr><td>Client 2</td><td>client2@example.com</td><td>password123</td></tr>
            <tr><td>Client 3</td><td>client3@example.com</td><td>password123</td></tr>
            <tr><td>Freelancer 1</td><td>freelancer1@example.com</td><td>password123</td></tr>
            <tr><td>Freelancer 2</td><td>freelancer2@example.com</td><td>password123</td></tr>
            <tr><td>Freelancer 3</td><td>freelancer3@example.com</td><td>password123</td></tr>
            <tr><td>Freelancer 4</td><td>freelancer4@example.com</td><td>password123</td></tr>
            <tr><td>Freelancer 5</td><td>freelancer5@example.com</td><td>password123</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
