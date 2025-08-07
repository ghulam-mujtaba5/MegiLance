// @AI-HINT: This is the refactored DashboardWidget, a premium, theme-aware component for displaying key metrics. It uses CSS modules and a useMemo hook for efficient styling.
import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import commonStyles from './DashboardWidget.common.module.css';
import lightStyles from './DashboardWidget.light.module.css';
import darkStyles from './DashboardWidget.dark.module.css';

export interface DashboardWidgetProps {
  title: string;
  value?: string | number;
  footer?: React.ReactNode;
  onClick?: () => void;
  children?: React.ReactNode;
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({ 
  title, 
  value, 
  footer, 
  onClick,
  children
}) => {
  const { theme } = useTheme();

  const styles = useMemo(() => {
    const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [theme]);

  return (
    <div 
      className={cn(styles.widget, onClick && styles.clickable)}
      onClick={onClick}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
      </div>

      {children ? (
        <div className={styles.content}>{children}</div>
      ) : (
        <p className={styles.value}>{value}</p>
      )}

      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
};

export default DashboardWidget;
