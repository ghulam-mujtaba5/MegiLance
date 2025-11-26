// @AI-HINT: Portfolio showcase public view page - displays freelancer portfolio items
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import commonStyles from './PortfolioShowcase.common.module.css';
import lightStyles from './PortfolioShowcase.light.module.css';
import darkStyles from './PortfolioShowcase.dark.module.css';

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  thumbnailUrl: string;
  images: string[];
  projectUrl?: string;
  clientName?: string;
  completedAt: string;
  featured: boolean;
}

interface FreelancerProfile {
  id: string;
  name: string;
  title: string;
  avatarUrl: string;
  bio: string;
  skills: string[];
  rating: number;
  totalReviews: number;
  completedProjects: number;
  memberSince: string;
  location: string;
  hourlyRate: number;
  availability: 'available' | 'busy' | 'unavailable';
}

export default function PortfolioShowcasePage() {
  const { resolvedTheme } = useTheme();
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    // Simulated API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setProfile({
      id: '1',
      name: 'Sarah Johnson',
      title: 'Full-Stack Developer & UI/UX Designer',
      avatarUrl: '/avatars/sarah.jpg',
      bio: 'Passionate developer with 8+ years of experience building beautiful, performant web applications. Specialized in React, Node.js, and modern design systems.',
      skills: ['React', 'Node.js', 'TypeScript', 'Figma', 'PostgreSQL', 'AWS'],
      rating: 4.9,
      totalReviews: 127,
      completedProjects: 89,
      memberSince: '2020-03-15',
      location: 'San Francisco, CA',
      hourlyRate: 95,
      availability: 'available'
    });
    
    setPortfolioItems([
      {
        id: '1',
        title: 'E-Commerce Platform Redesign',
        description: 'Complete redesign and development of a modern e-commerce platform with improved UX, faster checkout, and mobile-first approach. Increased conversion rate by 35%.',
        category: 'Web Development',
        tags: ['React', 'Node.js', 'Stripe', 'E-commerce'],
        thumbnailUrl: '/portfolio/ecommerce-thumb.jpg',
        images: ['/portfolio/ecommerce-1.jpg', '/portfolio/ecommerce-2.jpg'],
        projectUrl: 'https://example.com',
        clientName: 'Fashion Co.',
        completedAt: '2024-01-15',
        featured: true
      },
      {
        id: '2',
        title: 'SaaS Dashboard UI Kit',
        description: 'Comprehensive UI kit for SaaS applications featuring 50+ components, dark mode support, and responsive design system.',
        category: 'UI/UX Design',
        tags: ['Figma', 'Design System', 'SaaS'],
        thumbnailUrl: '/portfolio/dashboard-thumb.jpg',
        images: ['/portfolio/dashboard-1.jpg', '/portfolio/dashboard-2.jpg'],
        completedAt: '2024-02-20',
        featured: true
      },
      {
        id: '3',
        title: 'Real-time Chat Application',
        description: 'Scalable real-time messaging platform with WebSocket support, file sharing, and end-to-end encryption.',
        category: 'Web Development',
        tags: ['React', 'Socket.io', 'MongoDB', 'WebRTC'],
        thumbnailUrl: '/portfolio/chat-thumb.jpg',
        images: ['/portfolio/chat-1.jpg'],
        projectUrl: 'https://example.com/chat',
        completedAt: '2023-11-10',
        featured: false
      },
      {
        id: '4',
        title: 'Mobile Banking App Design',
        description: 'Modern mobile banking interface with intuitive navigation, biometric auth, and accessibility features.',
        category: 'Mobile Design',
        tags: ['Figma', 'Mobile', 'Fintech', 'Accessibility'],
        thumbnailUrl: '/portfolio/banking-thumb.jpg',
        images: ['/portfolio/banking-1.jpg', '/portfolio/banking-2.jpg'],
        clientName: 'FinanceApp Inc.',
        completedAt: '2023-09-05',
        featured: true
      },
      {
        id: '5',
        title: 'API Gateway System',
        description: 'High-performance API gateway handling 100k+ requests/second with rate limiting, caching, and monitoring.',
        category: 'Backend Development',
        tags: ['Node.js', 'Redis', 'Docker', 'Kubernetes'],
        thumbnailUrl: '/portfolio/api-thumb.jpg',
        images: ['/portfolio/api-1.jpg'],
        completedAt: '2023-07-22',
        featured: false
      }
    ]);
    
    setLoading(false);
  };

  const categories = ['all', ...new Set(portfolioItems.map(item => item.category))];
  
  const filteredItems = selectedCategory === 'all' 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === selectedCategory);

  const featuredItems = portfolioItems.filter(item => item.featured);

  const getAvailabilityLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Available for hire';
      case 'busy': return 'Limited availability';
      case 'unavailable': return 'Not available';
      default: return status;
    }
  };

  if (!mounted) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={cn(commonStyles.loading, themeStyles.loading)}>Loading portfolio...</div>
      </div>
    );
  }

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      {/* Hero Section */}
      {profile && (
        <div className={cn(commonStyles.heroSection, themeStyles.heroSection)}>
          <div className={commonStyles.heroContent}>
            <div className={commonStyles.avatarSection}>
              <div className={cn(commonStyles.avatar, themeStyles.avatar)}>
                {profile.name.charAt(0)}
              </div>
              <span className={cn(
                commonStyles.availabilityBadge,
                themeStyles.availabilityBadge,
                commonStyles[profile.availability],
                themeStyles[profile.availability]
              )}>
                {getAvailabilityLabel(profile.availability)}
              </span>
            </div>
            
            <div className={commonStyles.profileInfo}>
              <h1 className={cn(commonStyles.name, themeStyles.name)}>{profile.name}</h1>
              <p className={cn(commonStyles.title, themeStyles.title)}>{profile.title}</p>
              <p className={cn(commonStyles.bio, themeStyles.bio)}>{profile.bio}</p>
              
              <div className={commonStyles.stats}>
                <div className={cn(commonStyles.stat, themeStyles.stat)}>
                  <span className={commonStyles.statValue}>⭐ {profile.rating}</span>
                  <span className={commonStyles.statLabel}>{profile.totalReviews} reviews</span>
                </div>
                <div className={cn(commonStyles.stat, themeStyles.stat)}>
                  <span className={commonStyles.statValue}>{profile.completedProjects}</span>
                  <span className={commonStyles.statLabel}>Projects</span>
                </div>
                <div className={cn(commonStyles.stat, themeStyles.stat)}>
                  <span className={commonStyles.statValue}>${profile.hourlyRate}/hr</span>
                  <span className={commonStyles.statLabel}>Hourly rate</span>
                </div>
              </div>
              
              <div className={commonStyles.skills}>
                {profile.skills.map(skill => (
                  <span key={skill} className={cn(commonStyles.skillTag, themeStyles.skillTag)}>
                    {skill}
                  </span>
                ))}
              </div>
              
              <div className={commonStyles.heroActions}>
                <button className={cn(commonStyles.hireButton, themeStyles.hireButton)}>
                  Hire Me
                </button>
                <button className={cn(commonStyles.contactButton, themeStyles.contactButton)}>
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Featured Projects */}
      {featuredItems.length > 0 && (
        <section className={commonStyles.section}>
          <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
            ✨ Featured Work
          </h2>
          <div className={commonStyles.featuredGrid}>
            {featuredItems.map(item => (
              <div 
                key={item.id}
                className={cn(commonStyles.featuredCard, themeStyles.featuredCard)}
                onClick={() => setSelectedItem(item)}
              >
                <div className={cn(commonStyles.featuredImage, themeStyles.featuredImage)}>
                  <span className={commonStyles.imageIcon}>🖼️</span>
                </div>
                <div className={commonStyles.featuredContent}>
                  <span className={cn(commonStyles.category, themeStyles.category)}>
                    {item.category}
                  </span>
                  <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>
                    {item.title}
                  </h3>
                  <p className={cn(commonStyles.cardDescription, themeStyles.cardDescription)}>
                    {item.description}
                  </p>
                  <div className={commonStyles.cardTags}>
                    {item.tags.slice(0, 3).map(tag => (
                      <span key={tag} className={cn(commonStyles.tag, themeStyles.tag)}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Projects */}
      <section className={commonStyles.section}>
        <div className={commonStyles.sectionHeader}>
          <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
            All Projects
          </h2>
          <div className={commonStyles.categoryFilter}>
            {categories.map(category => (
              <button
                key={category}
                className={cn(
                  commonStyles.categoryButton,
                  themeStyles.categoryButton,
                  selectedCategory === category && commonStyles.activeCategory,
                  selectedCategory === category && themeStyles.activeCategory
                )}
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'All' : category}
              </button>
            ))}
          </div>
        </div>
        
        <div className={commonStyles.projectsGrid}>
          {filteredItems.map(item => (
            <div 
              key={item.id}
              className={cn(commonStyles.projectCard, themeStyles.projectCard)}
              onClick={() => setSelectedItem(item)}
            >
              <div className={cn(commonStyles.projectImage, themeStyles.projectImage)}>
                <span className={commonStyles.imageIcon}>🖼️</span>
                {item.featured && (
                  <span className={cn(commonStyles.featuredBadge, themeStyles.featuredBadge)}>
                    Featured
                  </span>
                )}
              </div>
              <div className={commonStyles.projectContent}>
                <h3 className={cn(commonStyles.projectTitle, themeStyles.projectTitle)}>
                  {item.title}
                </h3>
                <p className={cn(commonStyles.projectCategory, themeStyles.projectCategory)}>
                  {item.category}
                </p>
                <div className={commonStyles.projectTags}>
                  {item.tags.slice(0, 2).map(tag => (
                    <span key={tag} className={cn(commonStyles.tag, themeStyles.tag)}>
                      {tag}
                    </span>
                  ))}
                  {item.tags.length > 2 && (
                    <span className={cn(commonStyles.moreTags, themeStyles.moreTags)}>
                      +{item.tags.length - 2}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Project Detail Modal */}
      {selectedItem && (
        <div className={cn(commonStyles.modalOverlay, themeStyles.modalOverlay)} onClick={() => setSelectedItem(null)}>
          <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={e => e.stopPropagation()}>
            <button 
              className={cn(commonStyles.closeButton, themeStyles.closeButton)}
              onClick={() => setSelectedItem(null)}
            >
              ✕
            </button>
            
            <div className={cn(commonStyles.modalImage, themeStyles.modalImage)}>
              <span className={commonStyles.largeImageIcon}>🖼️</span>
            </div>
            
            <div className={commonStyles.modalContent}>
              <span className={cn(commonStyles.category, themeStyles.category)}>
                {selectedItem.category}
              </span>
              <h2 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>
                {selectedItem.title}
              </h2>
              <p className={cn(commonStyles.modalDescription, themeStyles.modalDescription)}>
                {selectedItem.description}
              </p>
              
              {selectedItem.clientName && (
                <p className={cn(commonStyles.clientInfo, themeStyles.clientInfo)}>
                  <strong>Client:</strong> {selectedItem.clientName}
                </p>
              )}
              
              <p className={cn(commonStyles.completedDate, themeStyles.completedDate)}>
                <strong>Completed:</strong> {new Date(selectedItem.completedAt).toLocaleDateString()}
              </p>
              
              <div className={commonStyles.modalTags}>
                {selectedItem.tags.map(tag => (
                  <span key={tag} className={cn(commonStyles.tag, themeStyles.tag)}>
                    {tag}
                  </span>
                ))}
              </div>
              
              {selectedItem.projectUrl && (
                <a 
                  href={selectedItem.projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(commonStyles.viewProjectButton, themeStyles.viewProjectButton)}
                >
                  View Live Project →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
