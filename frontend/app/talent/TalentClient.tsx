// @AI-HINT: Public talent directory preview page - links to freelancers page.
'use client';
import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';

import commonStyles from './TalentDirectory.common.module.css';
import lightStyles from './TalentDirectory.light.module.css';
import darkStyles from './TalentDirectory.dark.module.css';

interface TalentProfile { id: string; name: string; role: string; rank: number; skills: string[]; avatar: string; }

const mock: TalentProfile[] = Array.from({ length: 8 }).map((_, i) => ({
  id: 't' + i,
  name: ['Aisha Khan','Bilal Ahmed','Sara Malik','Omar Farooq','Hira Javed','Zain Raza','Fatima Noor','Adnan Saeed'][i],
  role: ['Full Stack Dev','Data Scientist','UI/UX Designer','Blockchain Dev','ML Engineer','Backend Dev','Frontend Dev','DevOps Engineer'][i],
  rank: Math.round(Math.random()*100),
  skills: ['React','Node','AI','Python','Solidity','Postgres','Tailwind'].sort(() => .5 - Math.random()).slice(0,3),
  avatar: `https://i.pravatar.cc/120?img=${i+10}`
}));

const TalentDirectoryPage = () => {
  const { resolvedTheme } = useTheme();
  const [q, setQ] = useState('');
  
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const styles = {
    main: cn(commonStyles.main, themeStyles.main),
    header: commonStyles.header,
    title: cn(commonStyles.title, themeStyles.title),
    subtitle: cn(commonStyles.subtitle, themeStyles.subtitle),
    searchWrapper: commonStyles.searchWrapper,
    searchInput: cn(commonStyles.searchInput, themeStyles.searchInput),
    grid: commonStyles.grid,
    card: cn(commonStyles.card, themeStyles.card),
    cardHeader: commonStyles.cardHeader,
    avatar: commonStyles.avatar,
    profileInfo: commonStyles.profileInfo,
    name: cn(commonStyles.name, themeStyles.name),
    role: cn(commonStyles.role, themeStyles.role),
    rankBadge: cn(commonStyles.rankBadge, themeStyles.rankBadge),
    skillsWrapper: commonStyles.skillsWrapper,
    skillTag: cn(commonStyles.skillTag, themeStyles.skillTag),
    viewProfileBtn: cn(commonStyles.viewProfileBtn, themeStyles.viewProfileBtn),
    emptyState: cn(commonStyles.emptyState, themeStyles.emptyState),
  };
  
  const filtered = mock.filter(m => !q || m.name.toLowerCase().includes(q.toLowerCase()) || m.skills.some(s => s.toLowerCase().includes(q.toLowerCase())));

  if (!resolvedTheme) return null;

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Explore Top Talent</h1>
        <p className={styles.subtitle}>Preview a slice of our AI-ranked freelancer pool.</p>
        <div className={styles.searchWrapper}>
          <input
            value={q}
            onChange={e=>setQ(e.target.value)}
            placeholder="Search by name or skill..."
            className={styles.searchInput}
            aria-label="Search talent"
          />
        </div>
      </header>
      <ul className={styles.grid} role="list">
        {filtered.map(p => (
          <li key={p.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <Image src={p.avatar} alt={p.name} className={styles.avatar} width={56} height={56} />
              <div className={styles.profileInfo}>
                <h3 className={styles.name}>{p.name}</h3>
                <p className={styles.role}>{p.role}</p>
              </div>
              <span className={styles.rankBadge}>Rank {p.rank}</span>
            </div>
            <div className={styles.skillsWrapper}>
              {p.skills.map(s => <span key={s} className={styles.skillTag}>{s}</span>)}
            </div>
            <Link href="/freelancers" className={styles.viewProfileBtn}>
              View Profile
            </Link>
          </li>
        ))}
        {filtered.length === 0 && <li className={styles.emptyState}>No matches.</li>}
      </ul>
    </main>
  );
};

// Wrap the component to prevent SSR issues
const WrappedTalentDirectoryPage = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return <TalentDirectoryPage />;
};

export default WrappedTalentDirectoryPage;