// @AI-HINT: Admin Categories management page
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import Loading from '@/app/components/Loading/Loading';
import { categoriesApi } from '@/lib/api';
import { List, Plus, Edit, Trash2, ChevronRight, FolderOpen } from 'lucide-react';

import commonStyles from './Categories.common.module.css';
import lightStyles from './Categories.light.module.css';
import darkStyles from './Categories.dark.module.css';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  project_count: number;
  children?: Category[];
}

export default function AdminCategoriesPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await categoriesApi.getTree();
        const catList = Array.isArray(response) ? response : (response as any).categories || [];
        setCategories(catList);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setLoading(false);
      }
    };

    if (mounted) {
      fetchCategories();
    }
  }, [mounted]);

  const themeStyles = mounted && resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const renderCategory = (category: Category, depth = 0) => (
    <div key={category.id} className={commonStyles.categoryItem} style={{ marginLeft: depth * 24 }}>
      <div className={cn(commonStyles.categoryRow, themeStyles.categoryRow)}>
        <div className={commonStyles.categoryInfo}>
          {category.children && category.children.length > 0 && (
            <ChevronRight size={18} className={commonStyles.expandIcon} />
          )}
          <FolderOpen size={18} />
          <span className={cn(commonStyles.categoryName, themeStyles.categoryName)}>
            {category.name}
          </span>
          <span className={commonStyles.projectCount}>
            {category.project_count} projects
          </span>
        </div>
        <div className={commonStyles.categoryActions}>
          <Button variant="ghost" size="sm" onClick={() => setEditingCategory(category)}>
            <Edit size={16} />
          </Button>
          <Button variant="ghost" size="sm">
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
      {category.children?.map(child => renderCategory(child, depth + 1))}
    </div>
  );

  if (!mounted) return <Loading />;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>Categories</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Manage project categories and subcategories
          </p>
        </div>
        <Button variant="primary" iconBefore={<Plus size={18} />} onClick={() => setShowModal(true)}>
          Add Category
        </Button>
      </div>

      {loading ? (
        <Loading />
      ) : categories.length === 0 ? (
        <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
          <List size={48} />
          <h3>No categories yet</h3>
          <p>Create your first category to organize projects</p>
          <Button variant="primary" onClick={() => setShowModal(true)}>Add Category</Button>
        </div>
      ) : (
        <div className={cn(commonStyles.categoriesList, themeStyles.categoriesList)}>
          {categories.map(cat => renderCategory(cat))}
        </div>
      )}
    </div>
  );
}
