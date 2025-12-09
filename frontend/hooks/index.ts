// @AI-HINT: Central exports for all custom hooks
// Import hooks from this file for cleaner imports

export { useAuth, type User } from './useAuth';
export { useProjects, type Project, type CreateProjectData, type ProjectFilters } from './useProjects';
export { useProposals, type Proposal, type CreateProposalData } from './useProposals';
export { useClientData, type ClientProject, type ClientPayment, type ClientFreelancer, type ClientReview } from './useClient';
export { useFreelancerData, type FreelancerProject, type FreelancerJob, type FreelancerTransaction, type FreelancerAnalytics } from './useFreelancer';
export { useDashboardData } from './useDashboardData';
export { useAdmin } from './useAdmin';
export { useUser } from './useUser';
export { useWebSocket } from './useWebSocket';
export { useAnimatedCounter } from './useAnimatedCounter';
export { useIntersectionObserver } from './useIntersectionObserver';
