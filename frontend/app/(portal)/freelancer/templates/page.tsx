// @AI-HINT: Proposal templates page for reusable proposal structures
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { proposalTemplatesApi } from '@/lib/api';
import Button from '@/app/components/Button/Button';
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
    <div className={cn(commonStyles.container, themeStyles.container)}>
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

      {/* Stats */}
      <div className={commonStyles.statsRow}>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <span className={commonStyles.statIcon}>📄</span>
          <div className={commonStyles.statInfo}>
            <strong>{templates.length}</strong>
            <span>Templates</span>
          </div>
        </div>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <span className={commonStyles.statIcon}>📊</span>
          <div className={commonStyles.statInfo}>
            <strong>{templates.reduce((sum, t) => sum + (t.use_count || 0), 0)}</strong>
            <span>Total Uses</span>
          </div>
        </div>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <span className={commonStyles.statIcon}>⭐</span>
          <div className={commonStyles.statInfo}>
            <strong>{templates.find(t => t.is_default)?.name || 'None'}</strong>
            <span>Default Template</span>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className={cn(commonStyles.emptyCard, themeStyles.emptyCard)}>
          <span>📝</span>
          <h3>No Templates Yet</h3>
          <p>Create your first proposal template to save time on future proposals.</p>
          <Button variant="primary" onClick={openNewTemplate}>
            Create Template
          </Button>
        </div>
      ) : (
        <div className={commonStyles.templatesGrid}>
          {templates.map(template => (
            <div
              key={template.id}
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
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(template.id)}
                >
                  🗑️
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {showModal && (
        <div className={commonStyles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={e => e.stopPropagation()}>
            <h2>{editingTemplate?.id ? 'Edit Template' : 'Create Template'}</h2>

            <div className={commonStyles.formGroup}>
              <label>Template Name *</label>
              <input
                type="text"
                value={editingTemplate?.name || ''}
                onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                className={cn(commonStyles.input, themeStyles.input)}
                placeholder="e.g., Web Development Proposal"
              />
            </div>

            <div className={commonStyles.formGroup}>
              <label>Description</label>
              <input
                type="text"
                value={editingTemplate?.description || ''}
                onChange={e => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                className={cn(commonStyles.input, themeStyles.input)}
                placeholder="Brief description of when to use this template"
              />
            </div>

            <div className={commonStyles.formGroup}>
              <label>Cover Letter Template *</label>
              <textarea
                value={editingTemplate?.cover_letter || ''}
                onChange={e => setEditingTemplate({ ...editingTemplate, cover_letter: e.target.value })}
                className={cn(commonStyles.textarea, themeStyles.input)}
                rows={8}
                placeholder="Write your proposal cover letter. Use {project_title}, {client_name}, etc. as placeholders..."
              />
            </div>

            <div className={commonStyles.formGroup}>
              <label>Milestones</label>
              {editingTemplate?.milestones?.map((milestone, i) => (
                <div key={i} className={commonStyles.milestoneInput}>
                  <input
                    type="text"
                    value={milestone.title}
                    onChange={e => updateMilestone(i, 'title', e.target.value)}
                    className={cn(commonStyles.input, themeStyles.input)}
                    placeholder="Milestone title"
                  />
                  <input
                    type="number"
                    value={milestone.percentage}
                    onChange={e => updateMilestone(i, 'percentage', parseInt(e.target.value))}
                    className={cn(commonStyles.input, commonStyles.percentInput, themeStyles.input)}
                    min={0}
                    max={100}
                  />
                  <span>%</span>
                  <button
                    type="button"
                    onClick={() => removeMilestone(i)}
                    className={commonStyles.removeBtn}
                  >
                    ×
                  </button>
                </div>
              ))}
              <Button variant="secondary" size="sm" onClick={addMilestone}>
                + Add Milestone
              </Button>
            </div>

            <div className={commonStyles.formRow}>
              <div className={commonStyles.formGroup}>
                <label>Default Rate</label>
                <input
                  type="number"
                  value={editingTemplate?.default_rate || ''}
                  onChange={e => setEditingTemplate({ ...editingTemplate, default_rate: parseFloat(e.target.value) })}
                  className={cn(commonStyles.input, themeStyles.input)}
                  min={0}
                  placeholder="0.00"
                />
              </div>
              <div className={commonStyles.formGroup}>
                <label>Rate Type</label>
                <select
                  value={editingTemplate?.default_rate_type || 'hourly'}
                  onChange={e => setEditingTemplate({ ...editingTemplate, default_rate_type: e.target.value as any })}
                  className={cn(commonStyles.input, themeStyles.input)}
                >
                  <option value="hourly">Hourly</option>
                  <option value="fixed">Fixed Price</option>
                </select>
              </div>
            </div>

            <div className={commonStyles.formGroup}>
              <label>Tags</label>
              <div className={commonStyles.tagInput}>
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className={cn(commonStyles.input, themeStyles.input)}
                  placeholder="Add tag and press Enter"
                />
                <Button variant="secondary" size="sm" onClick={addTag}>Add</Button>
              </div>
              <div className={commonStyles.tagList}>
                {editingTemplate?.tags?.map((tag, i) => (
                  <span key={i} className={cn(commonStyles.tag, themeStyles.tag)}>
                    {tag}
                    <button onClick={() => removeTag(i)}>×</button>
                  </span>
                ))}
              </div>
            </div>

            <div className={commonStyles.modalActions}>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave}>
                {editingTemplate?.id ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className={commonStyles.modalOverlay} onClick={() => setPreviewTemplate(null)}>
          <div className={cn(commonStyles.modal, commonStyles.previewModal, themeStyles.modal)} onClick={e => e.stopPropagation()}>
            <h2>📄 {previewTemplate.name}</h2>
            
            <div className={commonStyles.previewSection}>
              <h3>Cover Letter</h3>
              <div className={cn(commonStyles.previewContent, themeStyles.previewContent)}>
                {previewTemplate.cover_letter}
              </div>
            </div>

            {previewTemplate.milestones && previewTemplate.milestones.length > 0 && (
              <div className={commonStyles.previewSection}>
                <h3>Milestones</h3>
                <div className={commonStyles.previewMilestones}>
                  {previewTemplate.milestones.map((m, i) => (
                    <div key={i} className={cn(commonStyles.previewMilestone, themeStyles.previewMilestone)}>
                      <strong>{m.title}</strong>
                      <span>{m.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={commonStyles.modalActions}>
              <Button variant="secondary" onClick={() => setPreviewTemplate(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => { setEditingTemplate(previewTemplate); setPreviewTemplate(null); setShowModal(true); }}
              >
                Edit Template
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
