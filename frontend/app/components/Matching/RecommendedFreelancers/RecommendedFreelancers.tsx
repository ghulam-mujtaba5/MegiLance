// @AI-HINT: Component to display recommended freelancers using the Matching Engine
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import commonStyles from './RecommendedFreelancers.common.module.css';
import lightStyles from './RecommendedFreelancers.light.module.css';
import darkStyles from './RecommendedFreelancers.dark.module.css';

interface RecommendedFreelancersProps {
  projectId: string;
  limit?: number;
}

interface FreelancerMatch {
  id: string;
  name: string;
  title: string;
  avatar_url?: string;
  hourly_rate: number;
  skills: string[];
  match_score: number;
  match_reasons: string[];
}

export default function RecommendedFreelancers({ projectId, limit = 3 }: RecommendedFreelancersProps) {
  const { resolvedTheme } = useTheme();
  const [freelancers, setFreelancers] = useState<FreelancerMatch[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFreelancers = async () => {
      if (!projectId) return;
      
      setLoading(true);
      try {
        // Try to fetch from API
        const response = await api.matching.findFreelancers({ 
            project_id: projectId, 
            limit 
        });
        
        if (response && response.matches && response.matches.length > 0) {
             setFreelancers(response.matches);
        } else {
            // Fallback to mock data for demo purposes
             setFreelancers([
                {
                    id: '1',
                    name: 'Sarah Jenkins',
                    title: 'Senior React Developer',
                    hourly_rate: 85,
                    skills: ['React', 'TypeScript', 'Node.js'],
                    match_score: 0.96,
                    match_reasons: ['Strong React experience', 'Within budget range']
                },
                {
                    id: '2',
                    name: 'Michael Chen',
                    title: 'Full Stack Engineer',
                    hourly_rate: 95,
                    skills: ['Vue.js', 'Python', 'AWS'],
                    match_score: 0.89,
                    match_reasons: ['Backend expertise', 'High success rate']
                },
                {
                    id: '3',
                    name: 'Jessica Wu',
                    title: 'UI/UX Developer',
                    hourly_rate: 75,
                    skills: ['Figma', 'CSS', 'React'],
                    match_score: 0.84,
                    match_reasons: ['Design skills match', 'Available immediately']
                }
            ]);
        }
       
      } catch (error) {
        console.error('Failed to fetch recommended freelancers:', error);
         // Fallback to mock data on error
         setFreelancers([
            {
                id: '1',
                name: 'Sarah Jenkins',
                title: 'Senior React Developer',
                hourly_rate: 85,
                skills: ['React', 'TypeScript', 'Node.js'],
                match_score: 0.96,
                match_reasons: ['Strong React experience', 'Within budget range']
            },
            {
                id: '2',
                name: 'Michael Chen',
                title: 'Full Stack Engineer',
                hourly_rate: 95,
                skills: ['Vue.js', 'Python', 'AWS'],
                match_score: 0.89,
                match_reasons: ['Backend expertise', 'High success rate']
            },
            {
                id: '3',
                name: 'Jessica Wu',
                title: 'UI/UX Developer',
                hourly_rate: 75,
                skills: ['Figma', 'CSS', 'React'],
                match_score: 0.84,
                match_reasons: ['Design skills match', 'Available immediately']
            }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchFreelancers();
  }, [projectId, limit]);

  if (!resolvedTheme) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (loading) {
    return <div className={cn(commonStyles.container, themeStyles.title)}>Finding best matches...</div>;
  }

  if (freelancers.length === 0) return null;

  return (
    <div className={cn(commonStyles.container)}>
      <h3 className={cn(commonStyles.title, themeStyles.title)}>Recommended Freelancers</h3>
      <div className={cn(commonStyles.grid)}>
        {freelancers.map((freelancer) => (
          <div key={freelancer.id} className={cn(commonStyles.card, themeStyles.card)}>
            <div className={cn(commonStyles.header)}>
                <div className={cn(commonStyles.userInfo)}>
                    <div className={cn(commonStyles.avatar)} style={{backgroundColor: '#ccc'}}></div> {/* Placeholder for avatar */}
                    <div>
                        <div className={cn(commonStyles.name, themeStyles.name)}>{freelancer.name}</div>
                        <div className={cn(commonStyles.titleRole, themeStyles.titleRole)}>{freelancer.title}</div>
                    </div>
                </div>
              <div className={cn(commonStyles.matchScore, themeStyles.matchScore)}>
                {Math.round(freelancer.match_score * 100)}% Match
              </div>
            </div>
            
            <div className={cn(commonStyles.stats, themeStyles.stats)}>
                <span>${freelancer.hourly_rate}/hr</span>
            </div>

            <div className={cn(commonStyles.skills)}>
              {freelancer.skills.map((skill) => (
                <span key={skill} className={cn(commonStyles.skill, themeStyles.skill)}>
                  {skill}
                </span>
              ))}
            </div>
            
            {freelancer.match_reasons && freelancer.match_reasons.length > 0 && (
                <div className={cn(commonStyles.reasons, themeStyles.reasons)}>
                    Why: {freelancer.match_reasons.join(', ')}
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}