// @AI-HINT: AI Hub landing page showcasing all AI features available on MegiLance platform
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { 
  MessageSquare, 
  DollarSign, 
  Shield, 
  Search, 
  FileText, 
  Sparkles,
  ArrowRight,
  Cpu,
  Zap,
  Brain
} from 'lucide-react';
import PublicHeader from '../components/Layout/PublicHeader/PublicHeader';
import Footer from '../components/Layout/Footer/Footer';

const aiFeatures = [
  {
    title: 'AI Chatbot',
    description: 'Get instant answers to your questions about the platform, pricing, and finding freelancers.',
    icon: MessageSquare,
    href: '/ai/chatbot',
    status: 'Live',
    color: 'blue'
  },
  {
    title: 'Price Estimator',
    description: 'Get AI-powered price estimates for your projects based on market data and complexity.',
    icon: DollarSign,
    href: '/ai/price-estimator',
    status: 'Live',
    color: 'green'
  },
  {
    title: 'Fraud Detection',
    description: 'Multi-layer protection system that analyzes users, projects, and proposals for potential risks.',
    icon: Shield,
    href: '/ai/fraud-check',
    status: 'Live',
    color: 'red'
  },
  {
    title: 'Smart Matching',
    description: 'Skill-based matching algorithm that connects you with the perfect freelancer or project.',
    icon: Search,
    href: '/explore',
    status: 'Live',
    color: 'purple'
  },
  {
    title: 'Proposal Generator',
    description: 'AI-powered proposal templates to help you create professional cover letters.',
    icon: FileText,
    href: '/dashboard',
    status: 'Live',
    color: 'orange'
  },
  {
    title: 'Sentiment Analysis',
    description: 'Analyze reviews and feedback to understand client satisfaction and improve services.',
    icon: Sparkles,
    href: '/ai/chatbot',
    status: 'Beta',
    color: 'pink'
  }
];

const AIHubPage = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';

  return (
    <div className={cn(
      'min-h-screen',
      isDark ? 'bg-[#0b0f19] text-white' : 'bg-gray-50 text-gray-900'
    )}>
      <PublicHeader />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
          <div className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6',
            isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-600'
          )}>
            <Brain className="w-4 h-4" />
            AI-Powered Platform
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            MegiLance{' '}
            <span className={cn(
              'bg-gradient-to-r bg-clip-text text-transparent',
              isDark 
                ? 'from-blue-400 via-purple-400 to-pink-400' 
                : 'from-blue-600 via-purple-600 to-pink-600'
            )}>
              AI Hub
            </span>
          </h1>
          
          <p className={cn(
            'text-lg md:text-xl max-w-3xl mx-auto mb-8',
            isDark ? 'text-gray-400' : 'text-gray-600'
          )}>
            Explore our suite of AI-powered tools designed to enhance your freelancing experience. 
            From intelligent matching to automated pricing, we've got you covered.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <div className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-600'
            )}>
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">All Services Live</span>
            </div>
            <div className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-100 text-purple-600'
            )}>
              <Cpu className="w-4 h-4" />
              <span className="text-sm font-medium">Real-time Processing</span>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiFeatures.map((feature) => {
              const Icon = feature.icon;
              const colorClasses = {
                blue: isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200',
                green: isDark ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-green-50 text-green-600 border-green-200',
                red: isDark ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-200',
                purple: isDark ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-600 border-purple-200',
                orange: isDark ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-50 text-orange-600 border-orange-200',
                pink: isDark ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : 'bg-pink-50 text-pink-600 border-pink-200',
              };
              
              return (
                <Link
                  key={feature.title}
                  href={feature.href}
                  className={cn(
                    'group block p-6 rounded-2xl border transition-all duration-300',
                    isDark 
                      ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600 hover:bg-gray-800' 
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg'
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                      'p-3 rounded-xl',
                      colorClasses[feature.color as keyof typeof colorClasses]
                    )}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      feature.status === 'Live'
                        ? isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-600'
                        : isDark ? 'bg-yellow-500/10 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
                    )}>
                      {feature.status}
                    </span>
                  </div>
                  
                  <h3 className={cn(
                    'text-xl font-semibold mb-2',
                    isDark ? 'text-white' : 'text-gray-900'
                  )}>
                    {feature.title}
                  </h3>
                  
                  <p className={cn(
                    'text-sm mb-4',
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    {feature.description}
                  </p>
                  
                  <div className={cn(
                    'flex items-center gap-2 text-sm font-medium transition-transform group-hover:translate-x-1',
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  )}>
                    <span>Try it now</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className={cn(
            'rounded-3xl p-8 md:p-12 text-center',
            isDark 
              ? 'bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-gray-700' 
              : 'bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100'
          )}>
            <h2 className={cn(
              'text-2xl md:text-3xl font-bold mb-4',
              isDark ? 'text-white' : 'text-gray-900'
            )}>
              Ready to Experience AI-Powered Freelancing?
            </h2>
            <p className={cn(
              'text-lg mb-6 max-w-2xl mx-auto',
              isDark ? 'text-gray-400' : 'text-gray-600'
            )}>
              Join thousands of freelancers and clients who are already using our AI tools 
              to work smarter and achieve better results.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/signup"
                className={cn(
                  'px-6 py-3 rounded-xl font-semibold transition-all',
                  'bg-blue-600 text-white hover:bg-blue-700'
                )}
              >
                Get Started Free
              </Link>
              <Link
                href="/ai/chatbot"
                className={cn(
                  'px-6 py-3 rounded-xl font-semibold transition-all',
                  isDark 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200'
                )}
              >
                Try AI Chatbot
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default AIHubPage;
