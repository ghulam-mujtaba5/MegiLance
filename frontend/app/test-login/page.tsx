'use client';

import { useState } from 'react';
import api from '@/lib/api';
import styles from './TestLogin.module.css';

export default function TestLogin() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const data = await api.auth.login('admin@megilance.com', 'admin123');
      
      setResult({
        status: 200,
        statusText: 'OK',
        ok: true,
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
