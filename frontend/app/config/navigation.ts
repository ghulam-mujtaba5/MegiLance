// @AI-HINT: Centralized navigation configuration for MegiLance application. Contains all navigation items for different user types and sections.
// Icons are referenced by string identifiers to avoid Next.js 15 server component issues.

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  description?: string;
  badge?: string | number;
  submenu?: NavItem[];
  status?: string;
  section?: string; // Optional section header to display above this item
}

export interface ProfileMenuItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon: string; // String identifier for icon
}

// Main public navigation (for home page, marketing pages)
export const publicNavItems: NavItem[] = [
  { label: 'Home', href: '/', icon: 'FaHome' },
  { label: 'How It Works', href: '/how-it-works', icon: 'FaInfoCircle' },
  { label: 'Pricing', href: '/pricing', icon: 'FaMoneyBillWave' },
  { label: 'About', href: '/about', icon: 'FaInfoCircle' },
  { label: 'Blog', href: '/blog', icon: 'FaBlog' },
  { label: 'Contact', href: '/contact', icon: 'FaEnvelope' },
  { label: 'FAQ', href: '/faq', icon: 'FaQuestionCircle' },
];

// Footer navigation links
export const footerNavItems = {
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Careers', href: '/careers' },
    { label: 'Blog', href: '/blog' },
    { label: 'Press', href: '/press' },
    { label: 'Testimonials', href: '/testimonials' },
    { label: 'Teams', href: '/teams' },
    { label: 'Referral', href: '/referral' },
  ],
  services: [
    { label: 'For Freelancers', href: '/freelancers' },
    { label: 'For Clients', href: '/clients' },
    { label: 'AI Tools', href: '/ai/chatbot' },
    { label: 'Fraud Check', href: '/ai/fraud-check' },
    { label: 'Price Estimator', href: '/ai/price-estimator' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Enterprise', href: '/enterprise' },
  ],
  support: [
    { label: 'Help Center', href: '/help' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Community', href: '/community' },
    { label: 'Status', href: '/status' },
    { label: 'Forgot Password', href: '/forgot-password' },
    { label: 'Reset Password', href: '/reset-password' },
    { label: 'Support', href: '/support' },
    { label: 'Install', href: '/install' },
    { label: 'Onboarding', href: '/onboarding' },
    { label: 'Search', href: '/search' },
    { label: 'Wallet', href: '/wallet' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Security', href: '/security' },
  ],
};

// Dashboard navigation (general authenticated users) - REMOVED
// All users should use role-specific navigation (freelancer, client, or admin)
export const dashboardNavItems: NavItem[] = [];

// Freelancer-specific navigation
export const freelancerNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/freelancer/dashboard', icon: 'LayoutDashboard', section: 'Overview' },
  { label: 'Messages', href: '/freelancer/messages', icon: 'MessageSquare' },
  { label: 'My Jobs', href: '/freelancer/my-jobs', icon: 'Briefcase', section: 'Work' },
  { label: 'Proposals', href: '/freelancer/proposals', icon: 'FileText' },
  { label: 'Projects', href: '/freelancer/projects', icon: 'FolderGit2' },
  { label: 'Contracts', href: '/freelancer/contracts', icon: 'FileText' },
  { label: 'External Projects', href: '/external-projects', icon: 'Globe' },
  { label: 'Time Tracking', href: '/freelancer/time-entries', icon: 'Calendar', section: 'Finance' },
  { label: 'Invoices', href: '/freelancer/invoices', icon: 'FileText' },
  { label: 'Wallet', href: '/freelancer/wallet', icon: 'Wallet' },
  { label: 'Portfolio', href: '/freelancer/portfolio', icon: 'User', section: 'Profile' },
  { label: 'Skills', href: '/freelancer/skills', icon: 'Wrench' },
  { label: 'Rank', href: '/freelancer/rank', icon: 'TrendingUp' },
  { label: 'Reviews', href: '/freelancer/reviews', icon: 'Star' },
  { label: 'Analytics', href: '/freelancer/analytics', icon: 'LineChart' },
  { label: 'Job Alerts', href: '/freelancer/job-alerts', icon: 'Bell' },
  { label: 'Saved Jobs', href: '/freelancer/saved-jobs', icon: 'Heart' },
  { label: 'Support', href: '/freelancer/support', icon: 'HelpCircle', section: 'Settings' },
  { label: 'Settings', href: '/freelancer/settings', icon: 'Settings' },
];

// Client-specific navigation
export const clientNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/client/dashboard', icon: 'LayoutDashboard', section: 'Overview' },
  { label: 'Messages', href: '/client/messages', icon: 'MessageSquare' },
  { label: 'Post Job', href: '/client/post-job', icon: 'TrendingUp', section: 'Hiring' },
  { label: 'Hire', href: '/client/hire', icon: 'Users' },
  { label: 'Talent Search', href: '/client/search', icon: 'Search' },
  { label: 'Projects', href: '/client/projects', icon: 'Briefcase', section: 'Projects' },
  { label: 'Contracts', href: '/client/contracts', icon: 'FileText' },
  { label: 'Invoices', href: '/client/invoices', icon: 'FileText' },
  { label: 'Reports', href: '/client/reports', icon: 'BarChart3' },
  { label: 'Payments', href: '/client/payments', icon: 'CreditCard', section: 'Finance' },
  { label: 'Escrow', href: '/client/escrow', icon: 'Lock' },
  { label: 'Wallet', href: '/client/wallet', icon: 'Wallet' },
  { label: 'Reviews', href: '/client/reviews', icon: 'Star' },
  { label: 'Help', href: '/client/help', icon: 'HelpCircle', section: 'Settings' },
  { label: 'Settings', href: '/client/settings', icon: 'Settings' },
];

// Admin navigation — grouped with submenus for better UX
export const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: 'LayoutDashboard', section: 'Overview' },
  { label: 'Analytics', href: '/admin/analytics', icon: 'LineChart' },
  { label: 'Users', href: '/admin/users', icon: 'Users', section: 'Management' },
  { label: 'Projects', href: '/admin/projects', icon: 'Briefcase' },
  { label: 'Messages', href: '/admin/messages', icon: 'MessageSquare' },
  { label: 'Categories', href: '/admin/categories', icon: 'List', section: 'Content' },
  { label: 'Skills', href: '/admin/skills', icon: 'Wrench' },
  { label: 'Tags', href: '/admin/tags', icon: 'Tag' },
  { label: 'Payments', href: '/admin/payments', icon: 'CreditCard', section: 'Financial', submenu: [
    { label: 'Transactions', href: '/admin/payments' },
    { label: 'Refunds', href: '/admin/refunds' },
    { label: 'Billing', href: '/admin/billing' },
  ]},
  { label: 'Disputes', href: '/admin/disputes', icon: 'Gavel' },
  { label: 'Content Moderation', href: '/admin/moderation', icon: 'ShieldAlert', section: 'Security' },
  { label: 'Fraud Detection', href: '/admin/fraud-detection', icon: 'ShieldAlert' },
  { label: 'Security', href: '/admin/security', icon: 'Lock' },
  { label: 'Audit Logs', href: '/admin/audit', icon: 'FileText' },
  { label: 'Compliance', href: '/admin/compliance', icon: 'ShieldAlert' },
  { label: 'AI Monitoring', href: '/admin/ai-monitoring', icon: 'Bot', section: 'System' },
  { label: 'System Health', href: '/admin/health', icon: 'Activity' },
  { label: 'Support', href: '/admin/support', icon: 'HelpCircle' },
  { label: 'Settings', href: '/admin/settings', icon: 'Settings' },
];

// AI Tools navigation
export const aiToolsNavItems: NavItem[] = [
  { label: 'Chatbot', href: '/ai/chatbot', icon: 'Bot' },
  { label: 'Price Estimator', href: '/ai/price-estimator', icon: 'CreditCard' },
  { label: 'Fraud Check', href: '/ai/fraud-check', icon: 'ShieldAlert' },
];

// Profile menu items (common across all user types)
export const profileMenuItems: ProfileMenuItem[] = [
  { label: 'My Profile', href: '/profile', icon: 'FaUser' },
  { label: 'Settings', href: '/settings', icon: 'FaCogs' },
  { label: 'Notifications', href: '/notifications', icon: 'FaBell' },
  { label: 'Logout', onClick: () => {
    // Handle logout logic
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      window.location.href = '/';
    }
  }, icon: 'FaSignOutAlt' },
];

// Quick access links for different user types
export const quickAccessLinks = {
  freelancer: [
    { label: 'Find Jobs', href: '/jobs' },
    { label: 'My Proposals', href: '/freelancer/my-jobs' },
    { label: 'Earnings', href: '/freelancer/wallet' },
    { label: 'Messages', href: '/freelancer/messages' },
  ],
  client: [
    { label: 'Post a Job', href: '/client/post-job' },
    { label: 'Find Freelancers', href: '/freelancers' },
    { label: 'My Projects', href: '/client/projects' },
    { label: 'Messages', href: '/client/messages' },
  ],
  admin: [
    { label: 'User Management', href: '/admin/users' },
    { label: 'System Health', href: '/admin/ai-monitoring' },
    { label: 'Support Queue', href: '/admin/support' },
    { label: 'Audit Logs', href: '/audit-logs' },
  ],
};

// Utility function to get navigation items based on user type
export const getNavigationForUserType = (userType: 'freelancer' | 'client' | 'admin' | 'public' = 'public'): NavItem[] => {
  switch (userType) {
    case 'freelancer':
      return freelancerNavItems;
    case 'client':
      return clientNavItems;
    case 'admin':
      return adminNavItems;
    case 'public':
    default:
      return publicNavItems;
  }
};

// Icon mapping for client-side resolution
export const iconMap = {
  FaHome: 'FaHome',
  FaInfoCircle: 'FaInfoCircle',
  FaMoneyBillWave: 'FaMoneyBillWave',
  FaBlog: 'FaBlog',
  FaEnvelope: 'FaEnvelope',
  FaQuestionCircle: 'FaQuestionCircle',
  FaTachometerAlt: 'FaTachometerAlt',
  FaBriefcase: 'FaBriefcase',
  FaComments: 'FaComments',
  FaCreditCard: 'FaCreditCard',
  FaCogs: 'FaCogs',
  FaFileContract: 'FaFileContract',
  FaPortrait: 'FaPortrait',
  FaChartLine: 'FaChartLine',
  FaWallet: 'FaWallet',
  FaStar: 'FaStar',
  FaBell: 'FaBell',
  FaLifeRing: 'FaLifeRing',
  FaRocket: 'FaRocket',
  FaUsers: 'FaUsers',
  FaRobot: 'FaRobot',
  FaCalculator: 'FaCalculator',
  FaShieldAlt: 'FaShieldAlt',
  FaUser: 'FaUser',
  FaSignOutAlt: 'FaSignOutAlt',
  FaClock: 'FaClock',
  FaFileInvoice: 'FaFileInvoice',
  FaHeart: 'FaHeart',
  FaLock: 'FaLock',
  FaUndo: 'FaUndo',
  FaTag: 'FaTag',
};

// Breadcrumb configuration
export const breadcrumbConfig: Record<string, string[]> = {
  '/projects': ['Projects'],
  '/freelancer/dashboard': ['Freelancer', 'Dashboard'],
  '/freelancer/projects': ['Freelancer', 'Projects'],
  '/freelancer/profile': ['Freelancer', 'Profile'],
  '/client/dashboard': ['Client', 'Dashboard'],
  '/client/projects': ['Client', 'Projects'],
  '/client/profile': ['Client', 'Profile'],
  '/admin/dashboard': ['Admin', 'Dashboard'],
  '/admin/users': ['Admin', 'Users'],
  '/admin/profile': ['Admin', 'Profile'],
  '/Settings': ['Dashboard', 'Settings'],
  '/Profile': ['Dashboard', 'Profile'],
};
