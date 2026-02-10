// @AI-HINT: Gigs marketplace page - browse all gigs with filters, search, categories
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import GigCard from '@/app/components/GigCard/GigCard';
import Button from '@/app/components/Button/Button';
import {
  Search,
  SlidersHorizontal,
  X,
  Star,
  Check,
  ChevronRight,
  Sparkles,
  Grid3X3,
  List,
  RefreshCw,
  Code,
  Palette,
  Video,
  PenTool,
  BarChart3,
  Megaphone,
  Music,
  BookOpen,
  Gamepad2,
  Camera,
  Briefcase,
  Package,
} from 'lucide-react';

import common from './Gigs.common.module.css';
import light from './Gigs.light.module.css';
import dark from './Gigs.dark.module.css';

// Categories with icons
const categories = [
  { id: 'all', name: 'All Categories', icon: Grid3X3 },
  { id: 'programming', name: 'Programming & Tech', icon: Code },
  { id: 'design', name: 'Graphics & Design', icon: Palette },
  { id: 'video', name: 'Video & Animation', icon: Video },
  { id: 'writing', name: 'Writing & Translation', icon: PenTool },
  { id: 'digital-marketing', name: 'Digital Marketing', icon: Megaphone },
  { id: 'music', name: 'Music & Audio', icon: Music },
  { id: 'business', name: 'Business', icon: Briefcase },
  { id: 'data', name: 'Data', icon: BarChart3 },
  { id: 'photography', name: 'Photography', icon: Camera },
  { id: 'education', name: 'Education', icon: BookOpen },
  { id: 'gaming', name: 'Gaming', icon: Gamepad2 },
];

// Seller levels for filtering
const sellerLevels = [
  { id: 'any', label: 'Any Level' },
  { id: 'platinum', label: 'Platinum Seller' },
  { id: 'gold', label: 'Gold Seller' },
  { id: 'silver', label: 'Silver Seller' },
  { id: 'bronze', label: 'Bronze Seller' },
];

// Delivery times
const deliveryTimes = [
  { id: 'any', label: 'Any' },
  { id: '24h', label: '24 hours' },
  { id: '3d', label: '3 days' },
  { id: '7d', label: '7 days' },
  { id: '14d', label: '14 days' },
];

interface Gig {
  id: number;
  title: string;
  slug: string;
  thumbnail_url?: string;
  seller_id: number;
  seller_username: string;
  seller_avatar?: string;
  seller_level?: 'new_seller' | 'bronze' | 'silver' | 'gold' | 'platinum';
  starting_price: number;
  average_rating?: number;
  total_reviews?: number;
  category?: string;
  tags?: string[];
  is_featured?: boolean;
  is_pro_seller?: boolean;
}

interface GigsFilters {
  category: string;
  minPrice?: number;
  maxPrice?: number;
  sellerLevel: string;
  minRating: number;
  deliveryTime: string;
  search: string;
}

const Gigs: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [gigs, setGigs] = useState<Gig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('recommended');
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const [filters, setFilters] = useState<GigsFilters>({
    category: searchParams.get('category') || 'all',
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    sellerLevel: searchParams.get('level') || 'any',
    minRating: searchParams.get('rating') ? Number(searchParams.get('rating')) : 0,
    deliveryTime: searchParams.get('delivery') || 'any',
    search: searchParams.get('q') || '',
  });

  if (!resolvedTheme) return null;

  const themed = resolvedTheme === 'dark' ? dark : light;

  // Fetch gigs from API
  useEffect(() => {
    const fetchGigs = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.category !== 'all') params.set('category', filters.category);
        if (filters.search) params.set('search', filters.search);
        if (filters.minPrice) params.set('min_price', filters.minPrice.toString());
        if (filters.maxPrice) params.set('max_price', filters.maxPrice.toString());
        if (filters.sellerLevel !== 'any') params.set('seller_level', filters.sellerLevel);
        if (filters.minRating > 0) params.set('min_rating', filters.minRating.toString());
        params.set('sort', sortBy);

        const response = await fetch(`/api/gigs?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setGigs(data.gigs || data || []);
        } else {
          // Use mock data if API fails
          setGigs(getMockGigs());
        }
      } catch (error) {
        console.error('Failed to fetch gigs:', error);
        setGigs(getMockGigs());
      } finally {
        setIsLoading(false);
      }
    };

    fetchGigs();
  }, [filters, sortBy]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.category !== 'all') params.set('category', filters.category);
    if (filters.search) params.set('q', filters.search);
    if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
    if (filters.sellerLevel !== 'any') params.set('level', filters.sellerLevel);
    if (filters.minRating > 0) params.set('rating', filters.minRating.toString());
    if (filters.deliveryTime !== 'any') params.set('delivery', filters.deliveryTime);

    const newUrl = params.toString() ? `/gigs?${params.toString()}` : '/gigs';
    window.history.replaceState({}, '', newUrl);
  }, [filters]);

  const handleFilterChange = useCallback((key: keyof GigsFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      category: 'all',
      minPrice: undefined,
      maxPrice: undefined,
      sellerLevel: 'any',
      minRating: 0,
      deliveryTime: 'any',
      search: '',
    });
  }, []);

  const handleFavoriteToggle = useCallback((id: number) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.category !== 'all') count++;
    if (filters.minPrice !== undefined) count++;
    if (filters.maxPrice !== undefined) count++;
    if (filters.sellerLevel !== 'any') count++;
    if (filters.minRating > 0) count++;
    if (filters.deliveryTime !== 'any') count++;
    return count;
  }, [filters]);

  const featuredGigs = useMemo(() => gigs.filter(g => g.is_featured), [gigs]);

  const renderStars = (count: number) => (
    <div className={common.ratingStars}>
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={14} fill={i < count ? '#ffc107' : 'none'} color={i < count ? '#ffc107' : '#94a3b8'} />
      ))}
    </div>
  );

  const renderFilters = () => (
    <>
      {/* Seller Level */}
      <div className={common.filterGroup}>
        <span className={cn(common.filterLabel, themed.filterLabel)}>Seller Level</span>
        <div className={common.filterOptions}>
          {sellerLevels.map(level => (
            <label key={level.id} className={common.filterOption}>
              <span className={cn(common.filterCheckbox, filters.sellerLevel === level.id && 'checked')}>
                {filters.sellerLevel === level.id && <Check size={12} />}
              </span>
              <span className={cn(common.filterOptionText, themed.filterOptionText)} onClick={() => handleFilterChange('sellerLevel', level.id)}>
                {level.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className={common.filterGroup}>
        <span className={cn(common.filterLabel, themed.filterLabel)}>Budget</span>
        <div className={common.priceRange}>
          <div className={common.priceInputs}>
            <div className={common.priceInputWrapper}>
              <span className={common.priceInputLabel}>Min</span>
              <input
                type="number"
                placeholder="$5"
                value={filters.minPrice || ''}
                onChange={e => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                className={cn(common.priceInput, themed.priceInput)}
                aria-label="Minimum price"
              />
            </div>
            <span className={common.priceDivider}>—</span>
            <div className={common.priceInputWrapper}>
              <span className={common.priceInputLabel}>Max</span>
              <input
                type="number"
                placeholder="$1000"
                value={filters.maxPrice || ''}
                onChange={e => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                className={cn(common.priceInput, themed.priceInput)}
                aria-label="Maximum price"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Minimum Rating */}
      <div className={common.filterGroup}>
        <span className={cn(common.filterLabel, themed.filterLabel)}>Seller Rating</span>
        <div className={common.ratingOptions}>
          {[4, 3, 2, 1].map(rating => (
            <label key={rating} className={common.ratingOption} onClick={() => handleFilterChange('minRating', rating)}>
              {renderStars(rating)}
              <span className={cn(common.ratingText, themed.ratingText)}>& up</span>
            </label>
          ))}
        </div>
      </div>

      {/* Delivery Time */}
      <div className={common.filterGroup}>
        <span className={cn(common.filterLabel, themed.filterLabel)}>Delivery Time</span>
        <div className={common.deliveryOptions}>
          {deliveryTimes.map(time => (
            <button
              key={time.id}
              onClick={() => handleFilterChange('deliveryTime', time.id)}
              className={cn(
                common.deliveryChip,
                themed.deliveryChip,
                filters.deliveryTime === time.id && common.deliveryChipActive,
                filters.deliveryTime === time.id && themed.deliveryChipActive
              )}
            >
              {time.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <button className={cn(common.clearFilters, themed.clearFilters)} onClick={handleClearFilters}>
          <RefreshCw size={14} />
          Clear all filters
        </button>
      )}
    </>
  );

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        {/* Header */}
        <header className={common.header}>
          <div className={common.headerTop}>
            <div className={common.headerContent}>
              <h1 className={cn(common.title, themed.title)}>Explore Services</h1>
              <p className={cn(common.subtitle, themed.subtitle)}>
                Find the perfect freelance services for your business
              </p>
            </div>
            <div className={common.headerActions}>
              <Link href="/freelancer/gigs/create">
                <Button variant="primary" size="md">
                  <Package size={16} />
                  Sell a Service
                </Button>
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <div className={common.searchSection}>
            <div className={cn(common.searchBar, themed.searchBar)}>
              <Search className={common.searchIcon} size={20} />
              <input
                type="text"
                placeholder="Search for any service..."
                value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)}
                className={cn(common.searchInput, themed.searchInput)}
                aria-label="Search gigs"
              />
            </div>
            <button
              className={cn(common.filterButton, themed.filterButton)}
              onClick={() => setShowMobileFilters(true)}
            >
              <SlidersHorizontal size={18} />
              Filters
              {activeFiltersCount > 0 && (
                <span className={cn(common.filterBadge, themed.filterBadge)}>{activeFiltersCount}</span>
              )}
            </button>
          </div>
        </header>

        {/* Categories */}
        <div className={common.categoriesSection}>
          <div className={common.categoriesWrapper}>
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleFilterChange('category', cat.id)}
                  className={cn(
                    common.categoryChip,
                    themed.categoryChip,
                    filters.category === cat.id && common.categoryChipActive,
                    filters.category === cat.id && themed.categoryChipActive
                  )}
                >
                  <span className={common.categoryIcon}>
                    <Icon size={16} />
                  </span>
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className={common.mainContent}>
          {/* Sidebar - Desktop */}
          <aside className={common.sidebar}>
            <div className={cn(common.sidebarCard, themed.sidebarCard)}>
              {renderFilters()}
            </div>
          </aside>

          {/* Content Area */}
          <div className={common.contentArea}>
            {/* Featured Section */}
            {featuredGigs.length > 0 && filters.category === 'all' && !filters.search && (
              <section className={common.featuredSection}>
                <div className={common.sectionHeader}>
                  <h2 className={cn(common.sectionTitle, themed.sectionTitle)}>
                    <Sparkles size={20} />
                    Featured Services
                  </h2>
                  <Link href="/gigs?featured=true" className={cn(common.sectionLink, themed.sectionLink)}>
                    See all <ChevronRight size={16} />
                  </Link>
                </div>
                <div className={common.featuredScroll}>
                  {featuredGigs.slice(0, 5).map(gig => (
                    <div key={gig.id} className={common.featuredCard}>
                      <GigCard
                        id={gig.id}
                        title={gig.title}
                        slug={gig.slug}
                        thumbnailUrl={gig.thumbnail_url}
                        seller={{
                          id: gig.seller_id,
                          username: gig.seller_username,
                          name: gig.seller_username,
                          avatarUrl: gig.seller_avatar,
                          level: gig.seller_level || 'new_seller',
                        }}
                        startingPrice={gig.starting_price}
                        averageRating={gig.average_rating ?? 0}
                        totalReviews={gig.total_reviews ?? 0}
                        category={gig.category}
                        tags={gig.tags}
                        isFeatured={gig.is_featured}
                        isProSeller={gig.is_pro_seller}
                        isFavorited={favorites.has(gig.id)}
                        onFavoriteToggle={() => handleFavoriteToggle(gig.id)}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Results Header */}
            <div className={common.resultsHeader}>
              <div className={cn(common.resultsCount, themed.resultsCount)}>
                <span className={cn(common.resultsCountNumber, themed.resultsCountNumber)}>{gigs.length}</span> services available
              </div>
              <div className={common.sortViewControls}>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className={cn(common.sortSelect, themed.sortSelect)}
                  aria-label="Sort gigs by"
                >
                  <option value="recommended">Recommended</option>
                  <option value="best_selling">Best Selling</option>
                  <option value="newest">Newest</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
                <div className={cn(common.viewToggle, themed.viewToggle)}>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(common.viewButton, themed.viewButton, viewMode === 'grid' && common.viewButtonActive, viewMode === 'grid' && themed.viewButtonActive)}
                  >
                    <Grid3X3 size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(common.viewButton, themed.viewButton, viewMode === 'list' && common.viewButtonActive, viewMode === 'list' && themed.viewButtonActive)}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Gigs Grid */}
            {isLoading ? (
              <div className={common.loadingGrid}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={cn(common.skeletonCard, themed.skeletonCard)}>
                    <div className={cn(common.skeletonImage, themed.skeletonImage)} />
                    <div className={common.skeletonContent}>
                      <div className={cn(common.skeletonLine, themed.skeletonLine)} />
                      <div className={cn(common.skeletonLine, themed.skeletonLine)} />
                      <div className={cn(common.skeletonLine, themed.skeletonLine)} />
                    </div>
                  </div>
                ))}
              </div>
            ) : gigs.length === 0 ? (
              <div className={common.emptyState}>
                <Package className={common.emptyIcon} />
                <h3 className={cn(common.emptyTitle, themed.emptyTitle)}>No services found</h3>
                <p className={cn(common.emptyText, themed.emptyText)}>
                  Try adjusting your search or filter criteria to find what you&apos;re looking for.
                </p>
                <button className={cn(common.emptyButton, themed.emptyButton)} onClick={handleClearFilters}>
                  <RefreshCw size={16} />
                  Clear filters
                </button>
              </div>
            ) : (
              <div className={common.loadingGrid}>
                {gigs.map(gig => (
                  <GigCard
                    key={gig.id}
                    id={gig.id}
                    title={gig.title}
                    slug={gig.slug}
                    thumbnailUrl={gig.thumbnail_url}
                    seller={{
                      id: gig.seller_id,
                      username: gig.seller_username,
                      name: gig.seller_username,
                      avatarUrl: gig.seller_avatar,
                      level: gig.seller_level || 'new_seller',
                    }}
                    startingPrice={gig.starting_price}
                    averageRating={gig.average_rating ?? 0}
                    totalReviews={gig.total_reviews ?? 0}
                    category={gig.category}
                    tags={gig.tags}
                    isFeatured={gig.is_featured}
                    isProSeller={gig.is_pro_seller}
                    isFavorited={favorites.has(gig.id)}
                    onFavoriteToggle={() => handleFavoriteToggle(gig.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Filters Modal */}
        {showMobileFilters && (
          <div className={common.mobileFiltersOverlay}>
            <div className={common.mobileFiltersBackdrop} onClick={() => setShowMobileFilters(false)} />
            <div className={cn(common.mobileFiltersContent, themed.mobileFiltersContent)}>
              <div className={cn(common.mobileFiltersHeader, themed.mobileFiltersHeader)}>
                <h3 className={cn(common.mobileFiltersTitle, themed.mobileFiltersTitle)}>Filters</h3>
                <button className={cn(common.mobileFiltersClose, themed.mobileFiltersClose)} onClick={() => setShowMobileFilters(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className={common.mobileFiltersBody}>
                {renderFilters()}
              </div>
              <div className={cn(common.mobileFiltersFooter, themed.mobileFiltersFooter)}>
                <button className={cn(common.mobileFiltersClear, themed.mobileFiltersClear)} onClick={handleClearFilters}>
                  Clear all
                </button>
                <button className={cn(common.mobileFiltersApply, themed.mobileFiltersApply)} onClick={() => setShowMobileFilters(false)}>
                  Show {gigs.length} results
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

// Mock data for development/fallback
function getMockGigs(): Gig[] {
  return [
    {
      id: 1,
      title: 'I will create a professional website using React and Next.js',
      slug: 'professional-react-nextjs-website',
      thumbnail_url: '/images/gigs/web-dev.jpg',
      seller_id: 1,
      seller_username: 'dev_expert',
      seller_level: 'platinum',
      starting_price: 150,
      average_rating: 4.9,
      total_reviews: 234,
      category: 'programming',
      tags: ['react', 'nextjs', 'web development'],
      is_featured: true,
      is_pro_seller: true,
    },
    {
      id: 2,
      title: 'I will design a modern logo for your brand',
      slug: 'modern-brand-logo-design',
      thumbnail_url: '/images/gigs/logo-design.jpg',
      seller_id: 2,
      seller_username: 'creative_studio',
      seller_level: 'gold',
      starting_price: 50,
      average_rating: 4.8,
      total_reviews: 156,
      category: 'design',
      tags: ['logo', 'branding', 'graphic design'],
      is_featured: true,
    },
    {
      id: 3,
      title: 'I will write SEO optimized blog posts and articles',
      slug: 'seo-blog-posts-articles',
      thumbnail_url: '/images/gigs/content-writing.jpg',
      seller_id: 3,
      seller_username: 'content_pro',
      seller_level: 'silver',
      starting_price: 25,
      average_rating: 4.7,
      total_reviews: 89,
      category: 'writing',
      tags: ['SEO', 'blog', 'content writing'],
    },
    {
      id: 4,
      title: 'I will create explainer videos with animation',
      slug: 'explainer-videos-animation',
      thumbnail_url: '/images/gigs/video-animation.jpg',
      seller_id: 4,
      seller_username: 'motion_arts',
      seller_level: 'gold',
      starting_price: 200,
      average_rating: 4.9,
      total_reviews: 112,
      category: 'video',
      tags: ['animation', 'explainer video', 'motion graphics'],
      is_featured: true,
    },
    {
      id: 5,
      title: 'I will manage your social media marketing',
      slug: 'social-media-marketing-management',
      thumbnail_url: '/images/gigs/social-media.jpg',
      seller_id: 5,
      seller_username: 'digital_guru',
      seller_level: 'bronze',
      starting_price: 75,
      average_rating: 4.5,
      total_reviews: 45,
      category: 'digital-marketing',
      tags: ['social media', 'marketing', 'SMM'],
    },
    {
      id: 6,
      title: 'I will develop a mobile app for iOS and Android',
      slug: 'mobile-app-ios-android',
      thumbnail_url: '/images/gigs/mobile-app.jpg',
      seller_id: 6,
      seller_username: 'app_wizard',
      seller_level: 'platinum',
      starting_price: 500,
      average_rating: 5.0,
      total_reviews: 78,
      category: 'programming',
      tags: ['mobile app', 'iOS', 'Android', 'React Native'],
      is_pro_seller: true,
    },
    {
      id: 7,
      title: 'I will create custom illustrations for your project',
      slug: 'custom-illustrations-project',
      thumbnail_url: '/images/gigs/illustration.jpg',
      seller_id: 7,
      seller_username: 'art_house',
      seller_level: 'silver',
      starting_price: 80,
      average_rating: 4.8,
      total_reviews: 67,
      category: 'design',
      tags: ['illustration', 'digital art', 'custom art'],
    },
    {
      id: 8,
      title: 'I will do data analysis and visualization',
      slug: 'data-analysis-visualization',
      thumbnail_url: '/images/gigs/data-analysis.jpg',
      seller_id: 8,
      seller_username: 'data_ninja',
      seller_level: 'gold',
      starting_price: 100,
      average_rating: 4.6,
      total_reviews: 54,
      category: 'data',
      tags: ['data analysis', 'visualization', 'Python', 'Excel'],
    },
  ];
}

export default Gigs;
