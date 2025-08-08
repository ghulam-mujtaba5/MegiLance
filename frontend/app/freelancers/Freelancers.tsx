// @AI-HINT: Freelancers page with theme-aware styling, animated sections, accessible filters, and optimized images.
'use client';

import React, { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import common from './Freelancers.common.module.css';
import light from './Freelancers.light.module.css';
import dark from './Freelancers.dark.module.css';

type Freelancer = {
  id: string;
  name: string;
  role: string;
  rate: number; // hourly USD
  location: string;
  skills: string[];
  avatar: string;
};

const data: Freelancer[] = [
  {
    id: 'f1',
    name: 'Sofia Rossi',
    role: 'Senior Frontend Engineer',
    rate: 85,
    location: 'Remote • EU',
    skills: ['React', 'Next.js', 'TypeScript', 'CSS Modules'],
    avatar: '/images/freelancers/sofia.jpg',
  },
  {
    id: 'f2',
    name: 'Diego Morales',
    role: 'Blockchain Engineer',
    rate: 120,
    location: 'Remote • LATAM',
    skills: ['Solidity', 'Hardhat', 'Audits', 'Ethers.js'],
    avatar: '/images/freelancers/diego.jpg',
  },
  {
    id: 'f3',
    name: 'Hannah Lee',
    role: 'Product Designer',
    rate: 95,
    location: 'Hybrid • US',
    skills: ['Figma', 'Design Systems', 'Accessibility', 'Prototyping'],
    avatar: '/images/freelancers/hannah.jpg',
  },
  {
    id: 'f4',
    name: 'Ethan Chen',
    role: 'Data Scientist',
    rate: 110,
    location: 'Remote • APAC',
    skills: ['Python', 'LLMs', 'Vector DBs', 'Eval'],
    avatar: '/images/freelancers/ethan.jpg',
  },
  {
    id: 'f5',
    name: 'Nora Patel',
    role: 'iOS Engineer',
    rate: 100,
    location: 'Remote • US',
    skills: ['Swift', 'UIKit', 'SwiftUI', 'CI/CD'],
    avatar: '/images/freelancers/nora.jpg',
  },
  {
    id: 'f6',
    name: 'Daniel Park',
    role: 'Backend Engineer',
    rate: 105,
    location: 'Remote • KR',
    skills: ['Go', 'PostgreSQL', 'gRPC', 'Kubernetes'],
    avatar: '/images/freelancers/daniel.jpg',
  },
];

const rates = ['Any', '< $75', '$75–$100', '$100–$125', '> $125'] as const;
const locations = ['Any', 'US', 'EU', 'APAC', 'LATAM', 'Hybrid'] as const;

const Freelancers: React.FC = () => {
  const { theme } = useTheme();
  const themed = theme === 'dark' ? dark : light;

  const [keyword, setKeyword] = useState('');
  const [rate, setRate] = useState<(typeof rates)[number]>('Any');
  const [location, setLocation] = useState<(typeof locations)[number]>('Any');

  const headerRef = useRef<HTMLElement | null>(null);
  const filtersRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const headerVisible = useIntersectionObserver(headerRef, { threshold: 0.1 });
  const filtersVisible = useIntersectionObserver(filtersRef, { threshold: 0.1 });
  const gridVisible = useIntersectionObserver(gridRef, { threshold: 0.1 });

  const filtered = useMemo(() => {
    return data.filter((f) => {
      const kw = keyword.trim().toLowerCase();
      const kwOk = kw
        ? f.name.toLowerCase().includes(kw) ||
          f.role.toLowerCase().includes(kw) ||
          f.skills.some((s) => s.toLowerCase().includes(kw))
        : true;

      let rateOk = true;
      if (rate === '< $75') rateOk = f.rate < 75;
      else if (rate === '$75–$100') rateOk = f.rate >= 75 && f.rate <= 100;
      else if (rate === '$100–$125') rateOk = f.rate > 100 && f.rate <= 125;
      else if (rate === '> $125') rateOk = f.rate > 125;

      const locOk =
        location === 'Any' ||
        f.location.toLowerCase().includes(location.toLowerCase());

      return kwOk && rateOk && locOk;
    });
  }, [keyword, rate, location]);

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <header
          ref={headerRef as any}
          className={cn(common.header, headerVisible ? common.isVisible : common.isNotVisible)}
        >
          <h1 className={common.title}>Find Top Freelancers</h1>
          <p className={common.subtitle}>Search by skill, location, and rate to discover vetted talent.</p>
        </header>

        <div
          ref={filtersRef}
          className={cn(common.filters, filtersVisible ? common.isVisible : common.isNotVisible)}
          role="search"
          aria-label="Freelancer search filters"
        >
          <label className={common.srOnly} htmlFor="kw">Keyword</label>
          <input
            id="kw"
            className={common.input}
            type="search"
            placeholder="Search by name, role, or skill"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />

          <label className={common.srOnly} htmlFor="rate">Rate</label>
          <select
            id="rate"
            className={common.select}
            value={rate}
            onChange={(e) => setRate(e.target.value as (typeof rates)[number])}
          >
            {rates.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <label className={common.srOnly} htmlFor="loc">Location</label>
          <select
            id="loc"
            className={common.select}
            value={location}
            onChange={(e) => setLocation(e.target.value as (typeof locations)[number])}
          >
            {locations.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          <button className={common.button} onClick={() => {/* no-op: instant filters */}} aria-label="Apply filters">Apply</button>
        </div>

        <section aria-label="Freelancers results">
          <div
            ref={gridRef}
            className={cn(common.grid, gridVisible ? common.isVisible : common.isNotVisible)}
          >
            {filtered.map((f) => (
              <article key={f.id} className={common.card} aria-labelledby={`name-${f.id}`}>
                <div className={common.headerRow}>
                  <Image
                    className={common.avatar}
                    src={f.avatar}
                    alt={`${f.name} avatar`}
                    width={56}
                    height={56}
                    loading="lazy"
                  />
                  <div>
                    <h3 id={`name-${f.id}`} className={common.name}>{f.name}</h3>
                    <div className={common.role}>{f.role}</div>
                  </div>
                </div>

                <div className={common.meta}>
                  <span>{`Rate: $${f.rate}/hr`}</span>
                  <span>{f.location}</span>
                </div>

                <div className={common.skills} aria-label="Skills">
                  {f.skills.map((s) => (
                    <span key={s} className={common.skill}>{s}</span>
                  ))}
                </div>

                <div className={common.actions}>
                  <a href="/contact" className={common.button} aria-label={`Contact ${f.name}`}>Contact</a>
                  <a href="/jobs" className={cn(common.button, common.buttonSecondary)} aria-label={`View jobs for ${f.role}`}>View Jobs</a>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Freelancers;
