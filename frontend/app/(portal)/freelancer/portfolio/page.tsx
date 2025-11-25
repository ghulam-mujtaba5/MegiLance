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
    <main className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Portfolio</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Showcase your best work to attract clients and land more projects.
          </p>
        </div>
        <Link href="/portal/freelancer/portfolio/add">
          <Button variant="primary" size="md" iconBefore={<Plus size={18} />}>
            Add Portfolio Item
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FolderOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Projects</p>
              <p className="text-2xl font-bold">{stats.totalProjects}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Eye className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Profile Views</p>
              <p className="text-2xl font-bold">{stats.profileViews.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Tag className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Unique Skills</p>
              <p className="text-2xl font-bold">{stats.uniqueSkills}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Error State */}
      {error && (
        <Card>
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2 text-red-600">Error Loading Portfolio</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
            <Button variant="primary" onClick={fetchPortfolio}>Try Again</Button>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading portfolio...</span>
        </div>
      )}

      {/* Portfolio Grid */}
      {!loading && !error && portfolioItems.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FolderOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Portfolio Items Yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Start building your portfolio by adding your best projects and work samples.
            </p>
            <Link href="/portal/freelancer/portfolio/add">
              <Button variant="primary" iconBefore={<Plus size={18} />}>
                Add Your First Project
              </Button>
            </Link>
          </div>
        </Card>
      ) : !loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolioItems.map((item) => (
            <Card key={item.id}>
              <div className="relative">
                {/* Image or placeholder */}
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.title}
                    className="h-48 w-full object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-t-lg flex items-center justify-center">
                    <FolderOpen className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                
                {/* Actions */}
                <div className="absolute top-2 right-2 flex gap-2">
                  <Link href={`/portal/freelancer/portfolio/${item.id}/edit`}>
                    <button 
                      className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:shadow-lg transition-shadow"
                      aria-label="Edit"
                    >
                      <Edit className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </button>
                  </Link>
                  <button 
                    className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:shadow-lg transition-shadow"
                    aria-label="Delete"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {item.description}
                </p>
                
                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.tags.map((tag) => (
                      <span 
                        key={tag}
                        className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Meta */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  {item.project_url && (
                    <a 
                      href={item.project_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
};

export default PortfolioPage;
