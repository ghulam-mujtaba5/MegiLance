// @AI-HINT: Reusable ErrorBoundary to catch unexpected render errors and show a user-friendly fallback.
'use client';

import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import commonStyles from './ErrorBoundary.common.module.css';
import lightStyles from './ErrorBoundary.light.module.css';
import darkStyles from './ErrorBoundary.dark.module.css';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // TODO: integrate with logging/telemetry if needed
    console.error('MegiLance ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <ThemedFallback />;
    }
    return this.props.children;
  }
}

// Themed fallback component to access theme in client components
const ThemedFallback: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  return (
    <div role="alert" className={styles.container}>
      <h2 className={styles.title}>Something went wrong.</h2>
      <p className={styles.message}>Please refresh the page or try again later.</p>
    </div>
  );
};
