// @AI-HINT: Project details page with proposal submission
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import Button from '@/app/components/Button/Button';
import ProposalBuilder from '@/app/components/Proposal/ProposalBuilder/ProposalBuilder';
import { FaClock, FaMoneyBillWave, FaTag, FaUser, FaCheckCircle } from 'react-icons/fa';
import SimilarJobs from '@/app/components/Matching/SimilarJobs/SimilarJobs';
import RecommendedFreelancers from '@/app/components/Matching/RecommendedFreelancers/RecommendedFreelancers';

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showProposalBuilder, setShowProposalBuilder] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [projectData, userData] = await Promise.all([
        api.projects.get(id as string),
        api.auth.me()
      ]);
      setProject(projectData);
      setUser(userData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!project) {
    return <div className="text-center py-20">Project not found</div>;
  }

  const isFreelancer = user?.role === 'freelancer';
  const isDark = resolvedTheme === 'dark';

  if (showProposalBuilder) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => setShowProposalBuilder(false)}
          className="mb-4"
        >
          ← Back to Project Details
        </Button>
        <ProposalBuilder
          projectId={parseInt(id as string)}
          projectTitle={project.title}
          projectDescription={project.description}
          projectBudget={{ 
            min: project.budget_min || 0, 
            max: project.budget_max || 0 
          }}
          onSubmit={() => {
            // Redirect or show success
            router.push('/dashboard/proposals');
          }}
        />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className={cn(
        'min-h-screen py-8 px-4 md:px-8',
        isDark ? 'bg-[#0a0a0c] text-white' : 'bg-gray-50 text-gray-900'
      )}>
        <div className="max-w-4xl mx-auto">
          <div className={cn(
            'rounded-xl p-8 mb-8',
            isDark ? 'bg-white/5 border border-white/10' : 'bg-white shadow-sm border border-gray-200'
          )}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
                <div className="flex items-center gap-4 text-sm opacity-70">
                  <span className="flex items-center gap-1">
                    <FaClock /> Posted {new Date(project.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <FaTag /> {project.category}
                  </span>
                </div>
              </div>
              {isFreelancer && (
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={() => setShowProposalBuilder(true)}
                >
                  Submit Proposal
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className={cn(
                'p-4 rounded-lg',
                isDark ? 'bg-white/5' : 'bg-gray-50'
              )}>
                <div className="text-sm opacity-70 mb-1">Budget</div>
                <div className="font-bold text-lg flex items-center gap-2">
                  <FaMoneyBillWave className="text-green-500" />
                  {project.budget_type === 'hourly' ? (
                    <span>${project.budget_min} - ${project.budget_max}/hr</span>
                  ) : (
                    <span>${project.budget_min} - ${project.budget_max}</span>
                  )}
                </div>
              </div>
              
              <div className={cn(
                'p-4 rounded-lg',
                isDark ? 'bg-white/5' : 'bg-gray-50'
              )}>
                <div className="text-sm opacity-70 mb-1">Experience Level</div>
                <div className="font-bold text-lg flex items-center gap-2">
                  <FaUser className="text-blue-500" />
                  {project.experience_level}
                </div>
              </div>

              <div className={cn(
                'p-4 rounded-lg',
                isDark ? 'bg-white/5' : 'bg-gray-50'
              )}>
                <div className="text-sm opacity-70 mb-1">Status</div>
                <div className="font-bold text-lg flex items-center gap-2">
                  <FaCheckCircle className="text-purple-500" />
                  {project.status}
                </div>
              </div>
            </div>

            <div className="prose dark:prose-invert max-w-none mb-8">
              <h3 className="text-xl font-bold mb-4">Description</h3>
              <div className="whitespace-pre-wrap">{project.description}</div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {project.skills?.map((skill: string) => (
                  <span 
                    key={skill}
                    className={cn(
                      'px-3 py-1 rounded-full text-sm',
                      isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-800'
                    )}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* AI Matching Section */}
          {user?.role === 'client' && (
             <RecommendedFreelancers projectId={id as string} />
          )}

          {user?.role === 'freelancer' && (
             <SimilarJobs projectId={id as string} />
          )}
        </div>
      </div>
    </PageTransition>
  );
}
