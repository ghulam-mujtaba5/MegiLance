// @AI-HINT: This file defines the centralized TypeScript types for the Projects feature.
// Using centralized types ensures consistency across all related components and mock data.

export type ProjectStatus = 'active' | 'completed' | 'pending' | 'on_hold' | 'cancelled';

export interface ProjectType {
  id: string;
  name: string;
  client: string;
  budget: number;
  status: ProjectStatus;
  deadline?: string; // ISO date string
  progress?: number; // Percentage 0-100
}
