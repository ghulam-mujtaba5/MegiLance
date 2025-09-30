// @AI-HINT: This page allows freelancers to manage and display their portfolio of work.
'use client';

import React, { useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { FiPlusCircle, FiLayout } from 'react-icons/fi';

import Button from '@/app/components/Button/Button';
import PortfolioItemCard, { PortfolioItemCardProps } from '@/app/components/Freelancer/PortfolioItemCard/PortfolioItemCard';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { useToaster } from '@/app/components/Toast/ToasterProvider';
import Modal from '@/app/components/Modal/Modal';
import Input from '@/app/components/Input/Input';
import Textarea from '@/app/components/Textarea/Textarea';
import { Label } from '@/app/components/Label/Label';
import { cn } from '@/lib/utils';
import commonStyles from './PortfolioPage.common.module.css';
import lightStyles from './PortfolioPage.light.module.css';
import darkStyles from './PortfolioPage.dark.module.css';

// Define the portfolio item type
interface PortfolioItem extends Omit<PortfolioItemCardProps, 'onDelete' | 'onEdit'> {
  id: number;
}

const mockPortfolioItems: PortfolioItem[] = [
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
  const [items, setItems] = useState<PortfolioItem[]>(mockPortfolioItems);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const { theme } = useTheme();
  const { notify } = useToaster();

  const styles = useMemo(() => {
    const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [theme]);

  // Open modal for adding a new item
  const handleAdd = () => {
    setEditingItem(null);
    setTitle('');
    setDescription('');
    setImageUrl('/images/stock/portfolio-1.jpg');
    setProjectUrl('');
    setIsModalOpen(true);
  };

  // Open modal for editing an existing item
  const handleEdit = (id: number) => {
    const item = items.find(item => item.id === id);
    if (item) {
      setEditingItem(item);
      setTitle(item.title);
      setDescription(item.description);
      setImageUrl(item.imageUrl);
      setProjectUrl(item.projectUrl || '');
      setIsModalOpen(true);
    }
  };

  const handleDelete = (id: number) => {
    setItems(items.filter(item => item.id !== id));
    notify({ title: 'Project removed', description: 'The item was removed from your portfolio.', variant: 'info', duration: 2000 });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingItem) {
      // Update existing item
      setItems(items.map(item => 
        item.id === editingItem.id 
          ? { ...item, title, description, imageUrl, projectUrl } 
          : item
      ));
      notify({ title: 'Project updated', description: 'The item was updated successfully.', variant: 'success' });
    } else {
      // Add new item
      const nextId = items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
      const newItem: PortfolioItem = {
        id: nextId,
        title,
        description,
        imageUrl,
        projectUrl: projectUrl || undefined,
      };
      setItems([newItem, ...items]);
      notify({ title: 'Project added', description: 'The item was added to your portfolio.', variant: 'success' });
    }
    
    setIsModalOpen(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  return (
    <div className={cn(styles.container)}>
      <header
        className={cn(styles.header)}
        role="region"
        aria-label="Portfolio Management"
        title="Portfolio Management"
      >
        <div className={cn(styles.titleGroup)}>
          <h1 className={cn(styles.title)}>My Portfolio</h1>
          <p className={cn(styles.subtitle)}>Showcase your best work and accomplishments to attract top clients.</p>
        </div>
        <Button variant="primary" size="large" onClick={handleAdd} aria-label="Add new project" title="Add new project"><FiPlusCircle /> Add New Project</Button>
      </header>

      <main className={cn(styles.main)}>
        <span className={styles.srOnly} aria-live="polite">{items.length} portfolio item{items.length === 1 ? '' : 's'}</span>
        {items.length > 0 ? (
          <div className={cn(styles.grid)} role="region" aria-label="Portfolio items" title="Portfolio items">
            {items.map(item => (
              <PortfolioItemCard 
                key={item.id} 
                {...item} 
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        ) : (
          <div className={cn(styles.emptyState)}>
            <EmptyState
              title="Showcase your best work"
              description="Add a project to start building your reputation and attract top clients."
              icon={<FiLayout aria-hidden="true" />}
              action={
                <Button variant="primary" size="large" onClick={handleAdd} aria-label="Add your first project" title="Add your first project">
                  <FiPlusCircle /> Add Your First Project
                </Button>
              }
            />
          </div>
        )}
      </main>

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={editingItem ? "Edit Project" : "Add New Project"}
        size="large"
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., DeFi Yield Aggregator Dashboard"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your achievement, outcomes, and impact..."
              rows={4}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="/images/stock/portfolio-1.jpg"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <Label htmlFor="projectUrl">Project URL (optional)</Label>
            <Input
              id="projectUrl"
              type="text"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className={styles.modalActions}>
            <Button variant="secondary" type="button" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingItem ? 'Update Project' : 'Add Project'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PortfolioPage;