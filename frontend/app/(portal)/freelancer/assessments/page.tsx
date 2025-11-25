// @AI-HINT: Assessments page for freelancers to take skill assessments and earn badges.
'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Award, Clock, CheckCircle, Star, Lock, Play, Trophy, Target } from 'lucide-react';
import Button from '@/app/components/Button/Button';
import Card from '@/app/components/Card/Card';

// Mock assessments data
const mockAssessments = [
  {
    id: '1',
    title: 'JavaScript Fundamentals',
    description: 'Test your knowledge of JavaScript basics, ES6+, and modern patterns.',
    duration: '45 min',
    questions: 30,
    difficulty: 'Intermediate',
    category: 'Programming',
    completed: true,
    score: 92,
    badge: 'JavaScript Expert',
  },
  {
    id: '2',
    title: 'React Development',
    description: 'Assess your React skills including hooks, state management, and best practices.',
    duration: '60 min',
    questions: 40,
    difficulty: 'Advanced',
    category: 'Frontend',
    completed: true,
    score: 88,
    badge: 'React Developer',
  },
  {
    id: '3',
    title: 'TypeScript Proficiency',
    description: 'Evaluate your TypeScript knowledge from basics to advanced types.',
    duration: '30 min',
    questions: 25,
    difficulty: 'Intermediate',
    category: 'Programming',
    completed: false,
    score: null,
    badge: null,
  },
  {
    id: '4',
    title: 'Node.js Backend',
    description: 'Test your backend development skills with Node.js and Express.',
    duration: '50 min',
    questions: 35,
    difficulty: 'Advanced',
    category: 'Backend',
    completed: false,
    score: null,
    badge: null,
  },
  {
    id: '5',
    title: 'UI/UX Design Principles',
    description: 'Assess your understanding of user interface and experience design.',
    duration: '40 min',
    questions: 30,
    difficulty: 'Beginner',
    category: 'Design',
    completed: false,
    score: null,
    badge: null,
    locked: true,
  },
];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Beginner':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    case 'Intermediate':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
    case 'Advanced':
      return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
  }
};

const AssessmentsPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [assessments] = useState(mockAssessments);
  
  const completedCount = assessments.filter(a => a.completed).length;
  const totalScore = assessments.filter(a => a.completed).reduce((sum, a) => sum + (a.score || 0), 0);
  const avgScore = completedCount > 0 ? Math.round(totalScore / completedCount) : 0;

  return (
    <main className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Skill Assessments</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Take assessments to validate your skills and earn badges that boost your profile visibility.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold">{completedCount}/{assessments.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Trophy className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Score</p>
              <p className="text-2xl font-bold">{avgScore}%</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Badges Earned</p>
              <p className="text-2xl font-bold">{completedCount}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Star className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Profile Boost</p>
              <p className="text-2xl font-bold">+{completedCount * 5}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Assessments List */}
      <div className="space-y-4">
        {assessments.map((assessment) => (
          <Card key={assessment.id}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{assessment.title}</h3>
                  {assessment.completed && (
                    <span className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
                      <CheckCircle className="h-3 w-3" />
                      Completed
                    </span>
                  )}
                  {assessment.locked && (
                    <span className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                      <Lock className="h-3 w-3" />
                      Locked
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {assessment.description}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {assessment.duration}
                  </span>
                  <span>{assessment.questions} questions</span>
                  <span className={cn('px-2 py-0.5 rounded-full text-xs', getDifficultyColor(assessment.difficulty))}>
                    {assessment.difficulty}
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">
                    {assessment.category}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                {assessment.completed ? (
                  <>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Score</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{assessment.score}%</p>
                    </div>
                    {assessment.badge && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-full text-sm">
                        <Award className="h-4 w-4" />
                        {assessment.badge}
                      </div>
                    )}
                    <Button variant="outline" size="sm">
                      Retake
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="primary" 
                    size="md" 
                    iconBefore={assessment.locked ? <Lock size={18} /> : <Play size={18} />}
                    disabled={assessment.locked}
                  >
                    {assessment.locked ? 'Unlock' : 'Start Assessment'}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
};

export default AssessmentsPage;
