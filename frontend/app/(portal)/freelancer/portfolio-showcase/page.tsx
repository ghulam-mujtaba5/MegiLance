// @AI-HINT: Public portfolio showcase for displaying freelancer work and projects
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { portfolioShowcaseApi } from '@/lib/api';
import commonStyles from './Portfolio.common.module.css';
import lightStyles from './Portfolio.light.module.css';
import darkStyles from './Portfolio.dark.module.css';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  images: string[];
  thumbnail: string;
  link?: string;
  client_name?: string;
  completion_date: string;
  featured: boolean;
  views: number;
  likes: number;
  user_liked: boolean;
}

interface PortfolioSettings {
  public_url: string;
  bio: string;
  headline: string;
  contact_email: string;
  social_links: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
  };
  theme_color: string;
  layout: 'grid' | 'masonry' | 'list';
  show_contact_form: boolean;
}

const categoryOptions = [
  { value: 'all', label: 'All Projects' },
  { value: 'web-development', label: 'Web Development' },
  { value: 'mobile-app', label: 'Mobile Apps' },
  { value: 'ui-ux', label: 'UI/UX Design' },
  { value: 'branding', label: 'Branding' },
  { value: 'illustration', label: 'Illustration' },
  { value: 'photography', label: 'Photography' },
  { value: 'video', label: 'Video Production' },
  { value: 'writing', label: 'Writing' },
  { value: 'other', label: 'Other' },
];

const layoutOptions = [
  { value: 'grid', icon: '⊞', label: 'Grid' },
  { value: 'masonry', icon: '▦', label: 'Masonry' },
  { value: 'list', icon: '☰', label: 'List' },
];

export default function PortfolioShowcasePage() {
  const { resolvedTheme } = useTheme();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [settings, setSettings] = useState<PortfolioSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // New item form
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    category: 'web-development',
    tags: [] as string[],
    images: [] as string[],
    link: '',
    client_name: '',
    featured: false,
  });
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      const [itemsRes, settingsRes] = await Promise.all([
        portfolioShowcaseApi.list(),
        portfolioShowcaseApi.getSettings(),
      ]);
      setItems(itemsRes.items || []);
      setSettings(settingsRes);
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async () => {
    if (!newItem.title.trim()) return;

    try {
      setSaving(true);
      if (editingItem) {
        await portfolioShowcaseApi.update(editingItem.id, newItem);
      } else {
        await portfolioShowcaseApi.create(newItem);
      }
      setShowItemModal(false);
      setEditingItem(null);
      resetItemForm();
      loadPortfolio();
    } catch (error) {
      console.error('Failed to save item:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this portfolio item?')) return;

    try {
      await portfolioShowcaseApi.delete(id);
      loadPortfolio();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const toggleFeatured = async (item: PortfolioItem) => {
    try {
      await portfolioShowcaseApi.update(item.id, { featured: !item.featured });
      setItems(prev =>
        prev.map(i => (i.id === item.id ? { ...i, featured: !i.featured } : i))
      );
    } catch (error) {
      console.error('Failed to toggle featured:', error);
    }
  };

  const handleLike = async (item: PortfolioItem) => {
    try {
      if (item.user_liked) {
        await portfolioShowcaseApi.unlike(item.id);
      } else {
        await portfolioShowcaseApi.like(item.id);
      }
      setItems(prev =>
        prev.map(i =>
          i.id === item.id
            ? {
                ...i,
                likes: item.user_liked ? i.likes - 1 : i.likes + 1,
                user_liked: !i.user_liked,
              }
            : i
        )
      );
    } catch (error) {
      console.error('Failed to like item:', error);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      await portfolioShowcaseApi.updateSettings(settings);
      setShowSettingsModal(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetItemForm = () => {
    setNewItem({
      title: '',
      description: '',
      category: 'web-development',
      tags: [],
      images: [],
      link: '',
      client_name: '',
      featured: false,
    });
    setTagInput('');
  };

  const editItem = (item: PortfolioItem) => {
    setEditingItem(item);
    setNewItem({
      title: item.title,
      description: item.description,
      category: item.category,
      tags: item.tags,
      images: item.images,
      link: item.link || '',
      client_name: item.client_name || '',
      featured: item.featured,
    });
    setShowItemModal(true);
  };

  const addTag = () => {
    if (tagInput.trim() && !newItem.tags.includes(tagInput.trim())) {
      setNewItem(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  if (!resolvedTheme) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const filteredItems = activeCategory === 'all'
    ? items
    : items.filter(i => i.category === activeCategory);

  const featuredItems = items.filter(i => i.featured);

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div className={commonStyles.headerTop}>
              <div>
                <h1 className={cn(commonStyles.title, themeStyles.title)}>Portfolio Showcase</h1>
                <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                  Manage and display your best work • {items.length} projects
                </p>
              </div>
              <div className={commonStyles.headerActions}>
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className={cn(commonStyles.settingsBtn, themeStyles.settingsBtn)}
                >
                  ⚙️ Settings
                </button>
                <button
                  onClick={() => {
                    resetItemForm();
                    setEditingItem(null);
                    setShowItemModal(true);
                  }}
                  className={cn(commonStyles.addBtn, themeStyles.addBtn)}
                >
                  ➕ Add Project
                </button>
              </div>
            </div>

            {settings?.public_url && (
              <div className={cn(commonStyles.publicUrl, themeStyles.publicUrl)}>
                <span>🔗 Public Portfolio:</span>
                <a href={settings.public_url} target="_blank" rel="noopener noreferrer">
                  {settings.public_url}
                </a>
              </div>
            )}

            <div className={commonStyles.controls}>
              <div className={cn(commonStyles.categories, themeStyles.categories)}>
                {categoryOptions.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setActiveCategory(cat.value)}
                    className={cn(
                      commonStyles.categoryBtn,
                      themeStyles.categoryBtn,
                      activeCategory === cat.value && commonStyles.categoryActive,
                      activeCategory === cat.value && themeStyles.categoryActive
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className={commonStyles.layoutToggle}>
                {layoutOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSettings(prev => prev ? { ...prev, layout: opt.value as typeof prev.layout } : prev)}
                    className={cn(
                      commonStyles.layoutBtn,
                      themeStyles.layoutBtn,
                      settings?.layout === opt.value && commonStyles.layoutActive,
                      settings?.layout === opt.value && themeStyles.layoutActive
                    )}
                    title={opt.label}
                  >
                    {opt.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className={cn(commonStyles.loading, themeStyles.loading)}>
            Loading portfolio...
          </div>
        ) : items.length === 0 ? (
          <ScrollReveal>
            <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
              <span className={commonStyles.emptyIcon}>🎨</span>
              <h3 className={cn(commonStyles.emptyTitle, themeStyles.emptyTitle)}>
                Start Building Your Portfolio
              </h3>
              <p className={cn(commonStyles.emptyDesc, themeStyles.emptyDesc)}>
                Add your best projects to showcase your skills to potential clients
              </p>
              <button
                onClick={() => setShowItemModal(true)}
                className={cn(commonStyles.emptyBtn, themeStyles.emptyBtn)}
              >
                Add Your First Project
              </button>
            </div>
          </ScrollReveal>
        ) : (
          <>
            {featuredItems.length > 0 && activeCategory === 'all' && (
              <div className={commonStyles.featuredSection}>
                <ScrollReveal>
                  <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                    ⭐ Featured Work
                  </h2>
                </ScrollReveal>
                <StaggerContainer className={commonStyles.featuredGrid}>
                  {featuredItems.map(item => (
                    <StaggerItem
                      key={item.id}
                      className={cn(commonStyles.featuredCard, themeStyles.featuredCard)}
                    >
                      <div className={commonStyles.cardImage}>
                        <img src={item.thumbnail || '/placeholder.jpg'} alt={item.title} />
                        <div className={commonStyles.cardOverlay}>
                          <button
                            onClick={() => editItem(item)}
                            className={commonStyles.overlayBtn}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className={commonStyles.overlayBtn}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div className={commonStyles.cardContent}>
                        <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>
                          {item.title}
                        </h3>
                        <p className={cn(commonStyles.cardDesc, themeStyles.cardDesc)}>
                          {item.description.slice(0, 100)}...
                        </p>
                        <div className={commonStyles.cardStats}>
                          <span className={cn(commonStyles.stat, themeStyles.stat)}>
                            👁️ {item.views}
                          </span>
                          <button
                            onClick={() => handleLike(item)}
                            className={cn(
                              commonStyles.likeBtn,
                              themeStyles.likeBtn,
                              item.user_liked && commonStyles.liked,
                              item.user_liked && themeStyles.liked
                            )}
                          >
                            ❤️ {item.likes}
                          </button>
                        </div>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>
            )}

            <StaggerContainer className={cn(
              commonStyles.portfolioGrid,
              settings?.layout === 'list' && commonStyles.listLayout,
              settings?.layout === 'masonry' && commonStyles.masonryLayout
            )}>
              {filteredItems.map(item => (
                <StaggerItem
                  key={item.id}
                  className={cn(commonStyles.portfolioCard, themeStyles.portfolioCard)}
                >
                  <div className={commonStyles.cardImage}>
                    <img src={item.thumbnail || '/placeholder.jpg'} alt={item.title} />
                    {item.featured && (
                      <span className={cn(commonStyles.featuredBadge, themeStyles.featuredBadge)}>
                        ⭐ Featured
                      </span>
                    )}
                    <div className={commonStyles.cardOverlay}>
                      <button onClick={() => toggleFeatured(item)} className={commonStyles.overlayBtn}>
                        {item.featured ? '★' : '☆'}
                      </button>
                      <button onClick={() => editItem(item)} className={commonStyles.overlayBtn}>
                        ✏️
                      </button>
                      <button onClick={() => handleDeleteItem(item.id)} className={commonStyles.overlayBtn}>
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className={commonStyles.cardContent}>
                    <span className={cn(commonStyles.cardCategory, themeStyles.cardCategory)}>
                      {categoryOptions.find(c => c.value === item.category)?.label}
                    </span>
                    <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>{item.title}</h3>
                    <div className={commonStyles.cardTags}>
                      {item.tags.slice(0, 3).map(tag => (
                        <span key={tag} className={cn(commonStyles.tag, themeStyles.tag)}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className={commonStyles.cardStats}>
                      <span className={cn(commonStyles.stat, themeStyles.stat)}>👁️ {item.views}</span>
                      <button
                        onClick={() => handleLike(item)}
                        className={cn(
                          commonStyles.likeBtn,
                          themeStyles.likeBtn,
                          item.user_liked && commonStyles.liked
                        )}
                      >
                        ❤️ {item.likes}
                      </button>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </>
        )}

        {/* Add/Edit Modal */}
        {showItemModal && (
          <div className={commonStyles.modalOverlay} onClick={() => setShowItemModal(false)}>
            <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={(e) => e.stopPropagation()}>
              <div className={cn(commonStyles.modalHeader, themeStyles.modalHeader)}>
                <h2 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>
                  {editingItem ? 'Edit Project' : 'Add New Project'}
                </h2>
                <button
                  onClick={() => setShowItemModal(false)}
                  className={cn(commonStyles.closeButton, themeStyles.closeButton)}
                  disabled={saving}
                >
                  ×
                </button>
              </div>

              <div className={commonStyles.modalContent}>
                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.label, themeStyles.label)}>Title *</label>
                  <input
                    type="text"
                    value={newItem.title}
                    onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Project title"
                    className={cn(commonStyles.input, themeStyles.input)}
                  />
                </div>

                <div className={commonStyles.formRow}>
                  <div className={commonStyles.formGroup}>
                    <label className={cn(commonStyles.label, themeStyles.label)}>Category</label>
                    <select
                      value={newItem.category}
                      onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                      className={cn(commonStyles.select, themeStyles.select)}
                    >
                      {categoryOptions.filter(c => c.value !== 'all').map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className={commonStyles.formGroup}>
                    <label className={cn(commonStyles.label, themeStyles.label)}>Client Name</label>
                    <input
                      type="text"
                      value={newItem.client_name}
                      onChange={(e) => setNewItem(prev => ({ ...prev, client_name: e.target.value }))}
                      placeholder="Optional"
                      className={cn(commonStyles.input, themeStyles.input)}
                    />
                  </div>
                </div>

                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.label, themeStyles.label)}>Description</label>
                  <textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your project..."
                    rows={4}
                    className={cn(commonStyles.textarea, themeStyles.textarea)}
                  />
                </div>

                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.label, themeStyles.label)}>Project Link</label>
                  <input
                    type="url"
                    value={newItem.link}
                    onChange={(e) => setNewItem(prev => ({ ...prev, link: e.target.value }))}
                    placeholder="https://..."
                    className={cn(commonStyles.input, themeStyles.input)}
                  />
                </div>

                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.label, themeStyles.label)}>Tags</label>
                  <div className={commonStyles.tagInputRow}>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add a tag"
                      className={cn(commonStyles.input, themeStyles.input)}
                    />
                    <button onClick={addTag} className={cn(commonStyles.addTagBtn, themeStyles.addTagBtn)}>
                      Add
                    </button>
                  </div>
                  {newItem.tags.length > 0 && (
                    <div className={commonStyles.tagList}>
                      {newItem.tags.map(tag => (
                        <span key={tag} className={cn(commonStyles.selectedTag, themeStyles.selectedTag)}>
                          {tag}
                          <button onClick={() => setNewItem(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))}>
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <label className={commonStyles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={newItem.featured}
                    onChange={(e) => setNewItem(prev => ({ ...prev, featured: e.target.checked }))}
                  />
                  <span className={cn(commonStyles.checkboxText, themeStyles.checkboxText)}>
                    Feature this project
                  </span>
                </label>
              </div>

              <div className={cn(commonStyles.modalFooter, themeStyles.modalFooter)}>
                <button
                  onClick={() => setShowItemModal(false)}
                  disabled={saving}
                  className={cn(commonStyles.cancelBtn, themeStyles.cancelBtn)}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveItem}
                  disabled={saving || !newItem.title.trim()}
                  className={cn(commonStyles.saveBtn, themeStyles.saveBtn)}
                >
                  {saving ? 'Saving...' : editingItem ? 'Update Project' : 'Add Project'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettingsModal && settings && (
          <div className={commonStyles.modalOverlay} onClick={() => setShowSettingsModal(false)}>
            <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={(e) => e.stopPropagation()}>
              <div className={cn(commonStyles.modalHeader, themeStyles.modalHeader)}>
                <h2 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>
                  Portfolio Settings
                </h2>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className={cn(commonStyles.closeButton, themeStyles.closeButton)}
                >
                  ×
                </button>
              </div>

              <div className={commonStyles.modalContent}>
                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.label, themeStyles.label)}>Headline</label>
                  <input
                    type="text"
                    value={settings.headline}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, headline: e.target.value } : prev)}
                    placeholder="Full-Stack Developer & Designer"
                    className={cn(commonStyles.input, themeStyles.input)}
                  />
                </div>

                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.label, themeStyles.label)}>Bio</label>
                  <textarea
                    value={settings.bio}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, bio: e.target.value } : prev)}
                    placeholder="Tell visitors about yourself..."
                    rows={3}
                    className={cn(commonStyles.textarea, themeStyles.textarea)}
                  />
                </div>

                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.label, themeStyles.label)}>Contact Email</label>
                  <input
                    type="email"
                    value={settings.contact_email}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, contact_email: e.target.value } : prev)}
                    placeholder="your@email.com"
                    className={cn(commonStyles.input, themeStyles.input)}
                  />
                </div>

                <label className={commonStyles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={settings.show_contact_form}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, show_contact_form: e.target.checked } : prev)}
                  />
                  <span className={cn(commonStyles.checkboxText, themeStyles.checkboxText)}>
                    Show contact form on portfolio
                  </span>
                </label>
              </div>

              <div className={cn(commonStyles.modalFooter, themeStyles.modalFooter)}>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className={cn(commonStyles.cancelBtn, themeStyles.cancelBtn)}
                >
                  Cancel
                </button>
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className={cn(commonStyles.saveBtn, themeStyles.saveBtn)}
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
