// @AI-HINT: Portal Community page. Theme-aware, accessible, animated threads list with filters and composer.
'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import common from './Community.base.module.css';
import light from './Community.light.module.css';
import dark from './Community.dark.module.css';

interface Thread {
  id: number;
  title: string;
  author: string;
  time: string;
  replies: number;
  tags: string[];
}

const SORTS = ['Latest', 'Most Replies'] as const;

const initialThreads: Thread[] = [
  { id: 1, title: 'How to structure complex Next.js dashboards?', author: 'Ava', time: '1h ago', replies: 12, tags: ['Next.js', 'Architecture'] },
  { id: 2, title: 'Best practices for theme-aware CSS modules', author: 'Liam', time: '4h ago', replies: 7, tags: ['CSS', 'Theming'] },
  { id: 3, title: 'Improving accessibility for live regions', author: 'Mia', time: '1d ago', replies: 3, tags: ['Accessibility', 'ARIA'] },
  { id: 4, title: 'Smooth intersection animations tips', author: 'Noah', time: '2d ago', replies: 15, tags: ['Animation', 'UX'] },
];

const Community: React.FC = () => {
  const { theme } = useTheme();
  const themed = theme === 'dark' ? dark : light;

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<(typeof SORTS)[number]>('Latest');
  const [message, setMessage] = useState('');

  const headerRef = useRef<HTMLDivElement | null>(null);
  const layoutRef = useRef<HTMLDivElement | null>(null);

  const headerVisible = useIntersectionObserver(headerRef, { threshold: 0.1 });
  const layoutVisible = useIntersectionObserver(layoutRef, { threshold: 0.1 });

  const threads = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = initialThreads.filter(t =>
      !q || t.title.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q))
    );
    const sorted = [...filtered].sort((a, b) => sort === 'Most Replies' ? b.replies - a.replies : a.id < b.id ? 1 : -1);
    return sorted;
  }, [query, sort]);

  const onPost = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, we simulate a post and clear.
    setMessage('');
  };

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <div ref={headerRef} className={cn(common.header, headerVisible ? common.isVisible : common.isNotVisible)}>
          <div>
            <h1 className={common.title}>Community</h1>
            <p className={cn(common.subtitle, themed.subtitle)}>Discuss features, share tips, and get help from the community.</p>
          </div>
          <div className={common.controls} role="search">
            <label htmlFor="community-search" className={common.srOnly}>Search threads</label>
            <input
              id="community-search"
              className={cn(common.input, themed.input)}
              type="search"
              placeholder="Search threads..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <label htmlFor="community-sort" className={common.srOnly}>Sort by</label>
            <select
              id="community-sort"
              className={cn(common.select, themed.select)}
              value={sort}
              onChange={(e) => setSort(e.target.value as (typeof SORTS)[number])}
            >
              {SORTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div ref={layoutRef} className={cn(common.layout, layoutVisible ? common.isVisible : common.isNotVisible)}>
          <section aria-label="Latest threads" className={cn(common.card, themed.card)}>
            <div className={cn(common.cardTitle)}>Threads</div>
            <div className={common.threadList}>
              {threads.map((t) => (
                <article key={t.id} tabIndex={0} aria-labelledby={`thread-${t.id}-title`} className={cn(common.thread, themed.thread)}>
                  <h3 id={`thread-${t.id}-title`} className={common.threadTitle}>{t.title}</h3>
                  <div className={common.threadMeta}>
                    <span aria-label={`Author ${t.author}`}>{t.author}</span>
                    <span aria-label={`Posted ${t.time}`}>{t.time}</span>
                    <span aria-label={`${t.replies} replies`}>{t.replies} replies</span>
                  </div>
                  <div className={common.threadTags}>
                    {t.tags.map(tag => (
                      <span key={tag} className={cn(common.tag, themed.tag)}>{tag}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside aria-label="Create a new thread" className={cn(common.card, themed.card)}>
            <div className={cn(common.cardTitle)}>Start a discussion</div>
            <form className={common.composer} onSubmit={onPost}>
              <label htmlFor="compose" className={common.srOnly}>Message</label>
              <textarea
                id="compose"
                className={cn(common.textarea, themed.textarea)}
                placeholder="Share your question or idea..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className={common.actions}>
                <button type="submit" className={cn(common.button, themed.button)} aria-label="Post message">Post</button>
                <button type="button" className={cn(common.button, themed.button, 'secondary')} onClick={() => setMessage('')} aria-label="Clear message">Clear</button>
              </div>
            </form>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default Community;
