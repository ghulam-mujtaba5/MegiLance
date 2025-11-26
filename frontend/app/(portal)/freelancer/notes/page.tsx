// @AI-HINT: Project notes and tags management for organizing and annotating work
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '../../../components/Button/Button';
import commonStyles from './Notes.common.module.css';
import lightStyles from './Notes.light.module.css';
import darkStyles from './Notes.dark.module.css';

interface Note {
  id: string;
  project_id: string;
  project_title: string;
  content: string;
  color: string;
  is_pinned: boolean;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  tags: string[];
}

interface Tag {
  id: string;
  name: string;
  color: string;
  usage_count: number;
}

export default function NotesPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState({ content: '', color: '#fef3c7', tags: [] as string[], is_private: false });
  const [newTagName, setNewTagName] = useState('');
  const [showTagManager, setShowTagManager] = useState(false);

  const colorOptions = [
    { value: '#fef3c7', label: 'Yellow' },
    { value: '#dbeafe', label: 'Blue' },
    { value: '#dcfce7', label: 'Green' },
    { value: '#fce7f3', label: 'Pink' },
    { value: '#f3e8ff', label: 'Purple' },
    { value: '#fed7aa', label: 'Orange' }
  ];

  useEffect(() => {
    setMounted(true);
    loadNotesData();
  }, []);

  const loadNotesData = async () => {
    setLoading(true);
    try {
      // Simulated API calls
      setNotes([
        {
          id: '1',
          project_id: 'p1',
          project_title: 'E-commerce Website',
          content: 'Client prefers minimalist design. Check Figma file for color palette.',
          color: '#fef3c7',
          is_pinned: true,
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tags: ['design', 'client-feedback']
        },
        {
          id: '2',
          project_id: 'p2',
          project_title: 'Mobile App Development',
          content: 'API documentation located at /docs/api. Need to implement push notifications by Friday.',
          color: '#dbeafe',
          is_pinned: false,
          is_private: false,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          tags: ['technical', 'deadline']
        },
        {
          id: '3',
          project_id: 'p1',
          project_title: 'E-commerce Website',
          content: 'Payment gateway credentials stored in 1Password vault under "E-commerce Project"',
          color: '#dcfce7',
          is_pinned: true,
          is_private: true,
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date(Date.now() - 172800000).toISOString(),
          tags: ['credentials', 'important']
        },
        {
          id: '4',
          project_id: 'p3',
          project_title: 'Marketing Dashboard',
          content: 'Use Chart.js for all visualizations. Client approved the proposal on March 15th.',
          color: '#f3e8ff',
          is_pinned: false,
          is_private: false,
          created_at: new Date(Date.now() - 259200000).toISOString(),
          updated_at: new Date(Date.now() - 259200000).toISOString(),
          tags: ['technical', 'approved']
        }
      ]);

      setTags([
        { id: 't1', name: 'design', color: '#f59e0b', usage_count: 5 },
        { id: 't2', name: 'technical', color: '#3b82f6', usage_count: 8 },
        { id: 't3', name: 'client-feedback', color: '#10b981', usage_count: 3 },
        { id: 't4', name: 'deadline', color: '#ef4444', usage_count: 4 },
        { id: 't5', name: 'credentials', color: '#8b5cf6', usage_count: 2 },
        { id: 't6', name: 'important', color: '#ec4899', usage_count: 6 },
        { id: 't7', name: 'approved', color: '#22c55e', usage_count: 3 }
      ]);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = () => {
    setIsCreating(true);
    setEditForm({ content: '', color: '#fef3c7', tags: [], is_private: false });
  };

  const handleSaveNote = async () => {
    if (!editForm.content.trim()) return;

    if (isCreating) {
      const newNote: Note = {
        id: Date.now().toString(),
        project_id: 'p1',
        project_title: 'New Project',
        content: editForm.content,
        color: editForm.color,
        is_pinned: false,
        is_private: editForm.is_private,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: editForm.tags
      };
      setNotes(prev => [newNote, ...prev]);
    } else if (isEditing) {
      setNotes(prev =>
        prev.map(n =>
          n.id === isEditing
            ? { ...n, content: editForm.content, color: editForm.color, tags: editForm.tags, is_private: editForm.is_private, updated_at: new Date().toISOString() }
            : n
        )
      );
    }

    setIsCreating(false);
    setIsEditing(null);
    setEditForm({ content: '', color: '#fef3c7', tags: [], is_private: false });
  };

  const handleEditNote = (note: Note) => {
    setIsEditing(note.id);
    setEditForm({
      content: note.content,
      color: note.color,
      tags: note.tags,
      is_private: note.is_private
    });
  };

  const handleDeleteNote = async (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
  };

  const handleTogglePin = async (noteId: string) => {
    setNotes(prev =>
      prev.map(n => (n.id === noteId ? { ...n, is_pinned: !n.is_pinned } : n))
    );
  };

  const handleTagToggle = (tagName: string) => {
    setEditForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tagName)
        ? prev.tags.filter(t => t !== tagName)
        : [...prev.tags, tagName]
    }));
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    const newTag: Tag = {
      id: Date.now().toString(),
      name: newTagName.toLowerCase().replace(/\s+/g, '-'),
      color: '#' + Math.floor(Math.random() * 16777215).toString(16),
      usage_count: 0
    };
    setTags(prev => [...prev, newTag]);
    setNewTagName('');
  };

  const handleDeleteTag = (tagId: string) => {
    setTags(prev => prev.filter(t => t.id !== tagId));
    const tagToDelete = tags.find(t => t.id === tagId);
    if (tagToDelete) {
      setNotes(prev =>
        prev.map(n => ({
          ...n,
          tags: n.tags.filter(t => t !== tagToDelete.name)
        }))
      );
    }
  };

  const filteredNotes = notes.filter(note => {
    if (showPinnedOnly && !note.is_pinned) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!note.content.toLowerCase().includes(query) && !note.project_title.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (selectedTags.length > 0) {
      if (!selectedTags.some(tag => note.tags.includes(tag))) {
        return false;
      }
    }
    return true;
  });

  const pinnedNotes = filteredNotes.filter(n => n.is_pinned);
  const unpinnedNotes = filteredNotes.filter(n => !n.is_pinned);

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={cn(commonStyles.header, themeStyles.header)}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>
            Notes & Tags
          </h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Organize your projects with notes and custom tags
          </p>
        </div>
        <div className={commonStyles.headerActions}>
          <Button variant="secondary" onClick={() => setShowTagManager(true)}>
            Manage Tags
          </Button>
          <Button variant="primary" onClick={handleCreateNote}>
            New Note
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className={cn(commonStyles.filterBar, themeStyles.filterBar)}>
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(commonStyles.searchInput, themeStyles.searchInput)}
        />
        <label className={cn(commonStyles.checkbox, themeStyles.checkbox)}>
          <input
            type="checkbox"
            checked={showPinnedOnly}
            onChange={(e) => setShowPinnedOnly(e.target.checked)}
          />
          Pinned only
        </label>
      </div>

      {/* Tags Filter */}
      <div className={cn(commonStyles.tagsFilter, themeStyles.tagsFilter)}>
        <span className={cn(commonStyles.filterLabel, themeStyles.filterLabel)}>Filter by tags:</span>
        <div className={commonStyles.tagsList}>
          {tags.map(tag => (
            <button
              key={tag.id}
              onClick={() => setSelectedTags(prev =>
                prev.includes(tag.name)
                  ? prev.filter(t => t !== tag.name)
                  : [...prev, tag.name]
              )}
              className={cn(
                commonStyles.tagButton,
                themeStyles.tagButton,
                selectedTags.includes(tag.name) && commonStyles.tagSelected,
                selectedTags.includes(tag.name) && themeStyles.tagSelected
              )}
              style={{ '--tag-color': tag.color } as React.CSSProperties}
            >
              {tag.name}
            </button>
          ))}
          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              className={cn(commonStyles.clearTags, themeStyles.clearTags)}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className={commonStyles.loading}>Loading notes...</div>
      ) : (
        <div className={commonStyles.notesContainer}>
          {/* Pinned Notes */}
          {pinnedNotes.length > 0 && (
            <div className={commonStyles.notesSection}>
              <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                📌 Pinned
              </h3>
              <div className={commonStyles.notesGrid}>
                {pinnedNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={() => handleEditNote(note)}
                    onDelete={() => handleDeleteNote(note.id)}
                    onTogglePin={() => handleTogglePin(note.id)}
                    themeStyles={themeStyles}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Notes */}
          {unpinnedNotes.length > 0 && (
            <div className={commonStyles.notesSection}>
              {pinnedNotes.length > 0 && (
                <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                  Other Notes
                </h3>
              )}
              <div className={commonStyles.notesGrid}>
                {unpinnedNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={() => handleEditNote(note)}
                    onDelete={() => handleDeleteNote(note.id)}
                    onTogglePin={() => handleTogglePin(note.id)}
                    themeStyles={themeStyles}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredNotes.length === 0 && (
            <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
              <p>No notes found</p>
              <Button variant="primary" onClick={handleCreateNote}>
                Create Your First Note
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(isCreating || isEditing) && (
        <div className={cn(commonStyles.modal, themeStyles.modal)}>
          <div className={cn(commonStyles.modalContent, themeStyles.modalContent)}>
            <div className={cn(commonStyles.modalHeader, themeStyles.modalHeader)}>
              <h2>{isCreating ? 'New Note' : 'Edit Note'}</h2>
              <button
                onClick={() => { setIsCreating(false); setIsEditing(null); }}
                className={cn(commonStyles.closeBtn, themeStyles.closeBtn)}
              >
                ×
              </button>
            </div>
            <div className={commonStyles.modalBody}>
              <div className={commonStyles.formGroup}>
                <label>Note Content</label>
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your note..."
                  rows={5}
                  className={cn(commonStyles.textarea, themeStyles.textarea)}
                />
              </div>
              <div className={commonStyles.formGroup}>
                <label>Color</label>
                <div className={commonStyles.colorPicker}>
                  {colorOptions.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setEditForm(prev => ({ ...prev, color: color.value }))}
                      className={cn(
                        commonStyles.colorOption,
                        editForm.color === color.value && commonStyles.colorSelected
                      )}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
              <div className={commonStyles.formGroup}>
                <label>Tags</label>
                <div className={commonStyles.tagPicker}>
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => handleTagToggle(tag.name)}
                      className={cn(
                        commonStyles.tagOption,
                        themeStyles.tagOption,
                        editForm.tags.includes(tag.name) && commonStyles.tagOptionSelected,
                        editForm.tags.includes(tag.name) && themeStyles.tagOptionSelected
                      )}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
              <label className={cn(commonStyles.privateCheck, themeStyles.privateCheck)}>
                <input
                  type="checkbox"
                  checked={editForm.is_private}
                  onChange={(e) => setEditForm(prev => ({ ...prev, is_private: e.target.checked }))}
                />
                Private note (only visible to you)
              </label>
            </div>
            <div className={commonStyles.modalFooter}>
              <Button variant="secondary" onClick={() => { setIsCreating(false); setIsEditing(null); }}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveNote}>
                {isCreating ? 'Create Note' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Manager Modal */}
      {showTagManager && (
        <div className={cn(commonStyles.modal, themeStyles.modal)}>
          <div className={cn(commonStyles.modalContent, themeStyles.modalContent)}>
            <div className={cn(commonStyles.modalHeader, themeStyles.modalHeader)}>
              <h2>Manage Tags</h2>
              <button
                onClick={() => setShowTagManager(false)}
                className={cn(commonStyles.closeBtn, themeStyles.closeBtn)}
              >
                ×
              </button>
            </div>
            <div className={commonStyles.modalBody}>
              <div className={commonStyles.createTagRow}>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="New tag name..."
                  className={cn(commonStyles.input, themeStyles.input)}
                />
                <Button variant="primary" size="sm" onClick={handleCreateTag}>
                  Add Tag
                </Button>
              </div>
              <div className={commonStyles.tagManagerList}>
                {tags.map(tag => (
                  <div key={tag.id} className={cn(commonStyles.tagManagerItem, themeStyles.tagManagerItem)}>
                    <div className={commonStyles.tagInfo}>
                      <span
                        className={commonStyles.tagColor}
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className={cn(commonStyles.tagName, themeStyles.tagName)}>
                        {tag.name}
                      </span>
                      <span className={cn(commonStyles.tagCount, themeStyles.tagCount)}>
                        ({tag.usage_count} uses)
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className={cn(commonStyles.deleteTagBtn, themeStyles.deleteTagBtn)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface NoteCardProps {
  note: Note;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  themeStyles: Record<string, string>;
}

function NoteCard({ note, onEdit, onDelete, onTogglePin, themeStyles }: NoteCardProps) {
  return (
    <div
      className={cn(commonStyles.noteCard, themeStyles.noteCard)}
      style={{ backgroundColor: note.color }}
    >
      <div className={commonStyles.noteHeader}>
        <span className={cn(commonStyles.projectTitle, themeStyles.projectTitle)}>
          {note.project_title}
        </span>
        <div className={commonStyles.noteActions}>
          <button
            onClick={onTogglePin}
            className={cn(commonStyles.actionBtn, note.is_pinned && commonStyles.pinned)}
            title={note.is_pinned ? 'Unpin' : 'Pin'}
          >
            📌
          </button>
          <button onClick={onEdit} className={commonStyles.actionBtn} title="Edit">
            ✏️
          </button>
          <button onClick={onDelete} className={commonStyles.actionBtn} title="Delete">
            🗑️
          </button>
        </div>
      </div>
      <p className={cn(commonStyles.noteContent, themeStyles.noteContent)}>
        {note.content}
      </p>
      {note.tags.length > 0 && (
        <div className={commonStyles.noteTags}>
          {note.tags.map(tag => (
            <span key={tag} className={cn(commonStyles.noteTag, themeStyles.noteTag)}>
              #{tag}
            </span>
          ))}
        </div>
      )}
      <div className={cn(commonStyles.noteMeta, themeStyles.noteMeta)}>
        <span>{new Date(note.updated_at).toLocaleDateString()}</span>
        {note.is_private && <span className={commonStyles.privateBadge}>🔒 Private</span>}
      </div>
    </div>
  );
}
