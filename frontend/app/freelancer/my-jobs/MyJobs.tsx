// @AI-HINT: This is the refactored 'My Jobs' page, featuring a premium two-column layout and the specialized JobStatusCard for a clean, professional presentation.
'use client';

import React, { useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import JobStatusCard from './components/JobStatusCard/JobStatusCard';
import commonStyles from './MyJobs.common.module.css';
import lightStyles from './MyJobs.light.module.css';
import darkStyles from './MyJobs.dark.module.css';

const activeJobs = [
  {
    title: 'AI-Powered Content Generation Platform',
    client: 'ContentAI Solutions',
    status: 'Development',
    progress: 65,
  },
  {
    title: 'Real-Time IoT Data Visualization Dashboard',
    client: 'Connected Devices Inc.',
    status: 'Client Review',
    progress: 90,
  },
  {
    title: 'Mobile App for Financial Literacy',
    client: 'FinEd Mobile',
    status: 'UI/UX Design',
    progress: 40,
  },
];

const completedJobs = [
  {
    title: 'Corporate Website Redesign',
    client: 'Global Synergy Corp',
    status: 'Completed',
    progress: 100,
    completionDate: '2025-08-01',
  },
  {
    title: 'Cloud Migration & Infrastructure Setup',
    client: 'ScaleFast Startups',
    status: 'Completed',
    progress: 100,
    completionDate: '2025-07-22',
  },
];

const MyJobs: React.FC = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => {
    const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [theme]);

  // Active section controls
  const [qActive, setQActive] = useState('');
  const [sortActiveKey, setSortActiveKey] = useState<'title' | 'client' | 'status' | 'progress'>('title');
  const [sortActiveDir, setSortActiveDir] = useState<'asc' | 'desc'>('asc');
  const [pageActive, setPageActive] = useState(1);
  const [pageActiveSize, setPageActiveSize] = useState(6);

  const filteredActive = useMemo(() => {
    const q = qActive.trim().toLowerCase();
    return activeJobs.filter(j =>
      !q || j.title.toLowerCase().includes(q) || j.client.toLowerCase().includes(q) || j.status.toLowerCase().includes(q)
    );
  }, [qActive]);

  const sortedActive = useMemo(() => {
    const list = [...filteredActive];
    list.sort((a, b) => {
      if (sortActiveKey === 'progress') {
        if (a.progress < b.progress) return sortActiveDir === 'asc' ? -1 : 1;
        if (a.progress > b.progress) return sortActiveDir === 'asc' ? 1 : -1;
        return 0;
      }
      const av = String((a as any)[sortActiveKey]).toLowerCase();
      const bv = String((b as any)[sortActiveKey]).toLowerCase();
      if (av < bv) return sortActiveDir === 'asc' ? -1 : 1;
      if (av > bv) return sortActiveDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredActive, sortActiveKey, sortActiveDir]);

  const totalActivePages = Math.max(1, Math.ceil(sortedActive.length / pageActiveSize));
  const pageActiveSafe = Math.min(pageActive, totalActivePages);
  const pagedActive = useMemo(() => {
    const start = (pageActiveSafe - 1) * pageActiveSize;
    return sortedActive.slice(start, start + pageActiveSize);
  }, [sortedActive, pageActiveSafe, pageActiveSize]);

  const exportActiveCSV = () => {
    const header = ['Title', 'Client', 'Status', 'Progress'];
    const rows = sortedActive.map(j => [j.title, j.client, j.status, String(j.progress)]);
    const csv = [header, ...rows]
      .map(cols => cols.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-jobs-active.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Completed section controls
  const [qCompleted, setQCompleted] = useState('');
  const [sortCompletedKey, setSortCompletedKey] = useState<'title' | 'client' | 'completionDate'>('completionDate');
  const [sortCompletedDir, setSortCompletedDir] = useState<'asc' | 'desc'>('desc');
  const [pageCompleted, setPageCompleted] = useState(1);
  const [pageCompletedSize, setPageCompletedSize] = useState(6);

  const filteredCompleted = useMemo(() => {
    const q = qCompleted.trim().toLowerCase();
    return completedJobs.filter(j =>
      !q || j.title.toLowerCase().includes(q) || j.client.toLowerCase().includes(q)
    );
  }, [qCompleted]);

  const sortedCompleted = useMemo(() => {
    const list = [...filteredCompleted];
    list.sort((a, b) => {
      if (sortCompletedKey === 'completionDate') {
        const ta = Date.parse(a.completionDate as string);
        const tb = Date.parse(b.completionDate as string);
        if (ta < tb) return sortCompletedDir === 'asc' ? -1 : 1;
        if (ta > tb) return sortCompletedDir === 'asc' ? 1 : -1;
        return 0;
      }
      const av = String((a as any)[sortCompletedKey]).toLowerCase();
      const bv = String((b as any)[sortCompletedKey]).toLowerCase();
      if (av < bv) return sortCompletedDir === 'asc' ? -1 : 1;
      if (av > bv) return sortCompletedDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredCompleted, sortCompletedKey, sortCompletedDir]);

  const totalCompletedPages = Math.max(1, Math.ceil(sortedCompleted.length / pageCompletedSize));
  const pageCompletedSafe = Math.min(pageCompleted, totalCompletedPages);
  const pagedCompleted = useMemo(() => {
    const start = (pageCompletedSafe - 1) * pageCompletedSize;
    return sortedCompleted.slice(start, start + pageCompletedSize);
  }, [sortedCompleted, pageCompletedSafe, pageCompletedSize]);

  const exportCompletedCSV = () => {
    const header = ['Title', 'Client', 'Completion Date'];
    const rows = sortedCompleted.map(j => [j.title, j.client, j.completionDate as string]);
    const csv = [header, ...rows]
      .map(cols => cols.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-jobs-completed.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>My Jobs</h1>
        <p className={styles.subtitle}>
          Track and manage all your active and completed projects from one place.
        </p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Active Jobs</h2>
        <div className={styles.toolbar} role="group" aria-label="Active filters and actions">
          <label htmlFor="q-active" className={styles.srOnly}>Search active jobs</label>
          <input
            id="q-active"
            className={styles.input}
            type="search"
            placeholder="Search by title, client, or status"
            value={qActive}
            onChange={(e) => { setQActive(e.target.value); setPageActive(1); }}
          />
          <label htmlFor="sort-active" className={styles.srOnly}>Sort active</label>
          <select
            id="sort-active"
            className={styles.select}
            value={`${sortActiveKey}:${sortActiveDir}`}
            onChange={(e) => {
              const [k, d] = e.target.value.split(':') as [typeof sortActiveKey, typeof sortActiveDir];
              setSortActiveKey(k);
              setSortActiveDir(d);
              setPageActive(1);
            }}
            aria-label="Sort active jobs"
          >
            <option value="title:asc">Title A–Z</option>
            <option value="title:desc">Title Z–A</option>
            <option value="client:asc">Client A–Z</option>
            <option value="client:desc">Client Z–A</option>
            <option value="status:asc">Status A–Z</option>
            <option value="status:desc">Status Z–A</option>
            <option value="progress:asc">Progress Low–High</option>
            <option value="progress:desc">Progress High–Low</option>
          </select>
          <button type="button" className={styles.button} onClick={exportActiveCSV} aria-label="Export active jobs to CSV">Export CSV</button>
          <label htmlFor="active-page-size" className={styles.srOnly}>Active per page</label>
          <select
            id="active-page-size"
            className={styles.select}
            value={pageActiveSize}
            onChange={(e) => { setPageActiveSize(Number(e.target.value)); setPageActive(1); }}
            aria-label="Active results per page"
          >
            {[6, 12, 24].map(sz => <option key={sz} value={sz}>{sz}/page</option>)}
          </select>
        </div>
        <div className={styles.jobGrid}>
          {pagedActive.map((job, index) => (
            <JobStatusCard key={`active-${index}`} {...job} />
          ))}
          {sortedActive.length === 0 && (
            <div role="status" aria-live="polite" className={styles.emptyState}>No active jobs found.</div>
          )}
        </div>
        {sortedActive.length > 0 && (
          <div className={styles.paginationBar} role="navigation" aria-label="Active pagination">
            <button
              type="button"
              className={styles.button}
              onClick={() => setPageActive(p => Math.max(1, p - 1))}
              disabled={pageActiveSafe === 1}
              aria-label="Previous page"
            >
              Prev
            </button>
            <span className={styles.paginationInfo} aria-live="polite">Page {pageActiveSafe} of {totalActivePages} · {sortedActive.length} result(s)</span>
            <button
              type="button"
              className={styles.button}
              onClick={() => setPageActive(p => Math.min(totalActivePages, p + 1))}
              disabled={pageActiveSafe === totalActivePages}
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Completed Jobs</h2>
        <div className={styles.toolbar} role="group" aria-label="Completed filters and actions">
          <label htmlFor="q-completed" className={styles.srOnly}>Search completed jobs</label>
          <input
            id="q-completed"
            className={styles.input}
            type="search"
            placeholder="Search by title or client"
            value={qCompleted}
            onChange={(e) => { setQCompleted(e.target.value); setPageCompleted(1); }}
          />
          <label htmlFor="sort-completed" className={styles.srOnly}>Sort completed</label>
          <select
            id="sort-completed"
            className={styles.select}
            value={`${sortCompletedKey}:${sortCompletedDir}`}
            onChange={(e) => {
              const [k, d] = e.target.value.split(':') as [typeof sortCompletedKey, typeof sortCompletedDir];
              setSortCompletedKey(k);
              setSortCompletedDir(d);
              setPageCompleted(1);
            }}
            aria-label="Sort completed jobs"
          >
            <option value="completionDate:desc">Newest</option>
            <option value="completionDate:asc">Oldest</option>
            <option value="title:asc">Title A–Z</option>
            <option value="title:desc">Title Z–A</option>
            <option value="client:asc">Client A–Z</option>
            <option value="client:desc">Client Z–A</option>
          </select>
          <button type="button" className={styles.button} onClick={exportCompletedCSV} aria-label="Export completed jobs to CSV">Export CSV</button>
          <label htmlFor="completed-page-size" className={styles.srOnly}>Completed per page</label>
          <select
            id="completed-page-size"
            className={styles.select}
            value={pageCompletedSize}
            onChange={(e) => { setPageCompletedSize(Number(e.target.value)); setPageCompleted(1); }}
            aria-label="Completed results per page"
          >
            {[6, 12, 24].map(sz => <option key={sz} value={sz}>{sz}/page</option>)}
          </select>
        </div>
        <div className={styles.jobGrid}>
          {pagedCompleted.map((job, index) => (
            <JobStatusCard key={`completed-${index}`} {...job} />
          ))}
          {sortedCompleted.length === 0 && (
            <div role="status" aria-live="polite" className={styles.emptyState}>No completed jobs found.</div>
          )}
        </div>
        {sortedCompleted.length > 0 && (
          <div className={styles.paginationBar} role="navigation" aria-label="Completed pagination">
            <button
              type="button"
              className={styles.button}
              onClick={() => setPageCompleted(p => Math.max(1, p - 1))}
              disabled={pageCompletedSafe === 1}
              aria-label="Previous page"
            >
              Prev
            </button>
            <span className={styles.paginationInfo} aria-live="polite">Page {pageCompletedSafe} of {totalCompletedPages} · {sortedCompleted.length} result(s)</span>
            <button
              type="button"
              className={styles.button}
              onClick={() => setPageCompleted(p => Math.min(totalCompletedPages, p + 1))}
              disabled={pageCompletedSafe === totalCompletedPages}
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default MyJobs;
