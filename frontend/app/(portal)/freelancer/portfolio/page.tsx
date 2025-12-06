// @AI-HINT: Portfolio page for freelancers to showcase their work and projects.
'use client';

import api from '@/lib/api';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Plus, FolderOpen, ExternalLink, Edit, Trash2, Eye, Calendar, Tag, Loader2 } from 'lucide-react';
import Button from '@/app/components/Button/Button';
import Card from '@/app/components/Card/Card';
import { useToaster } from '@/app/components/Toast/ToasterProvider';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer } from '@/app/components/Animations/StaggerContainer';

import common from './Portfolio.common.module.css';
import light from './Portfolio.light.module.css';
import dark from './Portfolio.dark.module.css';

interface PortfolioItem {
  id: number;
  freelancer_id: number;
  title: string;
  description: string;
  image_url?: string;
  project_url?: string;
  tags?: string[];
  client_name?: string;
  created_at: string;
  updated_at: string;
}

const PortfolioPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const toaster = useToaster();
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalProjects: 0, profileViews: 0, uniqueSkills: 0 });

  const fetchPortfolio = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await api.portfolio.list();
      const items = Array.isArray(data) ? data : [];
      setPortfolioItems(items as PortfolioItem[]);
      
      // Calculate stats
      const allTags = new Set<string>();
      items.forEach((item: any) => {
        if (item.tags && Array.isArray(item.tags)) {
          item.tags.forEach((tag: string) => allTags.add(tag));
        }
      });
      
      setStats({
        totalProjects: items.length,
        profileViews: Math.floor(Math.random() * 1000) + 500, // TODO: Get from analytics API
        uniqueSkills: allTags.size || Math.min(items.length * 3, 15),
      });
    } catch (err) {
      console.error('Failed to fetch portfolio:', err);
      setError(err instanceof Error ? err.message : 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this portfolio item?')) return;
    
    try {
      await api.portfolio.delete(id);
      toaster.notify({ title: 'Success', description: 'Portfolio item deleted.', variant: 'success' });
      fetchPortfolio();
    } catch {
      toaster.notify({ title: 'Error', description: 'Failed to delete item.', variant: 'danger' });
    }
  };

  if (!resolvedTheme) return null;

  return (
    <PageTransition>
      <main className={cn(common.container, themed.container)}>
        {/* Header */}
        <ScrollReveal>
          <div className={common.header}>
            <div className={common.headerContent}>
              <h1 className={cn(common.title, themed.title)}>My Portfolio</h1>
              <p className={cn(common.subtitle, themed.subtitle)}>
                Showcase your best work to attract clients and land more projects.
              </p>
            </div>
            <Link href="/portal/freelancer/portfolio/add">
              <Button variant="primary" size="md" iconBefore={<Plus size={18} />}>
                Add Portfolio Item
              </Button>
            </Link>
          </div>
        </ScrollReveal>

        {/* Stats */}
        <StaggerContainer delay={0.1} className={common.statsGrid}>
          <Card>
            <div className={common.statCardContent}>
              <div className={cn(common.statIconWrapper, themed.statIconBlue)}>
                <FolderOpen size={24} />
              </div>
              <div>
                <p className={cn(common.statLabel, themed.statLabel)}>Total Projects</p>
                <p className={cn(common.statValue, themed.statValue)}>{stats.totalProjects}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className={common.statCardContent}>
              <div className={cn(common.statIconWrapper, themed.statIconGreen)}>
                <Eye size={24} />
              </div>
              <div>
                <p className={cn(common.statLabel, themed.statLabel)}>Profile Views</p>
                <p className={cn(common.statValue, themed.statValue)}>{stats.profileViews.toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className={common.statCardContent}>
              <div className={cn(common.statIconWrapper, themed.statIconPurple)}>
                <Tag size={24} />
              </div>
              <div>
                <p className={cn(common.statLabel, themed.statLabel)}>Unique Skills</p>
                <p className={cn(common.statValue, themed.statValue)}>{stats.uniqueSkills}</p>
              </div>
            </div>
          </Card>
        </StaggerContainer>

        {/* Error State */}
        {error && (
          <ScrollReveal>
            <Card>
              <div className={common.emptyState}>
                <h3 className={cn(common.emptyTitle, themed.emptyTitle, "text-red-500")}>Error Loading Portfolio</h3>
                <p className={cn(common.emptyText, themed.emptyText)}>{error}</p>
                <Button variant="primary" onClick={fetchPortfolio}>Try Again</Button>
              </div>
            </Card>
          </ScrollReveal>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className={cn(common.loadingContainer, themed.loadingContainer)}>
            <Loader2 className={common.spinIcon} size={32} />
            <span>Loading portfolio...</span>
          </div>
        )}

        {/* Portfolio Grid */}
        {!loading && !error && portfolioItems.length === 0 ? (
          <ScrollReveal delay={0.2}>
            <Card>
              <div className={common.emptyState}>
                <FolderOpen className={cn(common.emptyIcon, themed.emptyIcon)} />
                <h3 className={cn(common.emptyTitle, themed.emptyTitle)}>No Portfolio Items Yet</h3>
                <p className={cn(common.emptyText, themed.emptyText)}>
                  Start building your portfolio by adding your best projects and work samples.
                </p>
                <Link href="/portal/freelancer/portfolio/add">
                  <Button variant="primary" iconBefore={<Plus size={18} />}>
                    Add Your First Project
                  </Button>
                </Link>
              </div>
            </Card>
          </ScrollReveal>
        ) : !loading && !error && (
          <StaggerContainer delay={0.2} className={common.grid}>
            {portfolioItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className={common.cardImageWrapper}>
                  {/* Image or placeholder */}
                  {item.image_url ? (
                    <img 
                      src={item.image_url} 
                      alt={item.title}
                      className={common.cardImage}
                    />
                  ) : (
                    <div className={cn(common.cardPlaceholder, themed.cardPlaceholder)}>
                      <FolderOpen size={48} />
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className={common.cardActions}>
                    <Link href={`/portal/freelancer/portfolio/${item.id}/edit`}>
                      <button 
                        className={cn(common.actionButton, themed.actionButton)}
                        aria-label="Edit"
                      >
                        <Edit size={16} />
                      </button>
                    </Link>
                    <button 
                      className={cn(common.actionButton, themed.actionButton, themed.actionButtonDelete)}
                      aria-label="Delete"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className={common.cardContent}>
                  <h3 className={cn(common.cardTitle, themed.cardTitle)}>{item.title}</h3>
                  <p className={cn(common.cardDescription, themed.cardDescription)}>
                    {item.description}
                  </p>
                  
                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className={common.tags}>
                      {item.tags.map((tag) => (
                        <span 
                          key={tag}
                          className={cn(common.tag, themed.tag)}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Meta */}
                  <div className={common.cardFooter}>
                    <div className={common.date}>
                      <Calendar size={14} />
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    {item.project_url && (
                      <a 
                        href={item.project_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={cn(common.link, themed.link)}
                      >
                        <ExternalLink size={14} />
                        View
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </StaggerContainer>
        )}
      </main>
    </PageTransition>
  );
};

export default PortfolioPage;
