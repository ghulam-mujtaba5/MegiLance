// @AI-HINT: This page allows freelancers to manage and display their portfolio of work.
'use client';

import React, { useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { FiPlusCircle, FiLayout } from 'react-icons/fi';

import Button from '@/app/components/Button/Button';
import PortfolioItemCard, { PortfolioItemCardProps } from '@/app/components/Freelancer/PortfolioItemCard/PortfolioItemCard';
import { cn } from '@/lib/utils';
import commonStyles from './PortfolioPage.common.module.css';
import lightStyles from './PortfolioPage.light.module.css';
import darkStyles from './PortfolioPage.dark.module.css';

const mockPortfolioItems: Omit<PortfolioItemCardProps, 'onDelete'>[] = [
  {
    id: 1,
    title: 'DeFi Yield Aggregator Dashboard',
    description: 'A comprehensive dashboard for tracking and managing assets across multiple DeFi protocols.',
    imageUrl: '/images/stock/portfolio-1.jpg',
    projectUrl: '#',
  },
  {
    id: 2,
    title: 'NFT Marketplace UI/UX',
    description: 'Designed a user-friendly interface for a next-generation NFT marketplace on the Solana blockchain.',
    imageUrl: '/images/stock/portfolio-2.jpg',
    projectUrl: '#',
  },
  {
    id: 3,
    title: 'DAO Governance Token Launch',
    description: 'Developed the smart contracts and launch strategy for a decentralized autonomous organization.',
    imageUrl: '/images/stock/portfolio-3.jpg',
  },
];

const PortfolioPage: React.FC = () => {
  const [items, setItems] = useState(mockPortfolioItems);
  const { theme } = useTheme();

  const styles = useMemo(() => {
    const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [theme]);

  const handleDelete = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div className={cn(styles.container)}>
      <header className={cn(styles.header)}>
        <div className={cn(styles.titleGroup)}>
          <h1 className={cn(styles.title)}>My Portfolio</h1>
          <p className={cn(styles.subtitle)}>Showcase your best work and accomplishments to attract top clients.</p>
        </div>
        <Button variant="primary" size="large"><FiPlusCircle /> Add New Project</Button>
      </header>

      <main className={cn(styles.main)}>
        {items.length > 0 ? (
          <div className={cn(styles.grid)}>
            {items.map(item => (
              <PortfolioItemCard key={item.id} {...item} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <div className={cn(styles.emptyState)}>
            <FiLayout size={48} />
            <h2 className={cn(styles.emptyTitle)}>Your Portfolio is Ready for a Masterpiece</h2>
            <p className={cn(styles.emptyText)}>Click &apos;Add New Project&apos; to upload your first item and start building your reputation.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default PortfolioPage;
