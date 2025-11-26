// @AI-HINT: Admin skill taxonomy management page for organizing platform skills hierarchy
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '../../../components/Button/Button';
import commonStyles from './Skills.common.module.css';
import lightStyles from './Skills.light.module.css';
import darkStyles from './Skills.dark.module.css';

interface Skill {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  parent_id?: string;
  description?: string;
  is_verified: boolean;
  is_featured: boolean;
  usage_count: number;
  synonyms: string[];
  related_skills: string[];
  created_at: string;
}

interface SkillCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  skills_count: number;
  color: string;
}

export default function SkillsAdminPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'skills' | 'categories'>('skills');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [isEditingSkill, setIsEditingSkill] = useState<Skill | null>(null);
  const [isEditingCategory, setIsEditingCategory] = useState<SkillCategory | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [skillForm, setSkillForm] = useState({
    name: '',
    category_id: '',
    description: '',
    synonyms: '',
    is_verified: false,
    is_featured: false
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: '',
    color: '#4573df'
  });

  useEffect(() => {
    setMounted(true);
    loadSkillsData();
  }, []);

  const loadSkillsData = async () => {
    setLoading(true);
    try {
      // Simulated API calls
      setCategories([
        { id: 'c1', name: 'Development', slug: 'development', description: 'Software development skills', icon: '💻', skills_count: 45, color: '#3b82f6' },
        { id: 'c2', name: 'Design', slug: 'design', description: 'UI/UX and graphic design', icon: '🎨', skills_count: 28, color: '#ec4899' },
        { id: 'c3', name: 'Marketing', slug: 'marketing', description: 'Digital marketing skills', icon: '📈', skills_count: 22, color: '#10b981' },
        { id: 'c4', name: 'Writing', slug: 'writing', description: 'Content and copywriting', icon: '✍️', skills_count: 18, color: '#f59e0b' },
        { id: 'c5', name: 'Data Science', slug: 'data-science', description: 'Analytics and ML', icon: '📊', skills_count: 15, color: '#8b5cf6' }
      ]);

      setSkills([
        { id: 's1', name: 'React.js', slug: 'react-js', category_id: 'c1', is_verified: true, is_featured: true, usage_count: 1250, synonyms: ['React', 'ReactJS'], related_skills: ['s2', 's3'], created_at: new Date().toISOString() },
        { id: 's2', name: 'TypeScript', slug: 'typescript', category_id: 'c1', is_verified: true, is_featured: true, usage_count: 980, synonyms: ['TS'], related_skills: ['s1'], created_at: new Date().toISOString() },
        { id: 's3', name: 'Node.js', slug: 'node-js', category_id: 'c1', is_verified: true, is_featured: false, usage_count: 890, synonyms: ['Node', 'NodeJS'], related_skills: ['s1'], created_at: new Date().toISOString() },
        { id: 's4', name: 'Python', slug: 'python', category_id: 'c1', is_verified: true, is_featured: true, usage_count: 1100, synonyms: [], related_skills: [], created_at: new Date().toISOString() },
        { id: 's5', name: 'Figma', slug: 'figma', category_id: 'c2', is_verified: true, is_featured: true, usage_count: 750, synonyms: [], related_skills: [], created_at: new Date().toISOString() },
        { id: 's6', name: 'Adobe Photoshop', slug: 'photoshop', category_id: 'c2', is_verified: true, is_featured: false, usage_count: 680, synonyms: ['Photoshop', 'PS'], related_skills: [], created_at: new Date().toISOString() },
        { id: 's7', name: 'SEO', slug: 'seo', category_id: 'c3', is_verified: true, is_featured: true, usage_count: 520, synonyms: ['Search Engine Optimization'], related_skills: [], created_at: new Date().toISOString() },
        { id: 's8', name: 'Content Writing', slug: 'content-writing', category_id: 'c4', is_verified: true, is_featured: false, usage_count: 410, synonyms: ['Copywriting'], related_skills: [], created_at: new Date().toISOString() },
        { id: 's9', name: 'Machine Learning', slug: 'machine-learning', category_id: 'c5', is_verified: true, is_featured: true, usage_count: 380, synonyms: ['ML'], related_skills: [], created_at: new Date().toISOString() },
        { id: 's10', name: 'Vue.js', slug: 'vue-js', category_id: 'c1', is_verified: false, is_featured: false, usage_count: 45, synonyms: ['Vue', 'VueJS'], related_skills: [], created_at: new Date().toISOString(), description: 'User-suggested skill' }
      ]);
    } catch (error) {
      console.error('Failed to load skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSkill = () => {
    setIsCreating(true);
    setIsEditingSkill(null);
    setSkillForm({ name: '', category_id: categories[0]?.id || '', description: '', synonyms: '', is_verified: false, is_featured: false });
  };

  const handleEditSkill = (skill: Skill) => {
    setIsEditingSkill(skill);
    setIsCreating(false);
    setSkillForm({
      name: skill.name,
      category_id: skill.category_id,
      description: skill.description || '',
      synonyms: skill.synonyms.join(', '),
      is_verified: skill.is_verified,
      is_featured: skill.is_featured
    });
  };

  const handleSaveSkill = async () => {
    if (!skillForm.name.trim() || !skillForm.category_id) return;

    if (isCreating) {
      const newSkill: Skill = {
        id: Date.now().toString(),
        name: skillForm.name,
        slug: skillForm.name.toLowerCase().replace(/\s+/g, '-'),
        category_id: skillForm.category_id,
        description: skillForm.description,
        is_verified: skillForm.is_verified,
        is_featured: skillForm.is_featured,
        usage_count: 0,
        synonyms: skillForm.synonyms.split(',').map(s => s.trim()).filter(Boolean),
        related_skills: [],
        created_at: new Date().toISOString()
      };
      setSkills(prev => [newSkill, ...prev]);
    } else if (isEditingSkill) {
      setSkills(prev =>
        prev.map(s =>
          s.id === isEditingSkill.id
            ? {
                ...s,
                name: skillForm.name,
                category_id: skillForm.category_id,
                description: skillForm.description,
                is_verified: skillForm.is_verified,
                is_featured: skillForm.is_featured,
                synonyms: skillForm.synonyms.split(',').map(s => s.trim()).filter(Boolean)
              }
            : s
        )
      );
    }

    setIsCreating(false);
    setIsEditingSkill(null);
  };

  const handleDeleteSkill = async (skillId: string) => {
    setSkills(prev => prev.filter(s => s.id !== skillId));
  };

  const handleVerifySkill = async (skillId: string) => {
    setSkills(prev =>
      prev.map(s => (s.id === skillId ? { ...s, is_verified: true } : s))
    );
  };

  const handleToggleFeatured = async (skillId: string) => {
    setSkills(prev =>
      prev.map(s => (s.id === skillId ? { ...s, is_featured: !s.is_featured } : s))
    );
  };

  const handleCreateCategory = () => {
    setIsCreating(true);
    setIsEditingCategory(null);
    setCategoryForm({ name: '', description: '', icon: '', color: '#4573df' });
  };

  const handleEditCategory = (category: SkillCategory) => {
    setIsEditingCategory(category);
    setIsCreating(false);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      color: category.color
    });
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) return;

    if (isCreating) {
      const newCategory: SkillCategory = {
        id: Date.now().toString(),
        name: categoryForm.name,
        slug: categoryForm.name.toLowerCase().replace(/\s+/g, '-'),
        description: categoryForm.description,
        icon: categoryForm.icon,
        color: categoryForm.color,
        skills_count: 0
      };
      setCategories(prev => [...prev, newCategory]);
    } else if (isEditingCategory) {
      setCategories(prev =>
        prev.map(c =>
          c.id === isEditingCategory.id
            ? { ...c, name: categoryForm.name, description: categoryForm.description, icon: categoryForm.icon, color: categoryForm.color }
            : c
        )
      );
    }

    setIsCreating(false);
    setIsEditingCategory(null);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    setSkills(prev => prev.filter(s => s.category_id !== categoryId));
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Unknown';
  };

  const getCategoryColor = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.color || '#64748b';
  };

  const filteredSkills = skills.filter(skill => {
    if (selectedCategory !== 'all' && skill.category_id !== selectedCategory) return false;
    if (showVerifiedOnly && !skill.is_verified) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return skill.name.toLowerCase().includes(query) || skill.synonyms.some(s => s.toLowerCase().includes(query));
    }
    return true;
  });

  const unverifiedCount = skills.filter(s => !s.is_verified).length;

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={cn(commonStyles.header, themeStyles.header)}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>
            Skill Taxonomy
          </h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Manage platform skills, categories, and relationships
          </p>
        </div>
        <div className={commonStyles.headerActions}>
          {unverifiedCount > 0 && (
            <span className={cn(commonStyles.pendingBadge, themeStyles.pendingBadge)}>
              {unverifiedCount} pending verification
            </span>
          )}
          <Button
            variant="primary"
            onClick={activeTab === 'skills' ? handleCreateSkill : handleCreateCategory}
          >
            Add {activeTab === 'skills' ? 'Skill' : 'Category'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className={cn(commonStyles.tabs, themeStyles.tabs)}>
        <button
          onClick={() => setActiveTab('skills')}
          className={cn(
            commonStyles.tab,
            themeStyles.tab,
            activeTab === 'skills' && commonStyles.tabActive,
            activeTab === 'skills' && themeStyles.tabActive
          )}
        >
          Skills ({skills.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={cn(
            commonStyles.tab,
            themeStyles.tab,
            activeTab === 'categories' && commonStyles.tabActive,
            activeTab === 'categories' && themeStyles.tabActive
          )}
        >
          Categories ({categories.length})
        </button>
      </div>

      {loading ? (
        <div className={commonStyles.loading}>Loading...</div>
      ) : (
        <>
          {activeTab === 'skills' && (
            <>
              {/* Filters */}
              <div className={cn(commonStyles.filterBar, themeStyles.filterBar)}>
                <input
                  type="text"
                  placeholder="Search skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(commonStyles.searchInput, themeStyles.searchInput)}
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={cn(commonStyles.select, themeStyles.select)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <label className={cn(commonStyles.checkbox, themeStyles.checkbox)}>
                  <input
                    type="checkbox"
                    checked={showVerifiedOnly}
                    onChange={(e) => setShowVerifiedOnly(e.target.checked)}
                  />
                  Verified only
                </label>
              </div>

              {/* Skills List */}
              <div className={commonStyles.skillsList}>
                {filteredSkills.length === 0 ? (
                  <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                    <p>No skills found</p>
                  </div>
                ) : (
                  filteredSkills.map(skill => (
                    <div key={skill.id} className={cn(commonStyles.skillCard, themeStyles.skillCard)}>
                      <div className={commonStyles.skillInfo}>
                        <div className={commonStyles.skillHeader}>
                          <h4 className={cn(commonStyles.skillName, themeStyles.skillName)}>
                            {skill.name}
                            {skill.is_featured && (
                              <span className={cn(commonStyles.featuredBadge, themeStyles.featuredBadge)}>
                                ⭐ Featured
                              </span>
                            )}
                          </h4>
                          <span
                            className={cn(commonStyles.categoryTag, themeStyles.categoryTag)}
                            style={{ backgroundColor: getCategoryColor(skill.category_id) + '20', color: getCategoryColor(skill.category_id) }}
                          >
                            {getCategoryName(skill.category_id)}
                          </span>
                        </div>
                        {skill.description && (
                          <p className={cn(commonStyles.skillDesc, themeStyles.skillDesc)}>
                            {skill.description}
                          </p>
                        )}
                        <div className={cn(commonStyles.skillMeta, themeStyles.skillMeta)}>
                          <span>{skill.usage_count.toLocaleString()} uses</span>
                          {skill.synonyms.length > 0 && (
                            <span>Also: {skill.synonyms.join(', ')}</span>
                          )}
                        </div>
                      </div>
                      <div className={commonStyles.skillActions}>
                        {!skill.is_verified && (
                          <Button variant="success" size="sm" onClick={() => handleVerifySkill(skill.id)}>
                            Verify
                          </Button>
                        )}
                        <button
                          onClick={() => handleToggleFeatured(skill.id)}
                          className={cn(commonStyles.iconBtn, themeStyles.iconBtn)}
                          title={skill.is_featured ? 'Remove from featured' : 'Add to featured'}
                        >
                          {skill.is_featured ? '⭐' : '☆'}
                        </button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditSkill(skill)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteSkill(skill.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === 'categories' && (
            <div className={commonStyles.categoriesGrid}>
              {categories.map(category => (
                <div
                  key={category.id}
                  className={cn(commonStyles.categoryCard, themeStyles.categoryCard)}
                  style={{ borderLeftColor: category.color }}
                >
                  <div className={commonStyles.categoryHeader}>
                    <span className={commonStyles.categoryIcon}>{category.icon}</span>
                    <h4 className={cn(commonStyles.categoryName, themeStyles.categoryName)}>
                      {category.name}
                    </h4>
                  </div>
                  {category.description && (
                    <p className={cn(commonStyles.categoryDesc, themeStyles.categoryDesc)}>
                      {category.description}
                    </p>
                  )}
                  <div className={cn(commonStyles.categoryMeta, themeStyles.categoryMeta)}>
                    <span>{category.skills_count} skills</span>
                  </div>
                  <div className={commonStyles.categoryActions}>
                    <Button variant="ghost" size="sm" onClick={() => handleEditCategory(category)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Skill Modal */}
      {(isCreating && activeTab === 'skills') || isEditingSkill ? (
        <div className={cn(commonStyles.modal, themeStyles.modal)}>
          <div className={cn(commonStyles.modalContent, themeStyles.modalContent)}>
            <div className={cn(commonStyles.modalHeader, themeStyles.modalHeader)}>
              <h2>{isEditingSkill ? 'Edit Skill' : 'New Skill'}</h2>
              <button onClick={() => { setIsCreating(false); setIsEditingSkill(null); }} className={cn(commonStyles.closeBtn, themeStyles.closeBtn)}>×</button>
            </div>
            <div className={commonStyles.modalBody}>
              <div className={commonStyles.formGroup}>
                <label>Skill Name</label>
                <input
                  type="text"
                  value={skillForm.name}
                  onChange={(e) => setSkillForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. React.js"
                  className={cn(commonStyles.input, themeStyles.input)}
                />
              </div>
              <div className={commonStyles.formGroup}>
                <label>Category</label>
                <select
                  value={skillForm.category_id}
                  onChange={(e) => setSkillForm(prev => ({ ...prev, category_id: e.target.value }))}
                  className={cn(commonStyles.select, themeStyles.select)}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className={commonStyles.formGroup}>
                <label>Description (optional)</label>
                <textarea
                  value={skillForm.description}
                  onChange={(e) => setSkillForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the skill"
                  rows={3}
                  className={cn(commonStyles.textarea, themeStyles.textarea)}
                />
              </div>
              <div className={commonStyles.formGroup}>
                <label>Synonyms (comma-separated)</label>
                <input
                  type="text"
                  value={skillForm.synonyms}
                  onChange={(e) => setSkillForm(prev => ({ ...prev, synonyms: e.target.value }))}
                  placeholder="e.g. React, ReactJS"
                  className={cn(commonStyles.input, themeStyles.input)}
                />
              </div>
              <div className={commonStyles.checkboxGroup}>
                <label className={cn(commonStyles.checkbox, themeStyles.checkbox)}>
                  <input
                    type="checkbox"
                    checked={skillForm.is_verified}
                    onChange={(e) => setSkillForm(prev => ({ ...prev, is_verified: e.target.checked }))}
                  />
                  Verified skill
                </label>
                <label className={cn(commonStyles.checkbox, themeStyles.checkbox)}>
                  <input
                    type="checkbox"
                    checked={skillForm.is_featured}
                    onChange={(e) => setSkillForm(prev => ({ ...prev, is_featured: e.target.checked }))}
                  />
                  Featured skill
                </label>
              </div>
            </div>
            <div className={commonStyles.modalFooter}>
              <Button variant="secondary" onClick={() => { setIsCreating(false); setIsEditingSkill(null); }}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveSkill}>Save Skill</Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Category Modal */}
      {(isCreating && activeTab === 'categories') || isEditingCategory ? (
        <div className={cn(commonStyles.modal, themeStyles.modal)}>
          <div className={cn(commonStyles.modalContent, themeStyles.modalContent)}>
            <div className={cn(commonStyles.modalHeader, themeStyles.modalHeader)}>
              <h2>{isEditingCategory ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={() => { setIsCreating(false); setIsEditingCategory(null); }} className={cn(commonStyles.closeBtn, themeStyles.closeBtn)}>×</button>
            </div>
            <div className={commonStyles.modalBody}>
              <div className={commonStyles.formGroup}>
                <label>Category Name</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Development"
                  className={cn(commonStyles.input, themeStyles.input)}
                />
              </div>
              <div className={commonStyles.formGroup}>
                <label>Description</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description"
                  rows={2}
                  className={cn(commonStyles.textarea, themeStyles.textarea)}
                />
              </div>
              <div className={commonStyles.formRow}>
                <div className={commonStyles.formGroup}>
                  <label>Icon (emoji)</label>
                  <input
                    type="text"
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="💻"
                    className={cn(commonStyles.input, themeStyles.input)}
                  />
                </div>
                <div className={commonStyles.formGroup}>
                  <label>Color</label>
                  <input
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                    className={cn(commonStyles.colorInput, themeStyles.colorInput)}
                  />
                </div>
              </div>
            </div>
            <div className={commonStyles.modalFooter}>
              <Button variant="secondary" onClick={() => { setIsCreating(false); setIsEditingCategory(null); }}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveCategory}>Save Category</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
