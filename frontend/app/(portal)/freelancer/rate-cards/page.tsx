// @AI-HINT: Rate cards page for freelancer pricing structures and packages
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { rateCardsApi as _rateCardsApi } from '@/lib/api';
import Button from '@/app/components/Button/Button';
import commonStyles from './RateCards.common.module.css';
import lightStyles from './RateCards.light.module.css';
import darkStyles from './RateCards.dark.module.css';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';

const rateCardsApi: any = _rateCardsApi;

interface RateCard {
  id: string;
  name: string;
  description: string;
  rate_type: 'hourly' | 'daily' | 'fixed' | 'milestone';
  rate_amount: number;
  currency: string;
  min_hours?: number;
  max_hours?: number;
  includes: string[];
  excludes: string[];
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
}

interface PackageFeature {
  id: string;
  name: string;
  included: boolean;
}

const RATE_TYPES = [
  { value: 'hourly', label: 'Hourly Rate', icon: '⏱️' },
  { value: 'daily', label: 'Daily Rate', icon: '📅' },
  { value: 'fixed', label: 'Fixed Price', icon: '💰' },
  { value: 'milestone', label: 'Per Milestone', icon: '🎯' }
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR'];

export default function RateCardsPage() {
  const { resolvedTheme } = useTheme();
  const [cards, setCards] = useState<RateCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<Partial<RateCard> | null>(null);
  const [includeInput, setIncludeInput] = useState('');
  const [excludeInput, setExcludeInput] = useState('');

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      setLoading(true);
      const data = await rateCardsApi.getAll();
      setCards(data || []);
    } catch (err) {
      console.error('Failed to load rate cards:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingCard?.name || !editingCard.rate_amount) {
      alert('Please fill in required fields');
      return;
    }
    try {
      if (editingCard.id) {
        await rateCardsApi.update(editingCard.id, editingCard);
      } else {
        await rateCardsApi.create(editingCard);
      }
      setShowModal(false);
      setEditingCard(null);
      loadCards();
    } catch (err) {
      console.error('Failed to save rate card:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this rate card?')) return;
    try {
      await rateCardsApi.delete(id);
      loadCards();
    } catch (err) {
      console.error('Failed to delete rate card:', err);
    }
  };

  const handleToggleActive = async (card: RateCard) => {
    try {
      await rateCardsApi.update(card.id, { is_active: !card.is_active });
      loadCards();
    } catch (err) {
      console.error('Failed to toggle card:', err);
    }
  };

  const handleToggleFeatured = async (card: RateCard) => {
    try {
      await rateCardsApi.update(card.id, { is_featured: !card.is_featured });
      loadCards();
    } catch (err) {
      console.error('Failed to toggle featured:', err);
    }
  };

  const addInclude = () => {
    if (!includeInput.trim()) return;
    setEditingCard({
      ...editingCard,
      includes: [...(editingCard?.includes || []), includeInput.trim()]
    });
    setIncludeInput('');
  };

  const addExclude = () => {
    if (!excludeInput.trim()) return;
    setEditingCard({
      ...editingCard,
      excludes: [...(editingCard?.excludes || []), excludeInput.trim()]
    });
    setExcludeInput('');
  };

  const removeInclude = (index: number) => {
    const newIncludes = [...(editingCard?.includes || [])];
    newIncludes.splice(index, 1);
    setEditingCard({ ...editingCard, includes: newIncludes });
  };

  const removeExclude = (index: number) => {
    const newExcludes = [...(editingCard?.excludes || [])];
    newExcludes.splice(index, 1);
    setEditingCard({ ...editingCard, excludes: newExcludes });
  };

  const openNewCard = () => {
    setEditingCard({
      name: '',
      description: '',
      rate_type: 'hourly',
      rate_amount: 0,
      currency: 'USD',
      includes: [],
      excludes: [],
      is_active: true,
      is_featured: false
    });
    setShowModal(true);
  };

  const formatRate = (card: RateCard) => {
    const amount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: card.currency
    }).format(card.rate_amount);
    
    switch (card.rate_type) {
      case 'hourly': return `${amount}/hr`;
      case 'daily': return `${amount}/day`;
      case 'fixed': return amount;
      case 'milestone': return `${amount}/milestone`;
      default: return amount;
    }
  };

  if (!resolvedTheme) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={commonStyles.loading}>Loading rate cards...</div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <header className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Rate Cards</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Define your pricing structures and packages
              </p>
            </div>
            <Button variant="primary" onClick={openNewCard}>
              + Create Rate Card
            </Button>
          </header>
        </ScrollReveal>

        {/* Stats */}
        <ScrollReveal delay={0.1}>
          <div className={commonStyles.statsRow}>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={commonStyles.statIcon}>💳</span>
              <div className={commonStyles.statInfo}>
                <strong>{cards.length}</strong>
                <span>Total Cards</span>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={commonStyles.statIcon}>✅</span>
              <div className={commonStyles.statInfo}>
                <strong>{cards.filter(c => c.is_active).length}</strong>
                <span>Active</span>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={commonStyles.statIcon}>⭐</span>
              <div className={commonStyles.statInfo}>
                <strong>{cards.filter(c => c.is_featured).length}</strong>
                <span>Featured</span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Cards Grid */}
        {cards.length === 0 ? (
          <ScrollReveal delay={0.2}>
            <div className={cn(commonStyles.emptyCard, themeStyles.emptyCard)}>
              <span>💳</span>
              <h3>No Rate Cards Yet</h3>
              <p>Create your first rate card to showcase your pricing to clients.</p>
              <Button variant="primary" onClick={openNewCard}>
                Create Rate Card
              </Button>
            </div>
          </ScrollReveal>
        ) : (
          <StaggerContainer className={commonStyles.cardsGrid}>
            {cards.map(card => (
              <StaggerItem
                key={card.id}
                className={cn(
                  commonStyles.rateCard,
                  themeStyles.rateCard,
                  card.is_featured && commonStyles.featured,
                  !card.is_active && commonStyles.inactive
                )}
              >
                {card.is_featured && (
                  <div className={commonStyles.featuredBadge}>⭐ Featured</div>
                )}
                
                <div className={commonStyles.cardHeader}>
                  <h3>{card.name}</h3>
                  <div className={commonStyles.rateType}>
                    {RATE_TYPES.find(t => t.value === card.rate_type)?.icon}
                    {RATE_TYPES.find(t => t.value === card.rate_type)?.label}
                  </div>
                </div>

                <div className={cn(commonStyles.rateAmount, themeStyles.rateAmount)}>
                  {formatRate(card)}
                </div>

                {card.description && (
                  <p className={cn(commonStyles.cardDesc, themeStyles.cardDesc)}>
                    {card.description}
                  </p>
                )}

                {card.includes && card.includes.length > 0 && (
                  <div className={commonStyles.featuresList}>
                    <h4>What&apos;s Included:</h4>
                    <ul>
                      {card.includes.map((item, i) => (
                        <li key={i} className={commonStyles.includeItem}>
                          <span>✓</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {card.excludes && card.excludes.length > 0 && (
                  <div className={commonStyles.featuresList}>
                    <h4>Not Included:</h4>
                    <ul>
                      {card.excludes.map((item, i) => (
                        <li key={i} className={commonStyles.excludeItem}>
                          <span>✕</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className={commonStyles.cardActions}>
                  <Button
                    variant={card.is_active ? 'secondary' : 'success'}
                    size="sm"
                    onClick={() => handleToggleActive(card)}
                  >
                    {card.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleFeatured(card)}
                  >
                    {card.is_featured ? '★ Unfeature' : '☆ Feature'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setEditingCard(card); setShowModal(true); }}
                  >
                    ✏️ Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(card.id)}
                  >
                    🗑️
                  </Button>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        {/* Modal */}
        {showModal && (
          <div className={commonStyles.modalOverlay} onClick={() => setShowModal(false)}>
            <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={e => e.stopPropagation()}>
              <h2>{editingCard?.id ? 'Edit Rate Card' : 'Create Rate Card'}</h2>

              <div className={commonStyles.formGroup}>
                <label>Card Name *</label>
                <input
                  type="text"
                  value={editingCard?.name || ''}
                  onChange={e => setEditingCard({ ...editingCard, name: e.target.value })}
                  className={cn(commonStyles.input, themeStyles.input)}
                  placeholder="e.g., Standard Hourly, Premium Package"
                />
              </div>

              <div className={commonStyles.formGroup}>
                <label>Description</label>
                <textarea
                  value={editingCard?.description || ''}
                  onChange={e => setEditingCard({ ...editingCard, description: e.target.value })}
                  className={cn(commonStyles.textarea, themeStyles.input)}
                  rows={3}
                  placeholder="Describe what this rate card offers..."
                />
              </div>

              <div className={commonStyles.formRow}>
                <div className={commonStyles.formGroup}>
                  <label>Rate Type</label>
                  <select
                    value={editingCard?.rate_type || 'hourly'}
                    onChange={e => setEditingCard({ ...editingCard, rate_type: e.target.value as any })}
                    className={cn(commonStyles.input, themeStyles.input)}
                  >
                    {RATE_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                    ))}
                  </select>
                </div>
                <div className={commonStyles.formGroup}>
                  <label>Currency</label>
                  <select
                    value={editingCard?.currency || 'USD'}
                    onChange={e => setEditingCard({ ...editingCard, currency: e.target.value })}
                    className={cn(commonStyles.input, themeStyles.input)}
                  >
                    {CURRENCIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={commonStyles.formGroup}>
                <label>Rate Amount *</label>
                <input
                  type="number"
                  value={editingCard?.rate_amount || ''}
                  onChange={e => setEditingCard({ ...editingCard, rate_amount: parseFloat(e.target.value) })}
                  className={cn(commonStyles.input, themeStyles.input)}
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                />
              </div>

              <div className={commonStyles.formGroup}>
                <label>What&apos;s Included</label>
                <div className={commonStyles.tagInput}>
                  <input
                    type="text"
                    value={includeInput}
                    onChange={e => setIncludeInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addInclude())}
                    className={cn(commonStyles.input, themeStyles.input)}
                    placeholder="Add item and press Enter"
                  />
                  <Button variant="secondary" size="sm" onClick={addInclude}>Add</Button>
                </div>
                <div className={commonStyles.tagList}>
                  {editingCard?.includes?.map((item, i) => (
                    <span key={i} className={cn(commonStyles.tag, commonStyles.includeTag)}>
                      ✓ {item}
                      <button onClick={() => removeInclude(i)}>×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className={commonStyles.formGroup}>
                <label>Not Included</label>
                <div className={commonStyles.tagInput}>
                  <input
                    type="text"
                    value={excludeInput}
                    onChange={e => setExcludeInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addExclude())}
                    className={cn(commonStyles.input, themeStyles.input)}
                    placeholder="Add item and press Enter"
                  />
                  <Button variant="secondary" size="sm" onClick={addExclude}>Add</Button>
                </div>
                <div className={commonStyles.tagList}>
                  {editingCard?.excludes?.map((item, i) => (
                    <span key={i} className={cn(commonStyles.tag, commonStyles.excludeTag)}>
                      ✕ {item}
                      <button onClick={() => removeExclude(i)}>×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className={commonStyles.formGroup}>
                <label className={commonStyles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={editingCard?.is_featured || false}
                    onChange={e => setEditingCard({ ...editingCard, is_featured: e.target.checked })}
                  />
                  Feature this rate card (shown prominently on profile)
                </label>
              </div>

              <div className={commonStyles.modalActions}>
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSave}>
                  {editingCard?.id ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
