// @AI-HINT: Portfolio page for freelancers to showcase their work and projects.
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Plus, FolderOpen, ExternalLink, Edit, Trash2, Eye, Calendar, Tag } from 'lucide-react';
import Button from '@/app/components/Button/Button';
import Card from '@/app/components/Card/Card';

// Mock portfolio items
const mockPortfolioItems = [
  {
    id: '1',
    title: 'E-Commerce Platform Redesign',
    description: 'Complete redesign of a major e-commerce platform with focus on UX and conversion optimization.',
    imageUrl: '/api/placeholder/400/300',
    tags: ['UI/UX', 'React', 'TypeScript'],
    completedDate: '2024-10-15',
    clientName: 'TechCorp Inc.',
    projectUrl: 'https://example.com/project1',
  },
  {
    id: '2',
    title: 'Mobile Banking App',
    description: 'Developed a secure mobile banking application with biometric authentication and real-time transactions.',
    imageUrl: '/api/placeholder/400/300',
    tags: ['React Native', 'Node.js', 'Security'],
    completedDate: '2024-09-20',
    clientName: 'FinanceFirst Bank',
    projectUrl: 'https://example.com/project2',
  },
  {
    id: '3',
    title: 'AI-Powered Analytics Dashboard',
    description: 'Built an analytics dashboard with AI-driven insights and predictive modeling capabilities.',
    imageUrl: '/api/placeholder/400/300',
    tags: ['Python', 'Machine Learning', 'D3.js'],
    completedDate: '2024-08-10',
    clientName: 'DataDriven Co.',
    projectUrl: 'https://example.com/project3',
  },
];

const PortfolioPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [portfolioItems] = useState(mockPortfolioItems);

  return (
    <main className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Portfolio</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Showcase your best work to attract clients and land more projects.
          </p>
        </div>
        <Link href="/freelancer/portfolio/add">
          <Button variant="primary" size="md" iconBefore={<Plus size={18} />}>
            Add Portfolio Item
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FolderOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Projects</p>
              <p className="text-2xl font-bold">{portfolioItems.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Eye className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Profile Views</p>
              <p className="text-2xl font-bold">1,245</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Tag className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Unique Skills</p>
              <p className="text-2xl font-bold">12</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Portfolio Grid */}
      {portfolioItems.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FolderOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Portfolio Items Yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Start building your portfolio by adding your best projects and work samples.
            </p>
            <Link href="/freelancer/portfolio/add">
              <Button variant="primary" iconBefore={<Plus size={18} />}>
                Add Your First Project
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolioItems.map((item) => (
            <Card key={item.id}>
              <div className="relative">
                {/* Placeholder image */}
                <div className="h-48 bg-linear-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-t-lg flex items-center justify-center">
                  <FolderOpen className="h-12 w-12 text-gray-400" />
                </div>
                
                {/* Actions */}
                <div className="absolute top-2 right-2 flex gap-2">
                  <button 
                    className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:shadow-lg transition-shadow"
                    aria-label="Edit"
                  >
                    <Edit className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </button>
                  <button 
                    className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:shadow-lg transition-shadow"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {item.description}
                </p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {item.tags.map((tag) => (
                    <span 
                      key={tag}
                      className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                {/* Meta */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(item.completedDate).toLocaleDateString()}</span>
                  </div>
                  {item.projectUrl && (
                    <a 
                      href={item.projectUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
};

export default PortfolioPage;
