// @AI-HINT: Admin Tags management page
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import Loading from '@/app/components/Loading/Loading';
import { tagsApi } from '@/lib/api';
import { Tag, Plus, Edit, Trash2, Search, Hash } from 'lucide-react';

import commonStyles from './Tags.common.module.css';
import lightStyles from './Tags.light.module.css';
import darkStyles from './Tags.dark.module.css';

interface TagItem { id: string; name: string; type: string; usage_count: number; }

export default function AdminTagsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        const response = await tagsApi.list({ type: typeFilter === 'all' ? undefined : typeFilter });
        const tagsList = Array.isArray(response) ? response : (response as any).tags || [];
        setTags(tagsList.map((t: any) => ({ id: t.id?.toString(), name: t.name, type: t.type || 'general', usage_count: t.usage_count || 0 })));
      } catch (err) { console.error('Failed to fetch tags:', err); } 
      finally { setLoading(false); }
    };
    if (mounted) fetchTags();
  }, [mounted, typeFilter]);

  const themeStyles = mounted && resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const filteredTags = tags.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  if (!mounted) return <Loading />;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>Tags Management</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>Manage skills, categories, and tags</p>
        </div>
        <Button variant="primary" iconBefore={<Plus size={18} />}>Add Tag</Button>
      </div>

      <div className={cn(commonStyles.filters, themeStyles.filters)}>
        <div className={commonStyles.searchWrapper}>
          <Search size={18} className={commonStyles.searchIcon} />
          <input type="text" placeholder="Search tags..." value={search} onChange={(e) => setSearch(e.target.value)} className={cn(commonStyles.searchInput, themeStyles.searchInput)} />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={cn(commonStyles.filterSelect, themeStyles.filterSelect)}>
          <option value="all">All Types</option>
          <option value="skill">Skills</option>
          <option value="priority">Priority</option>
          <option value="location">Location</option>
          <option value="budget">Budget</option>
          <option value="general">General</option>
        </select>
      </div>

      {loading ? <Loading /> : (
        <div className={commonStyles.tagsGrid}>
          {filteredTags.map(tag => (
            <div key={tag.id} className={cn(commonStyles.tagCard, themeStyles.tagCard)}>
              <div className={commonStyles.tagInfo}>
                <Hash size={16} />
                <span className={cn(commonStyles.tagName, themeStyles.tagName)}>{tag.name}</span>
                <span className={cn(commonStyles.tagType, commonStyles[`type${tag.type}`])}>{tag.type}</span>
              </div>
              <span className={commonStyles.usageCount}>{tag.usage_count} uses</span>
              <div className={commonStyles.tagActions}>
                <Button variant="ghost" size="sm"><Edit size={14} /></Button>
                <Button variant="ghost" size="sm"><Trash2 size={14} /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
