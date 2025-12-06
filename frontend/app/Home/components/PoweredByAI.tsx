// @AI-HINT: "Powered by Enterprise-Grade AI" section component showcasing MegiLance's AI infrastructure, machine learning capabilities, and AI-driven features. Includes interactive feature cards, tech stack display, and performance metrics.

'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import {
  BrainCircuit,
  TrendingUp,
  ShieldCheck,
  MessageCircle,
  BarChart,
  Zap,
  Sparkles,
  ArrowRight,
  Database,
} from 'lucide-react';

import commonStyles from './PoweredByAI.common.module.css';
import lightStyles from './PoweredByAI.light.module.css';
import darkStyles from './PoweredByAI.dark.module.css';

// --- SVG Logo Components for Tech Stack ---
const TensorFlowIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.964 0L4.536 4.311v15.378l7.428 4.311 7.428-4.31V4.311zm.036 21.536L6.536 18.38V7.577l5.464-3.155 5.464 3.155v10.8l-5.428 3.156zM12 10.433l-3.103-1.792v3.584L12 14.017l3.103-1.792v-3.584zM8.897 6.845L12 5.05l3.103 1.795v3.583L12 12.22l-3.103-1.792z" fill="currentColor"/>
  </svg>
);

const OpenAIIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364l2.0201-1.1638a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.4046-.6813zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997z" fill="currentColor"/>
  </svg>
);

const PyTorchIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.005 0L4.952 7.053a9.865 9.865 0 000 13.94 9.866 9.866 0 0013.94 0 9.865 9.865 0 000-13.94l-1.39 1.39a7.893 7.893 0 010 11.16 7.893 7.893 0 01-11.16 0 7.893 7.893 0 010-11.16l4.27-4.27v4.27a3.945 3.945 0 00-2.786 6.73 3.945 3.945 0 005.58 0 3.945 3.945 0 000-5.58 3.945 3.945 0 00-2.794-1.154V0h-.607zm4.27 3.945a.986.986 0 100 1.972.986.986 0 000-1.972z" fill="currentColor"/>
  </svg>
);

const HuggingFaceIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 1.5a8.5 8.5 0 110 17 8.5 8.5 0 010-17zm-3.5 6a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5zm7 0a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5zM12 13c-2.5 0-4 1.5-4 3h8c0-1.5-1.5-3-4-3z" fill="currentColor"/>
  </svg>
);

const OracleIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.076 7.076C4.952 7.076 3.217 8.81 3.217 10.936v2.128c0 2.125 1.735 3.86 3.86 3.86h9.847c2.125 0 3.86-1.735 3.86-3.86v-2.128c0-2.125-1.735-3.86-3.86-3.86H7.076zm9.847 1.5h.001c1.287 0 2.36 1.072 2.36 2.36v2.128c0 1.287-1.073 2.36-2.36 2.36H7.076c-1.288 0-2.36-1.073-2.36-2.36v-2.128c0-1.288 1.072-2.36 2.36-2.36h9.847z" fill="currentColor"/>
  </svg>
);

const ScikitLearnIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.13.43a.48.48 0 00-.76.42l1.36 9.84-8.22 3.03a.48.48 0 00-.28.6l7.4 9.23a.48.48 0 00.76-.42L10.03 13.3l8.22-3.03a.48.48 0 00.28-.6L11.13.44zM24 10.1a2.88 2.88 0 00-2.88-2.88h-1.92a.96.96 0 100 1.92h1.92a.96.96 0 110 1.92h-1.92a.96.96 0 100 1.92h1.92A2.88 2.88 0 0024 10.1z" fill="currentColor"/>
  </svg>
);

interface AIFeature {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  metric: string;
  metricValue: string;
  variant: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'teal' | 'pink';
}

const aiFeatures: AIFeature[] = [
  {
    id: 'matching',
    icon: <BrainCircuit />,
    title: 'Intelligent Job Matching',
    description:
      'Our AI analyzes your skills, experience, and portfolio to match you with high-value projects that perfectly align with your expertise.',
    metric: 'Match Accuracy',
    metricValue: '97%',
    variant: 'blue',
  },
  {
    id: 'pricing',
    icon: <TrendingUp />,
    title: 'Dynamic Price Modeling',
    description:
      'Get data-driven pricing recommendations based on real-time market trends, demand signals, and historical project data to maximize earnings.',
    metric: 'Earning Potential',
    metricValue: '+25%',
    variant: 'green',
  },
  {
    id: 'fraud',
    icon: <ShieldCheck />,
    title: 'Proactive Fraud Shield',
    description:
      'Advanced machine learning algorithms continuously monitor transactions and user behavior to protect you from scams and fraudulent activity.',
    metric: 'Security Level',
    metricValue: '99.9%',
    variant: 'red',
  },
  {
    id: 'support',
    icon: <MessageCircle />,
    title: 'Contextual AI Assist',
    description:
      '24/7 intelligent chatbot support for platform guidance, proposal generation, dispute resolution, and strategic career advice.',
    metric: 'Response Time',
    metricValue: '<1min',
    variant: 'purple',
  },
  {
    id: 'analytics',
    icon: <BarChart />,
    title: 'Performance Analytics',
    description:
      'AI-powered insights help you optimize your profile, track performance trends, identify strengths, and accelerate career growth with actionable recommendations.',
    metric: 'Growth Impact',
    metricValue: '3x Faster',
    variant: 'orange',
  },
  {
    id: 'automation',
    icon: <Zap />,
    title: 'Automated Workflows',
    description:
      'Intelligent automation handles routine tasks like invoicing, milestone tracking, payment processing, and project updates—freeing you to focus on your craft.',
    metric: 'Time Saved Weekly',
    metricValue: '10+ Hours',
    variant: 'teal',
  },
  {
    id: 'insights',
    icon: <Sparkles />,
    title: 'Predictive Career Insights',
    description:
      'Machine learning models predict market trends, emerging skills in demand, and optimal project timing to keep you ahead of the competition.',
    metric: 'Accuracy',
    metricValue: '96%',
    variant: 'pink',
  },
];

const techStackData = [
  { name: 'TensorFlow', type: 'Deep Learning', Icon: TensorFlowIcon },
  { name: 'OpenAI', type: 'Language Models', Icon: OpenAIIcon },
  { name: 'PyTorch', type: 'ML Framework', Icon: PyTorchIcon },
  { name: 'Hugging Face', type: 'NLP Models', Icon: HuggingFaceIcon },
  { name: 'Oracle 26ai', type: 'AI Database', Icon: OracleIcon },
  { name: 'scikit-learn', type: 'ML Tools', Icon: ScikitLearnIcon },
];

interface FeatureCardProps {
  feature: AIFeature;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  themeStyles: any;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  feature,
  isHovered,
  onHover,
  themeStyles,
}) => {
  const variantClass = `variant${feature.variant.charAt(0).toUpperCase() + feature.variant.slice(1)}`;

  return (
    <div
      className={cn(
        commonStyles.featureCard,
        commonStyles[variantClass as keyof typeof commonStyles],
        themeStyles.featureCard,
        isHovered && commonStyles.featureCardHovered
      )}
      onMouseEnter={() => onHover(feature.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Gradient Accent Line */}
      <div className={commonStyles.accentLine} />

      {/* Icon */}
      <div className={cn(commonStyles.iconWrapper, commonStyles[variantClass as keyof typeof commonStyles])}>
        {feature.icon}
      </div>

      {/* Metric Badge */}
      <div className={commonStyles.metricBadge}>
        <span className={commonStyles.metricValue}>{feature.metricValue}</span>
        <span className={commonStyles.metricLabel}>{feature.metric}</span>
      </div>

      {/* Content */}
      <div className={commonStyles.cardContent}>
        <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>
          {feature.title}
        </h3>
        <p className={cn(commonStyles.cardDescription, themeStyles.cardDescription)}>
          {feature.description}
        </p>
      </div>

      {/* CTA Arrow (Visible on Hover) */}
      <div className={cn(commonStyles.ctaArrow, isHovered && commonStyles.ctaArrowVisible)}>
        <ArrowRight size={20} />
      </div>
    </div>
  );
};

const PoweredByAI: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <section className={cn(commonStyles.section, themeStyles.section)}>
      {/* Background Animation */}
      <div className={commonStyles.backgroundElements}>
        <div className={commonStyles.gradientOrb1} />
        <div className={commonStyles.gradientOrb2} />
        <div className={commonStyles.gradientOrb3} />
      </div>

      <div className={commonStyles.container}>
        {/* Section Header */}
        <div className={cn(commonStyles.header, themeStyles.header)}>
          <div className={cn(commonStyles.badge, themeStyles.badge)}>
            <Sparkles size={16} />
            <span>AI-Powered Platform</span>
          </div>

          <h2 className={cn(commonStyles.heading, themeStyles.heading)}>
            Powered by
            <br />
            <span className={commonStyles.highlightText}>Enterprise-Grade AI</span>
          </h2>

          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Your AI Co-Pilot for Freelance Success. MegiLance integrates cutting-edge machine
            learning to automate the mundane and amplify your potential. Our models are trained
            on millions of successful projects to give you a competitive edge.
          </p>
        </div>

        {/* Features Grid */}
        <div className={commonStyles.featuresGrid}>
          {aiFeatures.map((feature) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              isHovered={hoveredCard === feature.id}
              onHover={setHoveredCard}
              themeStyles={themeStyles}
            />
          ))}
        </div>

        {/* Capabilities Summary */}
        <div className={cn(commonStyles.capabilitiesSection, themeStyles.capabilitiesSection)}>
          <h3 className={cn(commonStyles.capabilitiesTitle, themeStyles.capabilitiesTitle)}>
            AI Capabilities
          </h3>
          <div className={commonStyles.capabilitiesGrid}>
            {[
              { icon: '🎯', text: 'Smart skill-based job matching' },
              { icon: '📊', text: 'Real-time market analysis' },
              { icon: '🛡️', text: 'Continuous fraud monitoring' },
              { icon: '💡', text: 'Intelligent proposal suggestions' },
              { icon: '⚡', text: 'Automated task completion' },
              { icon: '📈', text: 'Predictive performance insights' },
            ].map((item, idx) => (
              <div key={idx} className={commonStyles.capabilityItem}>
                <span className={commonStyles.capabilityIcon}>{item.icon}</span>
                <span className={cn(commonStyles.capabilityText, themeStyles.capabilityText)}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PoweredByAI;
