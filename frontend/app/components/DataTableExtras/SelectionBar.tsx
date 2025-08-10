// @AI-HINT: Selection bar showing count and batch actions for selected rows.
'use client';

import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import commonStyles from './SelectionBar.common.module.css';
import lightStyles from './SelectionBar.light.module.css';
import darkStyles from './SelectionBar.dark.module.css';

interface SelectionBarProps {
  count: number;
  onClear: () => void;
  onExportCSV?: () => void;
}

const SelectionBar: React.FC<SelectionBarProps> = ({ count, onClear, onExportCSV }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => (theme === 'dark' ? { ...commonStyles, ...darkStyles } : { ...commonStyles, ...lightStyles }), [theme]);
  if (count === 0) return null;
  return (
    <div className={styles.bar} role="status" aria-live="polite">
      <span className={styles.info}>{count} selected</span>
      <div className={styles.actions}>
        {onExportCSV && <button type="button" className={styles.button} onClick={onExportCSV}>Export Selected</button>}
        <button type="button" className={styles.button} onClick={onClear} aria-label="Clear selection">Clear</button>
      </div>
    </div>
  );
};

export default SelectionBar;
