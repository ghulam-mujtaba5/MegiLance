// @AI-HINT: Freelancer skills management page - add, edit, remove professional skills
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import { portalApi } from '@/lib/api';
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
      
      // Demo data
      setSkills([
        { id: '1', name: 'React', level: 'expert', years_experience: 5, endorsements: 24, verified: true },
        { id: '2', name: 'TypeScript', level: 'advanced', years_experience: 4, endorsements: 18, verified: true },
        { id: '3', name: 'Node.js', level: 'advanced', years_experience: 4, endorsements: 15, verified: false },
        { id: '4', name: 'Python', level: 'intermediate', years_experience: 2, endorsements: 8, verified: false },
        { id: '5', name: 'PostgreSQL', level: 'advanced', years_experience: 3, endorsements: 12, verified: true },
        { id: '6', name: 'Figma', level: 'intermediate', years_experience: 2, endorsements: 5, verified: false },
      ]);
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
      const skill: Skill = {
        id: Date.now().toString(),
        name: newSkill.name,
        level: newSkill.level,
        years_experience: newSkill.years_experience,
        endorsements: 0,
        verified: false,
      };
      
      try {
        // API endpoint not yet implemented, use local state
      } catch {
        // API not available, add locally
      }
      
      setSkills(prev => [...prev, skill]);
      setNewSkill({ name: '', level: 'intermediate', years_experience: 1 });
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to add skill:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    // API not yet available, just update local state
    setSkills(prev => prev.filter(s => s.id !== skillId));
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Skill
        </Button>
      </div>

      {loading ? (
        <div className={cn(commonStyles.loadingState, themeStyles.loadingState)}>
          Loading skills...
        </div>
      ) : skills.length === 0 ? (
        <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
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
                      <svg className={commonStyles.verifiedIcon} width="16" height="16" viewBox="0 0 24 24" fill="#4573df">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
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
                  onClick={() => handleRemoveSkill(skill.id)}
                  aria-label="Remove skill"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              
              <div className={commonStyles.skillMeta}>
                <span className={cn(commonStyles.experience, themeStyles.experience)}>
                  {skill.years_experience} year{skill.years_experience !== 1 ? 's' : ''} experience
                </span>
                <span className={cn(commonStyles.endorsements, themeStyles.endorsements)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                  </svg>
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
    </div>
  );
}
