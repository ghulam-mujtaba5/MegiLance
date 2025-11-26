// @AI-HINT: File Versions Page - View and manage file version history
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import commonStyles from './FileVersions.common.module.css';
import lightStyles from './FileVersions.light.module.css';
import darkStyles from './FileVersions.dark.module.css';

interface FileVersion {
  id: string;
  versionNumber: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
  changeNote?: string;
  downloadUrl: string;
  isCurrent: boolean;
}

interface FileInfo {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  totalVersions: number;
  currentVersion: number;
  createdAt: string;
}

export default function FileVersionsPage() {
  const { resolvedTheme } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [versions, setVersions] = useState<FileVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);

  const fileId = searchParams.get('fileId');

  useEffect(() => {
    setMounted(true);
    if (fileId) {
      fetchFileVersions(fileId);
    }
  }, [fileId]);

  const fetchFileVersions = async (id: string) => {
    setLoading(true);
    try {
      const mockFileInfo: FileInfo = {
        id: id,
        name: 'project-design-v3.fig',
        projectId: 'proj_001',
        projectName: 'E-commerce Website Design',
        totalVersions: 5,
        currentVersion: 5,
        createdAt: '2025-01-05'
      };

      const mockVersions: FileVersion[] = [
        { id: 'v5', versionNumber: 5, fileName: 'project-design-v3.fig', fileSize: 4520000, mimeType: 'application/octet-stream', uploadedBy: 'You', uploadedAt: '2025-01-25T14:30:00Z', changeNote: 'Final design with client feedback incorporated', downloadUrl: '#', isCurrent: true },
        { id: 'v4', versionNumber: 4, fileName: 'project-design-v3.fig', fileSize: 4380000, mimeType: 'application/octet-stream', uploadedBy: 'You', uploadedAt: '2025-01-23T10:15:00Z', changeNote: 'Updated color scheme and typography', downloadUrl: '#', isCurrent: false },
        { id: 'v3', versionNumber: 3, fileName: 'project-design-v2.fig', fileSize: 4150000, mimeType: 'application/octet-stream', uploadedBy: 'You', uploadedAt: '2025-01-20T16:45:00Z', changeNote: 'Added checkout flow screens', downloadUrl: '#', isCurrent: false },
        { id: 'v2', versionNumber: 2, fileName: 'project-design-v1.fig', fileSize: 3200000, mimeType: 'application/octet-stream', uploadedBy: 'You', uploadedAt: '2025-01-15T09:00:00Z', changeNote: 'Product listing and detail pages', downloadUrl: '#', isCurrent: false },
        { id: 'v1', versionNumber: 1, fileName: 'project-design-initial.fig', fileSize: 1800000, mimeType: 'application/octet-stream', uploadedBy: 'You', uploadedAt: '2025-01-05T11:30:00Z', changeNote: 'Initial design draft', downloadUrl: '#', isCurrent: false }
      ];

      setFileInfo(mockFileInfo);
      setVersions(mockVersions);
    } catch (error) {
      console.error('Failed to fetch file versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleVersionSelect = (versionId: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      }
      if (prev.length >= 2) {
        return [prev[1], versionId];
      }
      return [...prev, versionId];
    });
  };

  const handleRestore = async (versionId: string) => {
    // API call would go here
    alert(`Version ${versionId} restored as current version`);
    fetchFileVersions(fileId!);
  };

  const handleCompare = () => {
    if (selectedVersions.length === 2) {
      setComparing(true);
      // Would open comparison view
    }
  };

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (!fileId) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
          <div className={commonStyles.emptyIcon}>📁</div>
          <h2>Select a File</h2>
          <p>Choose a file from your projects to view its version history</p>
          <button 
            className={cn(commonStyles.browseButton, themeStyles.browseButton)}
            onClick={() => router.push('/freelancer/files')}
          >
            Browse Files
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <button 
          className={cn(commonStyles.backButton, themeStyles.backButton)}
          onClick={() => router.back()}
        >
          ← Back to Files
        </button>
      </div>

      {loading ? (
        <div className={cn(commonStyles.loading, themeStyles.loading)}>Loading version history...</div>
      ) : fileInfo && (
        <>
          {/* File Info Card */}
          <div className={cn(commonStyles.fileInfoCard, themeStyles.fileInfoCard)}>
            <div className={commonStyles.fileIcon}>📄</div>
            <div className={commonStyles.fileDetails}>
              <h1 className={cn(commonStyles.fileName, themeStyles.fileName)}>{fileInfo.name}</h1>
              <p className={cn(commonStyles.projectName, themeStyles.projectName)}>
                {fileInfo.projectName}
              </p>
              <div className={cn(commonStyles.fileMeta, themeStyles.fileMeta)}>
                <span>{fileInfo.totalVersions} versions</span>
                <span>•</span>
                <span>Created {new Date(fileInfo.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Compare Bar */}
          {selectedVersions.length > 0 && (
            <div className={cn(commonStyles.compareBar, themeStyles.compareBar)}>
              <span>{selectedVersions.length} version(s) selected</span>
              <div className={commonStyles.compareActions}>
                <button 
                  className={cn(commonStyles.clearButton, themeStyles.clearButton)}
                  onClick={() => setSelectedVersions([])}
                >
                  Clear
                </button>
                <button 
                  className={cn(commonStyles.compareButton, themeStyles.compareButton)}
                  onClick={handleCompare}
                  disabled={selectedVersions.length !== 2}
                >
                  Compare Versions
                </button>
              </div>
            </div>
          )}

          {/* Version Timeline */}
          <div className={commonStyles.versionsList}>
            {versions.map((version, index) => (
              <div 
                key={version.id} 
                className={cn(
                  commonStyles.versionCard,
                  themeStyles.versionCard,
                  version.isCurrent && commonStyles.currentVersion,
                  selectedVersions.includes(version.id) && commonStyles.selectedVersion
                )}
              >
                <div className={commonStyles.versionTimeline}>
                  <div className={cn(commonStyles.versionDot, themeStyles.versionDot, version.isCurrent && commonStyles.dotCurrent)}></div>
                  {index < versions.length - 1 && <div className={cn(commonStyles.versionLine, themeStyles.versionLine)}></div>}
                </div>
                <div className={commonStyles.versionContent}>
                  <div className={commonStyles.versionHeader}>
                    <div className={commonStyles.versionInfo}>
                      <span className={cn(commonStyles.versionNumber, themeStyles.versionNumber)}>
                        Version {version.versionNumber}
                        {version.isCurrent && <span className={commonStyles.currentBadge}>Current</span>}
                      </span>
                      <span className={cn(commonStyles.versionDate, themeStyles.versionDate)}>
                        {new Date(version.uploadedAt).toLocaleString()}
                      </span>
                    </div>
                    <label className={commonStyles.checkbox}>
                      <input 
                        type="checkbox" 
                        checked={selectedVersions.includes(version.id)}
                        onChange={() => handleVersionSelect(version.id)}
                      />
                      <span className={cn(commonStyles.checkmark, themeStyles.checkmark)}></span>
                    </label>
                  </div>
                  {version.changeNote && (
                    <p className={cn(commonStyles.changeNote, themeStyles.changeNote)}>
                      {version.changeNote}
                    </p>
                  )}
                  <div className={cn(commonStyles.versionMeta, themeStyles.versionMeta)}>
                    <span>By {version.uploadedBy}</span>
                    <span>•</span>
                    <span>{formatFileSize(version.fileSize)}</span>
                  </div>
                  <div className={commonStyles.versionActions}>
                    <button className={cn(commonStyles.downloadButton, themeStyles.downloadButton)}>
                      Download
                    </button>
                    {!version.isCurrent && (
                      <button 
                        className={cn(commonStyles.restoreButton, themeStyles.restoreButton)}
                        onClick={() => handleRestore(version.id)}
                      >
                        Restore
                      </button>
                    )}
                    <button className={cn(commonStyles.previewButton, themeStyles.previewButton)}>
                      Preview
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
