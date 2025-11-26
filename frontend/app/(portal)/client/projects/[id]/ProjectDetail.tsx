// @AI-HINT: Client Project Detail page. Theme-aware, accessible, animated detail layout with sections and actions.
'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import api from '@/lib/api';
import Skeleton from '@/app/components/Animations/Skeleton/Skeleton';
import common from './ProjectDetail.common.module.css';
import light from './ProjectDetail.light.module.css';
import dark from './ProjectDetail.dark.module.css';

const ProjectDetail: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const params = useParams<{ id: string }>();
  const rawId = params?.id ?? '';
  
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      if (!rawId) return;
      try {
        // Handle PROJ-001 format or just 1
        const idStr = rawId.replace(/^PROJ-0*/, '');
        const id = parseInt(idStr, 10);
        if (isNaN(id)) throw new Error('Invalid Project ID');

        const data = await api.projects.get(id);
        setProject(data);
      } catch (e) {
        console.error(e);
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [rawId]);

  const headerRef = useRef<HTMLDivElement | null>(null);
  const descRef = useRef<HTMLDivElement | null>(null);
  const reqRef = useRef<HTMLDivElement | null>(null);
  const actRef = useRef<HTMLDivElement | null>(null);

  const headerVisible = useIntersectionObserver(headerRef, { threshold: 0.1 });
  const descVisible = useIntersectionObserver(descRef, { threshold: 0.1 });
  const reqVisible = useIntersectionObserver(reqRef, { threshold: 0.1 });
  const actVisible = useIntersectionObserver(actRef, { threshold: 0.1 });

  const requirements = useMemo(() => {
      if (!project?.skills) return [];
      if (Array.isArray(project.skills)) return project.skills;
      try {
          return JSON.parse(project.skills);
      } catch {
          return [project.skills];
      }
  }, [project?.skills]);

  if (loading) {
    return (
      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
           <Skeleton height={100} width='100%' />
           <div style={{ marginTop: '2rem' }}>
             <Skeleton height={200} width='100%' />
           </div>
        </div>
      </main>
    );
  }

  if (error || !project) {
    return (
      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
           <div className={common.error}>{error || 'Project not found'}</div>
           <Link href='/client/projects' className={cn(common.button, 'secondary', themed.button)}>Back to Projects</Link>
        </div>
      </main>
    );
  }

  const budgetDisplay = project.budget_max 
    ? `$${project.budget_max}` 
    : (project.budget_min ? `$${project.budget_min}+` : 'Not set');

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <header ref={headerRef} className={cn(common.header, headerVisible ? common.isVisible : common.isNotVisible)}>
          <div>
            <h1 className={common.title}>{project.title}</h1>
            <p className={cn(common.subtitle, themed.subtitle)}>Project ID: {rawId}</p>
            <div className={cn(common.meta, themed.meta)}>
              <span className={cn(common.badge, themed.badge)}>{project.status || 'Open'}</span>
              <span>•</span>
              <span>{budgetDisplay}</span>
              <span>•</span>
              <span>Updated {new Date(project.updated_at || project.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div className={common.actions}>
            <Link href='/client/projects' className={cn(common.button, 'secondary', themed.button)}>Back to Projects</Link>
            {/* Only show Create Milestone if active */}
            {project.status === 'in_progress' && (
                <button type='button' className={cn(common.button, 'primary', themed.button)}>Create Milestone</button>
            )}
          </div>
        </header>

        <section ref={descRef} className={cn(common.section, themed.section, descVisible ? common.isVisible : common.isNotVisible)} aria-labelledby='desc-title'>
          <h2 id='desc-title' className={cn(common.sectionTitle, themed.sectionTitle)}>Description</h2>
          <p>{project.description}</p>
        </section>

        {requirements.length > 0 && (
            <section ref={reqRef} className={cn(common.section, themed.section, reqVisible ? common.isVisible : common.isNotVisible)} aria-labelledby='req-title'>
            <h2 id='req-title' className={cn(common.sectionTitle, themed.sectionTitle)}>Skills / Requirements</h2>
            <ul className={common.list} role='list'>
                {requirements.map((r: string, i: number) => (
                <li key={i} role='listitem' className={cn(common.item, themed.item)}>{r}</li>
                ))}
            </ul>
            </section>
        )}

        {/* Activity section placeholder - could be populated with milestones later */}
        <section ref={actRef} className={cn(common.section, themed.section, actVisible ? common.isVisible : common.isNotVisible)} aria-labelledby='activity-title'>
          <h2 id='activity-title' className={cn(common.sectionTitle, themed.sectionTitle)}>Recent Activity</h2>
          <div className={common.list} role='list'>
             <div className={cn(common.item, themed.item)}>
                <div>{new Date(project.created_at).toLocaleString()}</div>
                <div>Project created</div>
             </div>
             {project.updated_at !== project.created_at && (
                 <div className={cn(common.item, themed.item)}>
                    <div>{new Date(project.updated_at).toLocaleString()}</div>
                    <div>Project updated</div>
                 </div>
             )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default ProjectDetail;
