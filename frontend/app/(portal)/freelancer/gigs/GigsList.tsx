// @AI-HINT: Freelancer gigs management page - list, filter, and manage gigs
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  MoreVertical,
  Package,
  DollarSign,
  Star,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from 'lucide-react';

import common from './GigsList.common.module.css';
import light from './GigsList.light.module.css';
import dark from './GigsList.dark.module.css';

interface Gig {
  id: string;
  slug: string;
  title: string;
  category: string;
  thumbnail: string;
  status: 'active' | 'paused' | 'draft' | 'pending' | 'rejected';
  impressions: number;
  clicks: number;
  orders: number;
  rating: number;
  reviewCount: number;
  earnings: number;
  startingPrice: number;
  createdAt: string;
}

const mockGigs: Gig[] = [
  {
    id: '1',
    slug: 'professional-web-development',
    title: 'I will build a professional website using React and Next.js',
    category: 'Programming & Tech',
    thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400',
    status: 'active',
    impressions: 2450,
    clicks: 342,
    orders: 28,
    rating: 4.9,
    reviewCount: 24,
    earnings: 4200,
    startingPrice: 150,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    slug: 'modern-logo-design',
    title: 'I will design a modern, minimalist logo for your brand',
    category: 'Graphics & Design',
    thumbnail: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400',
    status: 'active',
    impressions: 1820,
    clicks: 256,
    orders: 19,
    rating: 4.8,
    reviewCount: 17,
    earnings: 1900,
    startingPrice: 75,
    createdAt: '2024-02-01',
  },
  {
    id: '3',
    slug: 'seo-optimization',
    title: 'I will optimize your website for search engines (SEO)',
    category: 'Digital Marketing',
    thumbnail: 'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=400',
    status: 'paused',
    impressions: 980,
    clicks: 124,
    orders: 8,
    rating: 4.7,
    reviewCount: 7,
    earnings: 800,
    startingPrice: 100,
    createdAt: '2024-02-15',
  },
  {
    id: '4',
    slug: 'video-editing-pro',
    title: 'I will edit your videos professionally with effects and transitions',
    category: 'Video & Animation',
    thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400',
    status: 'draft',
    impressions: 0,
    clicks: 0,
    orders: 0,
    rating: 0,
    reviewCount: 0,
    earnings: 0,
    startingPrice: 50,
    createdAt: '2024-03-01',
  },
];

const GigsList: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Fetch gigs from API
    const fetchGigs = async () => {
      try {
        const response = await fetch('/backend/api/gigs/my-gigs', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setGigs(data);
        } else {
          // Use mock data for demo
          setGigs(mockGigs);
        }
      } catch (error) {
        setGigs(mockGigs);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGigs();
  }, []);

  if (!resolvedTheme) return null;

  const themed = resolvedTheme === 'dark' ? dark : light;

  // Filter and sort gigs
  const filteredGigs = gigs
    .filter(gig => {
      const matchesSearch = gig.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || gig.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'orders':
          return b.orders - a.orders;
        case 'earnings':
          return b.earnings - a.earnings;
        case 'rating':
          return b.rating - a.rating;
        default: // newest
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  // Stats
  const stats = {
    total: gigs.length,
    active: gigs.filter(g => g.status === 'active').length,
    totalOrders: gigs.reduce((sum, g) => sum + g.orders, 0),
    totalEarnings: gigs.reduce((sum, g) => sum + g.earnings, 0),
  };

  const getStatusBadge = (status: Gig['status']) => {
    const statusClasses: Record<Gig['status'], string> = {
      active: themed.statusActive,
      paused: themed.statusPaused,
      draft: themed.statusDraft,
      pending: themed.statusPending,
      rejected: themed.statusRejected,
    };
    return cn(common.statusBadge, statusClasses[status]);
  };

  const handleToggleStatus = (gigId: string, currentStatus: Gig['status']) => {
    // Toggle between active and paused
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    setGigs(prev =>
      prev.map(g =>
        g.id === gigId ? { ...g, status: newStatus } : g
      )
    );
  };

  const handleDelete = (gigId: string) => {
    if (window.confirm('Are you sure you want to delete this gig?')) {
      setGigs(prev => prev.filter(g => g.id !== gigId));
    }
  };

  if (isLoading) {
    return (
      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            Loading gigs...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        {/* Header */}
        <header className={common.header}>
          <div className={common.headerTop}>
            <div>
              <h1 className={cn(common.headerTitle, themed.headerTitle)}>My Gigs</h1>
              <p className={cn(common.headerSubtitle, themed.headerSubtitle)}>
                Manage your services and track performance
              </p>
            </div>
            <Link href="/freelancer/gigs/create" className={cn(common.createButton, themed.createButton)}>
              <Plus size={20} />
              Create New Gig
            </Link>
          </div>
        </header>

        {/* Stats Bar */}
        <div className={common.statsBar}>
          <div className={cn(common.statCard, themed.statCard)}>
            <span className={cn(common.statLabel, themed.statLabel)}>Total Gigs</span>
            <span className={cn(common.statValue, themed.statValue)}>{stats.total}</span>
          </div>
          <div className={cn(common.statCard, themed.statCard)}>
            <span className={cn(common.statLabel, themed.statLabel)}>Active Gigs</span>
            <span className={cn(common.statValue, themed.statValue)}>{stats.active}</span>
          </div>
          <div className={cn(common.statCard, themed.statCard)}>
            <span className={cn(common.statLabel, themed.statLabel)}>Total Orders</span>
            <span className={cn(common.statValue, themed.statValue)}>{stats.totalOrders}</span>
          </div>
          <div className={cn(common.statCard, themed.statCard)}>
            <span className={cn(common.statLabel, themed.statLabel)}>Total Earnings</span>
            <span className={cn(common.statValue, themed.statValue)}>${stats.totalEarnings.toLocaleString()}</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className={common.toolbar}>
          <div className={cn(common.searchBox, themed.searchBox)}>
            <Search size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search gigs..."
              className={cn(common.searchInput, themed.searchInput)}
            />
          </div>
          <div className={common.filters}>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className={cn(common.filterSelect, themed.filterSelect)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending Review</option>
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className={cn(common.filterSelect, themed.filterSelect)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="orders">Most Orders</option>
              <option value="earnings">Highest Earnings</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Gigs Table */}
        {filteredGigs.length === 0 ? (
          <div className={cn(common.emptyState, themed.emptyState)}>
            <div className={cn(common.emptyIcon, themed.emptyIcon)}>
              <Package size={40} />
            </div>
            <h2 className={cn(common.emptyTitle, themed.emptyTitle)}>
              {gigs.length === 0 ? 'No gigs yet' : 'No matching gigs'}
            </h2>
            <p className={cn(common.emptyText, themed.emptyText)}>
              {gigs.length === 0
                ? 'Create your first gig and start selling your services.'
                : 'Try adjusting your search or filter criteria.'}
            </p>
            {gigs.length === 0 && (
              <Link href="/freelancer/gigs/create">
                <Button variant="primary">Create Your First Gig</Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <table className={cn(common.gigsTable, themed.gigsTable)}>
              <thead>
                <tr>
                  <th>Gig</th>
                  <th>Status</th>
                  <th>Performance</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGigs.map(gig => (
                  <tr key={gig.id} onClick={() => router.push(`/gigs/${gig.slug}`)}>
                    <td>
                      <div className={common.gigCell}>
                        <img
                          src={gig.thumbnail}
                          alt={gig.title}
                          className={common.gigThumbnail}
                        />
                        <div className={common.gigInfo}>
                          <div className={cn(common.gigTitle, themed.gigTitle)}>
                            {gig.title}
                          </div>
                          <div className={cn(common.gigCategory, themed.gigCategory)}>
                            {gig.category}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <span className={getStatusBadge(gig.status)}>
                        <span className={common.statusDot} />
                        {gig.status.charAt(0).toUpperCase() + gig.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className={common.statsCell}>
                        <div className={cn(common.statItem, themed.statItem)}>
                          <ShoppingCart size={14} />
                          {gig.orders} orders
                        </div>
                        <div className={cn(common.statItem, themed.statItem)}>
                          <Star size={14} />
                          {gig.rating > 0 ? `${gig.rating} (${gig.reviewCount})` : 'No reviews'}
                        </div>
                        <div className={cn(common.statItem, themed.statItem)}>
                          <DollarSign size={14} />
                          ${gig.earnings.toLocaleString()} earned
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>${gig.startingPrice}</strong>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className={common.actions}>
                        <Link href={`/gigs/${gig.slug}`}>
                          <button className={cn(common.actionButton, themed.actionButton, themed.actionView)}>
                            <Eye size={16} />
                          </button>
                        </Link>
                        <Link href={`/freelancer/gigs/${gig.id}/edit`}>
                          <button className={cn(common.actionButton, themed.actionButton, themed.actionEdit)}>
                            <Edit2 size={16} />
                          </button>
                        </Link>
                        {(gig.status === 'active' || gig.status === 'paused') && (
                          <button
                            className={cn(common.actionButton, themed.actionButton)}
                            onClick={() => handleToggleStatus(gig.id, gig.status)}
                          >
                            {gig.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                          </button>
                        )}
                        <button
                          className={cn(common.actionButton, themed.actionButton, themed.actionDelete)}
                          onClick={() => handleDelete(gig.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className={common.gigsCards}>
              {filteredGigs.map(gig => (
                <div key={gig.id} className={cn(common.gigCard, themed.gigCard)}>
                  <img
                    src={gig.thumbnail}
                    alt={gig.title}
                    className={common.gigCardImage}
                  />
                  <div className={common.gigCardContent}>
                    <div className={common.gigCardHeader}>
                      <div className={cn(common.gigCardTitle, themed.gigCardTitle)}>
                        {gig.title}
                      </div>
                      <span className={getStatusBadge(gig.status)}>
                        <span className={common.statusDot} />
                        {gig.status}
                      </span>
                    </div>
                    <div className={common.gigCardStats}>
                      <div className={common.gigCardStat}>
                        <div className={cn(common.gigCardStatValue, themed.gigCardStatValue)}>
                          {gig.orders}
                        </div>
                        <div className={cn(common.gigCardStatLabel, themed.gigCardStatLabel)}>
                          Orders
                        </div>
                      </div>
                      <div className={common.gigCardStat}>
                        <div className={cn(common.gigCardStatValue, themed.gigCardStatValue)}>
                          {gig.rating > 0 ? gig.rating.toFixed(1) : '-'}
                        </div>
                        <div className={cn(common.gigCardStatLabel, themed.gigCardStatLabel)}>
                          Rating
                        </div>
                      </div>
                      <div className={common.gigCardStat}>
                        <div className={cn(common.gigCardStatValue, themed.gigCardStatValue)}>
                          ${gig.earnings}
                        </div>
                        <div className={cn(common.gigCardStatLabel, themed.gigCardStatLabel)}>
                          Earned
                        </div>
                      </div>
                    </div>
                    <div className={common.gigCardActions}>
                      <Link href={`/gigs/${gig.slug}`}>
                        <Button variant="outline" size="sm" fullWidth>
                          <Eye size={16} /> View
                        </Button>
                      </Link>
                      <Link href={`/freelancer/gigs/${gig.id}/edit`}>
                        <Button variant="primary" size="sm" fullWidth>
                          <Edit2 size={16} /> Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {filteredGigs.length > 10 && (
              <div className={common.pagination}>
                <button
                  className={cn(common.paginationButton, themed.paginationButton)}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  <ChevronLeft size={18} />
                </button>
                <div className={common.paginationPages}>
                  {[1, 2, 3].map(page => (
                    <button
                      key={page}
                      className={cn(
                        common.pageButton,
                        themed.pageButton,
                        currentPage === page && themed.pageButtonActive
                      )}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  className={cn(common.paginationButton, themed.paginationButton)}
                  disabled={currentPage === 3}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default GigsList;
