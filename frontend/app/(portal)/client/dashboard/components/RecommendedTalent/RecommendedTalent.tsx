// @AI-HINT: Widget displaying AI-recommended freelancers based on client's project history.
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Card from '@/app/components/Card/Card';
import { Sparkles, ChevronRight } from 'lucide-react';
import Button from '@/app/components/Button/Button';

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

const MOCK_TALENT: Talent[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    title: 'Senior React Developer',
    avatar: 'https://i.pravatar.cc/150?u=sarah',
    matchScore: 98,
    skills: ['React', 'Next.js', 'TypeScript']
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    title: 'UI/UX Designer',
    avatar: 'https://i.pravatar.cc/150?u=marcus',
    matchScore: 95,
    skills: ['Figma', 'Design Systems']
  },
  {
    id: '3',
    name: 'Elena Rodriguez',
    title: 'Full Stack Engineer',
    avatar: 'https://i.pravatar.cc/150?u=elena',
    matchScore: 92,
    skills: ['Node.js', 'Python', 'AWS']
  }
];

const RecommendedTalent: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  return (
    <Card 
      title="AI Recommended Talent" 
      icon={Sparkles}
      className={common.widget}
    >
      <div className={common.list}>
        {MOCK_TALENT.map((talent) => (
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
                {talent.skills.map(skill => (
                  <span key={skill} className={cn(common.skill, themed.skill)}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className={common.action}>
              <ChevronRight size={20} className="text-gray-400" />
            </div>
          </Link>
        ))}
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
