// @AI-HINT: Reusable, theme-aware toolbar for data pages (search, sort, page size, export). Avoid global styles; use per-component CSS modules.
'use client';

import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './DataToolbar.common.module.css';
import lightStyles from './DataToolbar.light.module.css';
import darkStyles from './DataToolbar.dark.module.css';

export interface SortOption {
  value: string; // e.g. 'date:desc'
  label: string; // e.g. 'Newest'
}

interface DataToolbarProps {
  query: string;
  onQueryChange: (val: string) => void;
  sortValue: string; // e.g. `${key}:${dir}`
  onSortChange: (val: string) => void;
  pageSize: number;
  onPageSizeChange: (val: number) => void;
  sortOptions: SortOption[];
  pageSizeOptions?: number[]; // default [10,20,50]
  onExportCSV?: () => void;
  exportLabel?: string;
  'aria-label'?: string;
}

const DataToolbar: React.FC<DataToolbarProps> = ({
  query,
  onQueryChange,
  sortValue,
  onSortChange,
  pageSize,
  onPageSizeChange,
  sortOptions,
  pageSizeOptions = [10, 20, 50],
  onExportCSV,
  exportLabel = 'Export CSV',
  'aria-label': ariaLabel = 'Data filters and actions',
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => {
    const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [theme]);

  return (
    <div className={styles.toolbar} role="group" aria-label={ariaLabel}>
      <label htmlFor="data-toolbar-q" className={styles.srOnly}>Search</label>
      <input
        id="data-toolbar-q"
        className={styles.input}
        type="search"
        placeholder="Search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />

      <label htmlFor="data-toolbar-sort" className={styles.srOnly}>Sort</label>
      <select
        id="data-toolbar-sort"
        className={styles.select}
        value={sortValue}
        onChange={(e) => onSortChange(e.target.value)}
        aria-label="Sort"
      >
        {sortOptions.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {onExportCSV && (
        <button type="button" className={styles.button} onClick={onExportCSV} aria-label={exportLabel}>{exportLabel}</button>
      )}

      <label htmlFor="data-toolbar-page-size" className={styles.srOnly}>Results per page</label>
      <select
        id="data-toolbar-page-size"
        className={styles.select}
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        aria-label="Results per page"
      >
        {pageSizeOptions.map(sz => <option key={sz} value={sz}>{sz}/page</option>)}
      </select>
    </div>
  );
};

export default DataToolbar;
