// @AI-HINT: AI-powered features showcase section highlighting intelligent automation

'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { FaRobot, FaBrain, FaChartLine, FaShieldAlt, FaComments, FaDollarSign } from 'react-icons/fa';
import { cn } from '@/lib/utils';

import commonStyles from './AIShowcase.module.scss';
import lightStyles from './AIShowcase.light.module.scss';
import darkStyles from './AIShowcase.dark.module.scss';

const AIShowcase: React.FC = () => {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  const aiFeatures = [
    {
      icon: FaBrain,
      title: "Smart Job Matching",
      description: "Our AI analyzes your skills, experience, and preferences to match you with the perfect projects automatically.",
      stats: "97% Match Accuracy"
    },
    {
      icon: FaDollarSign,
      title: "AI Price Forecasting",
      description: "Get intelligent pricing recommendations based on market trends, project complexity, and your expertise level.",
      stats: "15% Higher Earnings"
    },
    {
      icon: FaShieldAlt,
      title: "Fraud Detection",
      description: "Advanced ML algorithms protect you from scams and identify suspicious activities in real-time.",
      stats: "99.9% Security Rate"
    },
    {
      icon: FaComments,
      title: "AI Chatbot Support",
      description: "24/7 intelligent assistance for platform guidance, dispute resolution, and technical support.",
      stats: "< 30s Response Time"
    },
    {
      icon: FaChartLine,
      title: "Performance Analytics",
      description: "AI-powered insights help you optimize your profile, improve your rankings, and grow your business.",
      stats: "3x Faster Growth"
    },
    {
      icon: FaRobot,
      title: "Automated Workflows",
      description: "Smart automation handles routine tasks like invoicing, follow-ups, and project updates.",
      stats: "80% Time Saved"
    }
  ];

  return (
    <section className={cn(commonStyles.aiShowcase, themeStyles.aiShowcase)}>
      <div className={commonStyles.container}>
        <div className={commonStyles.header}>
          <div className={commonStyles.badge}>
            <FaRobot className={commonStyles.badgeIcon} />
            <span>Powered by Advanced AI</span>
          </div>
          <h2 className={commonStyles.title}>
            Artificial Intelligence That <span className={commonStyles.titleHighlight}>Works for You</span>
          </h2>
          <p className={commonStyles.subtitle}>
            Experience the future of freelancing with cutting-edge AI technology that automates the mundane
            and amplifies your potential. Our machine learning models are trained on millions of successful
            freelance interactions.
          </p>
        </div>

        <div className={commonStyles.grid}>
          {aiFeatures.map((feature, index) => (
            <div key={index} className={commonStyles.card}>
              <div className={commonStyles.cardHeader}>
                <div className={commonStyles.cardIcon}>
                  <feature.icon />
                </div>
                <div className={commonStyles.cardStats}>{feature.stats}</div>
              </div>
              <h3 className={commonStyles.cardTitle}>{feature.title}</h3>
              <p className={commonStyles.cardDescription}>{feature.description}</p>
              <div className={commonStyles.cardFooter}>
                <div className={commonStyles.cardGlow}></div>
              </div>
            </div>
          ))}
        </div>

        <div className={commonStyles.techStack}>
          <h3 className={commonStyles.techTitle}>Powered by Industry-Leading Technology</h3>
          <div className={commonStyles.techLogos}>
            <div className={commonStyles.techLogo}>TensorFlow</div>
            <div className={commonStyles.techLogo}>OpenAI GPT</div>
            <div className={commonStyles.techLogo}>PyTorch</div>
            <div className={commonStyles.techLogo}>Scikit-learn</div>
            <div className={commonStyles.techLogo}>Hugging Face</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIShowcase;
