// @AI-HINT: This file contains mock data for the Projects page, conforming to the ProjectType interface.
// Externalizing mock data is crucial for testing, development, and eventual API integration.

import { ProjectType } from './types';

export const mockProjects: ProjectType[] = [
  {
    id: 'proj_001',
    name: 'E-commerce Platform Redesign',
    client: 'Global Retail Inc.',
    budget: 25000,
    status: 'active',
    deadline: '2024-09-15T23:59:59Z',
    progress: 75,
  },
  {
    id: 'proj_002',
    name: 'Mobile App Development for FinTech',
    client: 'Startup Hub Ventures',
    budget: 45000,
    status: 'completed',
    deadline: '2024-07-20T23:59:59Z',
    progress: 100,
  },
  {
    id: 'proj_003',
    name: 'Corporate Branding & Marketing Website',
    client: 'Creative Solutions Agency',
    budget: 18000,
    status: 'pending',
    deadline: '2024-08-30T23:59:59Z',
    progress: 10,
  },
  {
    id: 'proj_004',
    name: 'Data Analytics & Visualization Dashboard',
    client: 'Tech Solutions LLC',
    budget: 32000,
    status: 'active',
    deadline: '2024-10-01T23:59:59Z',
    progress: 40,
  },
  {
    id: 'proj_005',
    name: 'AI-Powered Chatbot Integration',
    client: 'Innovate AI Corp.',
    budget: 55000,
    status: 'on_hold',
    deadline: '2024-11-01T23:59:59Z',
    progress: 25,
  },
    {
    id: 'proj_006',
    name: 'Cloud Migration & Infrastructure Setup',
    client: 'Secure Cloud Services',
    budget: 75000,
    status: 'cancelled',
    deadline: '2024-06-30T23:59:59Z',
    progress: 90,
  },
];
