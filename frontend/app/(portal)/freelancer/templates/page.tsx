// @AI-HINT: Proposal templates page for reusable proposal structures
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { proposalTemplatesApi } from '@/lib/api';
import Button from '@/app/components/Button/Button';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import commonStyles from './Templates.common.module.css';
import lightStyles from './Templates.light.module.css';
import darkStyles from './Templates.dark.module.css';

interface ProposalTemplate {
  id: string;
  name: string;
  description: string;
  cover_letter: string;
  milestones: Milestone[];
  default_rate?: number;
  default_rate_type?: 'hourly' | 'fixed';
  tags: string[];
  use_count: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface Milestone {
  title: string;
  description: string;
  percentage: number;
}

export default function ProposalTemplatesPage() {
  const { resolvedTheme } = useTheme();
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<ProposalTemplate> | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<ProposalTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await proposalTemplatesApi.getAll();
      setTemplates(data || []);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingTemplate?.name || !editingTemplate.cover_letter) {
      alert('Please fill in name and cover letter');
      return;
    }
    try {
      if (editingTemplate.id) {
        await proposalTemplatesApi.update(editingTemplate.id, editingTemplate);
      } else {
        await proposalTemplatesApi.create(editingTemplate);
      }
      setShowModal(false);
      setEditingTemplate(null);
      loadTemplates();
    } catch (err) {
      console.error('Failed to save template:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await proposalTemplatesApi.delete(id);
      loadTemplates();
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  const handleSetDefault = async (template: ProposalTemplate) => {
    try {
      await proposalTemplatesApi.update(template.id, { is_default: true });
      loadTemplates();
    } catch (err) {
      console.error('Failed to set default:', err);
    }
  };

  const handleDuplicate = async (template: ProposalTemplate) => {
    try {
      await proposalTemplatesApi.create({
        ...template,
        id: undefined,
        name: `${template.name} (Copy)`,
        is_default: false,
        use_count: 0
      });
      loadTemplates();
    } catch (err) {
      console.error('Failed to duplicate template:', err);
    }
  };

  const openNewTemplate = () => {
    setEditingTemplate({
      name: '',
      description: '',
      cover_letter: '',
      milestones: [],
      tags: [],
      is_default: false
    });
    setShowModal(true);
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    setEditingTemplate({
      ...editingTemplate,
      tags: [...(editingTemplate?.tags || []), tagInput.trim()]
    });
    setTagInput('');
  };

  const removeTag = (index: number) => {
    const newTags = [...(editingTemplate?.tags || [])];
    newTags.splice(index, 1);
    setEditingTemplate({ ...editingTemplate, tags: newTags });
  };

  const addMilestone = () => {
    setEditingTemplate({
      ...editingTemplate,
      milestones: [...(editingTemplate?.milestones || []), { title: '', description: '', percentage: 25 }]
    });
  };

  const updateMilestone = (index: number, field: keyof Milestone, value: string | number) => {
    const newMilestones = [...(editingTemplate?.milestones || [])];
    newMilestones[index] = { ...newMilestones[index], [field]: value };
    setEditingTemplate({ ...editingTemplate, milestones: newMilestones });
  };

  const removeMilestone = (index: number) => {
    const newMilestones = [...(editingTemplate?.milestones || [])];
    newMilestones.splice(index, 1);
    setEditingTemplate({ ...editingTemplate, milestones: newMilestones });
  };

  if (!resolvedTheme) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={commonStyles.loading}>Loading templates...</div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <header className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Proposal Templates</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Create reusable templates to speed up your proposals
              </p>
            </div>
            <Button variant="primary" onClick={openNewTemplate}>
              + Create Template
            </Button>
          </header>
        </ScrollReveal>

        {/* Stats */}
        <StaggerContainer delay={0.1} className={commonStyles.statsRow}>
          <StaggerItem>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={commonStyles.statIcon}>📄</span>
              <div className={commonStyles.statInfo}>
                <strong>{templates.length}</strong>
                <span>Templates</span>
              </div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={commonStyles.statIcon}>📊</span>
              <div className={commonStyles.statInfo}>
                <strong>{templates.reduce((sum, t) => sum + (t.use_count || 0), 0)}</strong>
                <span>Total Uses</span>
              </div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={commonStyles.statIcon}>⭐</span>
              <div className={commonStyles.statInfo}>
                <strong>{templates.find(t => t.is_default)?.name || 'None'}</strong>
                <span>Default Template</span>
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <ScrollReveal delay={0.2}>
            <div className={cn(commonStyles.emptyCard, themeStyles.emptyCard)}>
              <span>📝</span>
              <h3>No Templates Yet</h3>
              <p>Create your first proposal template to save time on future proposals.</p>
              <Button variant="primary" onClick={openNewTemplate}>
                Create Template
              </Button>
            </div>
          </ScrollReveal>
        ) : (
          <StaggerContainer delay={0.2} className={commonStyles.templatesGrid}>
            {templates.map(template => (
              <StaggerItem key={template.id}>
                <div
                  className={cn(
                    commonStyles.templateCard,
                    themeStyles.templateCard,
                    template.is_default && commonStyles.defaultCard
                  )}
                >
                  {template.is_default && (
                    <div className={commonStyles.defaultBadge}>⭐ Default</div>
                  )}

                  <div className={commonStyles.cardHeader}>
                    <h3>{template.name}</h3>
                    <span className={commonStyles.useCount}>
                      Used {template.use_count || 0} times
                    </span>
                  </div>

                  {template.description && (
                    <p className={cn(commonStyles.cardDesc, themeStyles.cardDesc)}>
                      {template.description}
                    </p>
                  )}

                  <div className={commonStyles.coverPreview}>
                    <h4>Cover Letter Preview:</h4>
                    <p>{template.cover_letter.substring(0, 150)}...</p>
                  </div>

                  {template.milestones && template.milestones.length > 0 && (
                    <div className={commonStyles.milestonesPreview}>
                      <h4>Milestones: {template.milestones.length}</h4>
                      <div className={commonStyles.milestoneBar}>
                        {template.milestones.map((m, i) => (
                          <div
                            key={i}
                            className={commonStyles.milestoneSegment}
                            style={{ width: `${m.percentage}%` }}
                            title={`${m.title}: ${m.percentage}%`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {template.tags && template.tags.length > 0 && (
                    <div className={commonStyles.tagsList}>
                      {template.tags.map((tag, i) => (
                        <span key={i} className={cn(commonStyles.tag, themeStyles.tag)}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className={commonStyles.cardActions}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      👁️ Preview
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setEditingTemplate(template); setShowModal(true); }}
                    >
                      ✏️ Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicate(template)}
                    >
                      📋 Duplicate
                    </Button>
                    {!template.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(template)}
                      >
                        ⭐ Set Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={commonStyles.deleteBtn}
                      onClick={() => handleDelete(template.id)}
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </PageTransition>
  );
}
