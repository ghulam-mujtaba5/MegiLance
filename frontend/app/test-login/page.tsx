'use client';

import { useState } from 'react';
import styles from './TestLogin.module.css';

export default function TestLogin() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/backend/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@megilance.com',
          password: 'Password123!'
        }),
      });

      const data = await response.json();
      setResult({
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        data
      });
    } catch (error: any) {
      setResult({
        error: true,
        message: error.message,
        stack: error.stack
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Login API Test</h1>
      <button 
        onClick={testLogin} 
        disabled={loading}
        className={styles.testButton}
      >
        {loading ? 'Testing...' : 'Test Login'}
      </button>
      
      {result && (
        <pre className={styles.result}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
