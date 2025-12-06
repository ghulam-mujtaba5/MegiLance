// @AI-HINT: File version history management with diff viewing and restore capabilities
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { fileVersionsApi } from '@/lib/api';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import commonStyles from './FileVersions.common.module.css';
import lightStyles from './FileVersions.light.module.css';
import darkStyles from './FileVersions.dark.module.css';

interface FileVersion {
  id: string;
  file_id: string;
  file_name: string;
  version_number: number;
  size_bytes: number;
  mime_type: string;
  uploaded_by: {
    id: string;
    name: string;
    avatar?: string;
  };
  changes_description?: string;
  created_at: string;
  is_current: boolean;
  download_url: string;
}

interface FileWithVersions {
  id: string;
  name: string;
  path: string;
  project_name: string;
  current_version: number;
  total_versions: number;
  last_modified: string;
  versions: FileVersion[];
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getFileIcon = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📑';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return '📦';
  if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('json')) return '💻';
  return '📁';
};

const getRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export default function FileVersionsPage() {
  const { resolvedTheme } = useTheme();
  const [files, setFiles] = useState<FileWithVersions[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileWithVersions | null>(null);
  const [comparingVersions, setComparingVersions] = useState<[string, string] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'modified' | 'versions'>('modified');

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await fileVersionsApi.list();
      setFiles(response.items || []);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFileVersions = async (fileId: string) => {
    try {
      const response = await fileVersionsApi.getVersions(fileId);
      const file = files.find(f => f.id === fileId);
      if (file) {
        setSelectedFile({ ...file, versions: response.versions || [] });
      }
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  };

  const restoreVersion = async (fileId: string, versionId: string) => {
    if (!confirm('Are you sure you want to restore this version? A new version will be created.')) return;

    try {
      await fileVersionsApi.restore(fileId, versionId);
      loadFiles();
      if (selectedFile) {
        loadFileVersions(selectedFile.id);
      }
    } catch (error) {
      console.error('Failed to restore version:', error);
    }
  };

  const downloadVersion = async (versionId: string, downloadUrl: string) => {
    try {
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Failed to download:', error);
    }
  };

  const deleteVersion = async (fileId: string, versionId: string) => {
    if (!confirm('Are you sure you want to delete this version? This cannot be undone.')) return;

    try {
      await fileVersionsApi.deleteVersion(fileId, versionId);
      if (selectedFile) {
        loadFileVersions(selectedFile.id);
      }
    } catch (error) {
      console.error('Failed to delete version:', error);
    }
  };

  if (!resolvedTheme) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const filteredFiles = files
    .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'versions':
          return b.total_versions - a.total_versions;
        case 'modified':
        default:
          return new Date(b.last_modified).getTime() - new Date(a.last_modified).getTime();
      }
    });

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>File Versions</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Track changes and manage file history across projects
              </p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className={commonStyles.controls}>
            <div className={cn(commonStyles.searchBox, themeStyles.searchBox)}>
              <span className={commonStyles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(commonStyles.searchInput, themeStyles.searchInput)}
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className={cn(commonStyles.sortSelect, themeStyles.sortSelect)}
            >
              <option value="modified">Recently Modified</option>
              <option value="name">Name A-Z</option>
              <option value="versions">Most Versions</option>
            </select>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className={cn(commonStyles.loading, themeStyles.loading)}>
            Loading files...
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
            <span className={commonStyles.emptyIcon}>📂</span>
            <h3 className={cn(commonStyles.emptyTitle, themeStyles.emptyTitle)}>No Files Found</h3>
            <p className={cn(commonStyles.emptyDesc, themeStyles.emptyDesc)}>
              {searchQuery ? 'Try a different search term' : 'Files with version history will appear here'}
            </p>
          </div>
        ) : (
          <StaggerContainer className={commonStyles.fileList}>
            {filteredFiles.map(file => (
              <StaggerItem key={file.id}>
                <div
                  className={cn(commonStyles.fileCard, themeStyles.fileCard)}
                  onClick={() => loadFileVersions(file.id)}
                >
                  <div className={commonStyles.fileIcon}>
                    {getFileIcon(file.versions?.[0]?.mime_type || 'application/octet-stream')}
                  </div>
                  <div className={commonStyles.fileInfo}>
                    <h3 className={cn(commonStyles.fileName, themeStyles.fileName)}>{file.name}</h3>
                    <div className={commonStyles.fileMeta}>
                      <span className={cn(commonStyles.projectName, themeStyles.projectName)}>
                        📁 {file.project_name}
                      </span>
                      <span className={cn(commonStyles.versionCount, themeStyles.versionCount)}>
                        v{file.current_version} • {file.total_versions} versions
                      </span>
                    </div>
                  </div>
                  <div className={commonStyles.fileModified}>
                    <span className={cn(commonStyles.modifiedTime, themeStyles.modifiedTime)}>
                      {getRelativeTime(file.last_modified)}
                    </span>
                  </div>
                  <span className={commonStyles.chevron}>›</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        {/* Version History Modal */}
        {selectedFile && (
          <div className={commonStyles.modalOverlay} onClick={() => setSelectedFile(null)}>
            <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={(e) => e.stopPropagation()}>
              <div className={cn(commonStyles.modalHeader, themeStyles.modalHeader)}>
                <div className={commonStyles.modalFileInfo}>
                  <span className={commonStyles.modalFileIcon}>
                    {getFileIcon(selectedFile.versions?.[0]?.mime_type || '')}
                  </span>
                  <div>
                    <h2 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>
                      {selectedFile.name}
                    </h2>
                    <p className={cn(commonStyles.modalSubtitle, themeStyles.modalSubtitle)}>
                      {selectedFile.total_versions} versions • {selectedFile.project_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className={cn(commonStyles.closeButton, themeStyles.closeButton)}
                >
                  ×
                </button>
              </div>

              <div className={commonStyles.modalContent}>
                <div className={commonStyles.versionTimeline}>
                  {selectedFile.versions?.map((version, index) => (
                    <div
                      key={version.id}
                      className={cn(
                        commonStyles.versionItem,
                        themeStyles.versionItem,
                        version.is_current && commonStyles.currentVersion,
                        version.is_current && themeStyles.currentVersion
                      )}
                    >
                      <div className={commonStyles.versionMarker}>
                        <div className={cn(commonStyles.versionDot, themeStyles.versionDot)} />
                        {index < selectedFile.versions.length - 1 && (
                          <div className={cn(commonStyles.versionLine, themeStyles.versionLine)} />
                        )}
                      </div>

                      <div className={commonStyles.versionContent}>
                        <div className={commonStyles.versionHeader}>
                          <span className={cn(commonStyles.versionNumber, themeStyles.versionNumber)}>
                            Version {version.version_number}
                            {version.is_current && (
                              <span className={cn(commonStyles.currentBadge, themeStyles.currentBadge)}>
                                Current
                              </span>
                            )}
                          </span>
                          <span className={cn(commonStyles.versionDate, themeStyles.versionDate)}>
                            {getRelativeTime(version.created_at)}
                          </span>
                        </div>

                        <div className={commonStyles.versionMeta}>
                          <div className={commonStyles.versionUploader}>
                            <span className={commonStyles.uploaderAvatar}>
                              {version.uploaded_by.avatar || version.uploaded_by.name.charAt(0)}
                            </span>
                            <span className={cn(commonStyles.uploaderName, themeStyles.uploaderName)}>
                              {version.uploaded_by.name}
                            </span>
                          </div>
                          <span className={cn(commonStyles.versionSize, themeStyles.versionSize)}>
                            {formatFileSize(version.size_bytes)}
                          </span>
                        </div>

                        {version.changes_description && (
                          <p className={cn(commonStyles.versionChanges, themeStyles.versionChanges)}>
                            {version.changes_description}
                          </p>
                        )}

                        <div className={commonStyles.versionActions}>
                          <button
                            onClick={() => downloadVersion(version.id, version.download_url)}
                            className={cn(commonStyles.actionBtn, themeStyles.downloadBtn)}
                          >
                            ⬇️ Download
                          </button>
                          {!version.is_current && (
                            <>
                              <button
                                onClick={() => restoreVersion(selectedFile.id, version.id)}
                                className={cn(commonStyles.actionBtn, themeStyles.restoreBtn)}
                              >
                                ↩️ Restore
                              </button>
                              <button
                                onClick={() => deleteVersion(selectedFile.id, version.id)}
                                className={cn(commonStyles.actionBtn, themeStyles.deleteBtn)}
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
