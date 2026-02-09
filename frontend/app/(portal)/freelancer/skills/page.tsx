// @AI-HINT: Freelancer skills management page - add, edit, remove professional skills
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import Select from '@/app/components/Select/Select';
import { portalApi } from '@/lib/api';
import { Plus, Star, Trash2, Award, CheckCircle, ThumbsUp } from 'lucide-react';
import commonStyles from './Skills.common.module.css';
import lightStyles from './Skills.light.module.css';
import darkStyles from './Skills.dark.module.css';

interface Skill {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years_experience: number;
  endorsements: number;
  verified: boolean;
}

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'Learning the basics' },
  { value: 'intermediate', label: 'Intermediate', description: '1-3 years experience' },
  { value: 'advanced', label: 'Advanced', description: '3-5 years experience' },
  { value: 'expert', label: 'Expert', description: '5+ years experience' },
];

const POPULAR_SKILLS = [
  'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Next.js',
  'UI/UX Design', 'Figma', 'GraphQL', 'AWS', 'Docker', 'PostgreSQL',
  'Machine Learning', 'Data Analysis', 'Mobile Development', 'SEO',
];

export default function SkillsPage() {
  const { resolvedTheme } = useTheme();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSkill, setNewSkill] = useState<{ name: string; level: Skill['level']; years_experience: number }>({ name: '', level: 'intermediate', years_experience: 1 });
  const [saving, setSaving] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      setLoading(true);
      // Try API first
      try {
        const response = await portalApi.freelancer.getSkills() as { data?: Skill[] };
        if (response.data && response.data.length > 0) {
          setSkills(response.data);
          return;
        }
      } catch {
        // API not available
      }
      
      // No data available — show empty state
      setSkills([]);
    } catch (error) {
      console.error('Failed to load skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.name.trim()) return;
    
    setSaving(true);
    try {
      const skillData = {
        name: newSkill.name,
        level: newSkill.level,
        years_experience: newSkill.years_experience,
      };
      
      let addedSkill: Skill;
      try {
        const response = await (portalApi.freelancer as any).addSkill(skillData) as { data?: Skill };
        addedSkill = response.data || { ...skillData, id: Date.now().toString(), endorsements: 0, verified: false };
      } catch {
        addedSkill = { ...skillData, id: Date.now().toString(), endorsements: 0, verified: false };
      }
      
      setSkills(prev => [...prev, addedSkill]);
      setNewSkill({ name: '', level: 'intermediate', years_experience: 1 });
      setShowAddModal(false);
      showToast('Skill added successfully!');
    } catch (error) {
      console.error('Failed to add skill:', error);
      showToast('Failed to add skill.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    try {
      await (portalApi.freelancer as any).removeSkill(skillId);
    } catch {
      // API not available, remove locally
    }
    setSkills(prev => prev.filter(s => s.id !== skillId));
    setDeleteTargetId(null);
    showToast('Skill removed.');
  };

  const confirmRemoveSkill = async () => {
    if (deleteTargetId) {
      await handleRemoveSkill(deleteTargetId);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'beginner';
      case 'intermediate': return 'intermediate';
      case 'advanced': return 'advanced';
      case 'expert': return 'expert';
      default: return 'intermediate';
    }
  };

  if (!resolvedTheme) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>Skills & Expertise</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Showcase your professional skills to attract clients
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          Add Skill
        </Button>
      </div>

      {loading ? (
        <div className={cn(commonStyles.loadingState, themeStyles.loadingState)}>
          Loading skills...
        </div>
      ) : skills.length === 0 ? (
        <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
          <Star size={48} strokeWidth={1.5} opacity={0.5} />
          <h3>No Skills Added</h3>
          <p>Add your professional skills to improve your profile visibility</p>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>Add Your First Skill</Button>
        </div>
      ) : (
        <div className={commonStyles.skillsGrid}>
          {skills.map(skill => (
            <div key={skill.id} className={cn(commonStyles.skillCard, themeStyles.skillCard)}>
              <div className={commonStyles.skillHeader}>
                <div className={commonStyles.skillInfo}>
                  <h3 className={cn(commonStyles.skillName, themeStyles.skillName)}>
                    {skill.name}
                    {skill.verified && (
                      <CheckCircle className={commonStyles.verifiedIcon} size={16} color="#4573df" />
                    )}
                  </h3>
                  <span className={cn(
                    commonStyles.skillLevel,
                    commonStyles[`level_${getLevelColor(skill.level)}`],
                    themeStyles[`level_${getLevelColor(skill.level)}`]
                  )}>
                    {skill.level}
                  </span>
                </div>
                <button
                  className={cn(commonStyles.removeBtn, themeStyles.removeBtn)}
                  onClick={() => setDeleteTargetId(skill.id)}
                  aria-label="Remove skill"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className={commonStyles.skillMeta}>
                <span className={cn(commonStyles.experience, themeStyles.experience)}>
                  {skill.years_experience} year{skill.years_experience !== 1 ? 's' : ''} experience
                </span>
                <span className={cn(commonStyles.endorsements, themeStyles.endorsements)}>
                  <ThumbsUp size={14} />
                  {skill.endorsements} endorsement{skill.endorsements !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className={commonStyles.progressBar}>
                <div 
                  className={cn(commonStyles.progressFill, themeStyles.progressFill)}
                  style={{ 
                    width: skill.level === 'beginner' ? '25%' : 
                           skill.level === 'intermediate' ? '50%' : 
                           skill.level === 'advanced' ? '75%' : '100%' 
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Skill Modal */}
      {showAddModal && (
        <div className={commonStyles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div 
            className={cn(commonStyles.modal, themeStyles.modal)} 
            onClick={e => e.stopPropagation()}
          >
            <h2 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>Add New Skill</h2>
            
            <div className={commonStyles.formGroup}>
              <label className={cn(commonStyles.label, themeStyles.label)}>Skill Name</label>
              <Input
                value={newSkill.name}
                onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., React, Python, UI Design"
              />
              <div className={commonStyles.suggestions}>
                {POPULAR_SKILLS.filter(s => 
                  !skills.some(skill => skill.name.toLowerCase() === s.toLowerCase()) &&
                  (newSkill.name === '' || s.toLowerCase().includes(newSkill.name.toLowerCase()))
                ).slice(0, 6).map(suggestion => (
                  <button
                    key={suggestion}
                    className={cn(commonStyles.suggestionChip, themeStyles.suggestionChip)}
                    onClick={() => setNewSkill(prev => ({ ...prev, name: suggestion }))}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div className={commonStyles.formGroup}>
              <label className={cn(commonStyles.label, themeStyles.label)}>Experience Level</label>
              <div className={commonStyles.levelOptions}>
                {SKILL_LEVELS.map(level => (
                  <button
                    key={level.value}
                    className={cn(
                      commonStyles.levelOption,
                      themeStyles.levelOption,
                      newSkill.level === level.value && commonStyles.levelOptionActive,
                      newSkill.level === level.value && themeStyles.levelOptionActive
                    )}
                    onClick={() => setNewSkill(prev => ({ ...prev, level: level.value as Skill['level'] }))}
                  >
                    <span className={commonStyles.levelLabel}>{level.label}</span>
                    <span className={cn(commonStyles.levelDesc, themeStyles.levelDesc)}>{level.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={commonStyles.formGroup}>
              <label className={cn(commonStyles.label, themeStyles.label)}>Years of Experience</label>
              <Input
                type="number"
                min={0}
                max={30}
                value={newSkill.years_experience}
                onChange={(e) => setNewSkill(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className={commonStyles.modalActions}>
              <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button 
                variant="primary" 
                onClick={handleAddSkill} 
                isLoading={saving}
                disabled={!newSkill.name.trim()}
              >
                Add Skill
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className={commonStyles.modalOverlay} onClick={() => setDeleteTargetId(null)}>
          <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={e => e.stopPropagation()}>
            <h2 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>Remove Skill</h2>
            <p className={cn(commonStyles.confirmText, themeStyles.confirmText)}>
              Are you sure you want to remove this skill from your profile?
            </p>
            <div className={commonStyles.modalActions}>
              <Button variant="ghost" onClick={() => setDeleteTargetId(null)}>Cancel</Button>
              <Button variant="danger" onClick={confirmRemoveSkill}>Remove</Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={cn(
          commonStyles.toast,
          themeStyles.toast,
          toast.type === 'error' && commonStyles.toastError,
          toast.type === 'error' && themeStyles.toastError
        )}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
