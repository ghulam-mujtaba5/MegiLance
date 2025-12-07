// @AI-HINT: Widget displaying AI-recommended freelancers based on client's project history.
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Card from '@/app/components/Card/Card';
import { Sparkles, ChevronRight } from 'lucide-react';
import Button from '@/app/components/Button/Button';
import { matchingApi } from '@/lib/api';
import Skeleton from '@/app/components/Animations/Skeleton/Skeleton';

import common from './RecommendedTalent.common.module.css';
import light from './RecommendedTalent.light.module.css';
import dark from './RecommendedTalent.dark.module.css';

interface Talent {
  id: string;
  name: string;
  title: string;
  avatar: string;
  matchScore: number;
  skills: string[];
}

const RecommendedTalent: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<string>('');

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await matchingApi.getRecommendations();
        if (response && response.recommendations) {
          const mappedTalents = response.recommendations.map((rec: any) => ({
            id: String(rec.freelancer_id),
            name: rec.freelancer_name,
            title: rec.freelancer_bio ? rec.freelancer_bio.substring(0, 30) + '...' : 'Freelancer',
            avatar: rec.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(rec.freelancer_name)}&background=random`,
            matchScore: Math.round(rec.match_score * 100),
            skills: rec.match_factors?.skill_match ? ['High Skill Match'] : ['Top Rated'] // Simplified for now
          }));
          setTalents(mappedTalents);
          setContext(response.context || '');
        }
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  return (
    <Card 
      title="AI Recommended Talent" 
      icon={Sparkles}
      className={common.widget}
    >
      {context && (
        <div className="mb-3 text-xs text-gray-500 dark:text-gray-400 italic">
          {context}
        </div>
      )}
      
      <div className={common.list}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cn(common.card, themed.card)}>
              <Skeleton width={48} height={48} className="rounded-full" />
              <div className="flex-1 ml-3">
                <Skeleton width="60%" height={16} className="mb-2" />
                <Skeleton width="40%" height={12} />
              </div>
            </div>
          ))
        ) : talents.length > 0 ? (
          talents.map((talent) => (
            <Link 
              key={talent.id} 
              href={`/freelancers/${talent.id}`}
              className={cn(common.card, themed.card)}
            >
              <div className={common.avatarWrapper}>
                <Image 
                  src={talent.avatar} 
                  alt={talent.name} 
                  width={48} 
                  height={48} 
                  className={common.avatar}
                />
                <div className={cn(common.matchBadge, themed.matchBadge)}>
                  {talent.matchScore}%
                </div>
              </div>
              
              <div className={common.info}>
                <h4 className={cn(common.name, themed.name)}>{talent.name}</h4>
                <p className={cn(common.title, themed.title)}>{talent.title}</p>
                <div className={common.skills}>
                  {talent.skills.map((skill, idx) => (
                    <span key={idx} className={cn(common.skill, themed.skill)}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className={common.action}>
                <ChevronRight size={20} className="text-gray-400" />
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">
            No recommendations available yet.
          </div>
        )}
      </div>
      <div className="mt-4 flex justify-end">
        <Link href="/freelancers">
          <Button variant="ghost" size="sm">View All</Button>
        </Link>
      </div>
    </Card>
  );
};

export default RecommendedTalent;
