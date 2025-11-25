// @AI-HINT: Public Freelancers search page.
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import Input from '@/app/components/Input/Input';
import Button from '@/app/components/Button/Button';
import { Search, MapPin, Star } from 'lucide-react';
import Link from 'next/link';

import common from './PublicFreelancers.common.module.css';
import light from './PublicFreelancers.light.module.css';
import dark from './PublicFreelancers.dark.module.css';

interface Freelancer {
  id: string;
  name: string;
  title: string;
  hourlyRate: number;
  skills: string[];
  rating: number;
  location: string;
  avatarUrl?: string;
}

const PublicFreelancers: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  const [query, setQuery] = useState('');
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchFreelancers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.search.freelancers(query);
      // Map response to Freelancer interface
      // Assuming API returns { freelancers: [...] } or [...]
      const data = Array.isArray(res) ? res : (res.freelancers || []);
      
      const mapped: Freelancer[] = data.map((f: any) => ({
        id: String(f.id),
        name: f.name || 'Unknown',
        title: f.title || f.bio?.substring(0, 50) || 'Freelancer',
        hourlyRate: f.hourly_rate || f.hourlyRate || 0,
        skills: f.skills || [],
        rating: f.rating || 0,
        location: f.location || 'Remote',
        avatarUrl: f.profile_image_url || f.avatarUrl
      }));
      
      setFreelancers(mapped);
    } catch (err) {
      console.error(err);
      setError('Failed to load freelancers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchFreelancers();
  }, []); // Initial load

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchFreelancers();
  };

  return (
    <div className={cn(common.page, themed.page)}>
      <header className={common.header}>
        <h1 className={cn(common.title, themed.title)}>Hire Top Freelancers</h1>
        <p className={cn(common.subtitle, themed.subtitle)}>Find the perfect talent for your next project.</p>
      </header>

      <form onSubmit={handleSearch} className={common.controls}>
        <Input
          id="search"
          placeholder="Search by skill, name, or title..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          iconBefore={<Search size={18} />}
          className={common.searchInput}
        />
        <Button type="submit" variant="primary" size="md">Search</Button>
      </form>

      {loading ? (
        <div className={common.loading}>Loading freelancers...</div>
      ) : error ? (
        <div className={common.error}>{error}</div>
      ) : (
        <div className={common.grid}>
          {freelancers.map(f => (
            <Link href={`/freelancers/${f.id}`} key={f.id} className={cn(common.card, themed.card)}>
              <div className={common.cardHeader}>
                <img 
                  src={f.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=random`} 
                  alt={f.name} 
                  className={common.avatar} 
                />
                <div className={common.cardInfo}>
                  <h3 className={common.name}>{f.name}</h3>
                  <p className={common.role}>{f.title}</p>
                </div>
              </div>
              
              <div className={common.skills}>
                {f.skills.slice(0, 3).map(s => (
                  <span key={s} className={cn(common.skill, themed.skill)}>{s}</span>
                ))}
                {f.skills.length > 3 && <span className={cn(common.skill, themed.skill)}>+{f.skills.length - 3}</span>}
              </div>

              <div className={common.footer}>
                <div className={common.rate}>${f.hourlyRate}/hr</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}>
                  <Star size={14} fill="currentColor" className="text-yellow-400" />
                  <span>{f.rating.toFixed(1)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', opacity: 0.7 }}>
                  <MapPin size={14} />
                  <span>{f.location}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      
      {!loading && !error && freelancers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.7 }}>
          No freelancers found matching your criteria.
        </div>
      )}
    </div>
  );
};

export default PublicFreelancers;
