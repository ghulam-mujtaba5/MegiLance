// @AI-HINT: Onboarding tour wizard for welcoming and guiding new users through MegiLance platform
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import WizardContainer from '@/app/components/Wizard/WizardContainer/WizardContainer';
import Modal from '@/app/components/Modal/Modal';
import commonStyles from './OnboardingTourWizard.common.module.css';
import lightStyles from './OnboardingTourWizard.light.module.css';
import darkStyles from './OnboardingTourWizard.dark.module.css';
import {
  Rocket,
  CircleUserRound,
  Briefcase,
  Search,
  MessageCircle,
  FileText,
  DollarSign,
  Star,
  BookOpen,
  Video,
  Users,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

type UserRole = 'freelancer' | 'client';

interface OnboardingData {
  role: UserRole;
  hasCompletedProfileSetup: boolean;
  interestedFeatures: string[];
  skipReminder: boolean;
}

interface OnboardingTourWizardProps {
  userId: string;
  initialRole?: UserRole;
  onComplete?: () => void;
}

export default function OnboardingTourWizard({ 
  userId, 
  initialRole,
  onComplete 
}: OnboardingTourWizardProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const [currentStep, setCurrentStep] = useState(0);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    role: initialRole || 'freelancer',
    hasCompletedProfileSetup: false,
    interestedFeatures: [],
    skipReminder: false
  });

  // Track which features user is interested in
  const toggleFeature = (feature: string) => {
    setOnboardingData(prev => ({
      ...prev,
      interestedFeatures: prev.interestedFeatures.includes(feature)
        ? prev.interestedFeatures.filter(f => f !== feature)
        : [...prev.interestedFeatures, feature]
    }));
  };

  // STEP 1: Welcome & Role Confirmation
  const Step1Welcome = () => (
    <div className={commonStyles.stepContent}>
      <div className={commonStyles.welcomeHeader}>
        <Rocket className={commonStyles.welcomeIcon} />
        <h1>Welcome to MegiLance!</h1>
        <p className={commonStyles.welcomeSubtitle}>
          Your journey to {onboardingData.role === 'freelancer' ? 'finding amazing projects' : 'hiring top talent'} starts here
        </p>
      </div>

      <div className={commonStyles.roleSection}>
        <h3>I&apos;m here to...</h3>
        <div className={commonStyles.roleCards}>
          <div
            className={cn(
              commonStyles.roleCard,
              themeStyles.roleCard,
              onboardingData.role === 'freelancer' && commonStyles.roleCardSelected,
              onboardingData.role === 'freelancer' && themeStyles.roleCardSelected
            )}
            onClick={() => setOnboardingData({ ...onboardingData, role: 'freelancer' })}
          >
            <CircleUserRound className={commonStyles.roleIcon} />
            <h4>Find Work as a Freelancer</h4>
            <p>Browse projects, submit proposals, and build your career</p>
            <ul className={commonStyles.roleFeatures}>
              <li><CheckCircle /> Access thousands of projects</li>
              <li><CheckCircle /> Build your portfolio</li>
              <li><CheckCircle /> Secure payments</li>
              <li><CheckCircle /> Grow your reputation</li>
            </ul>
          </div>

          <div
            className={cn(
              commonStyles.roleCard,
              themeStyles.roleCard,
              onboardingData.role === 'client' && commonStyles.roleCardSelected,
              onboardingData.role === 'client' && themeStyles.roleCardSelected
            )}
            onClick={() => setOnboardingData({ ...onboardingData, role: 'client' })}
          >
            <Briefcase className={commonStyles.roleIcon} />
            <h4>Hire Freelancers for Projects</h4>
            <p>Post projects, review proposals, and manage your team</p>
            <ul className={commonStyles.roleFeatures}>
              <li><CheckCircle /> Access vetted talent</li>
              <li><CheckCircle /> Manage multiple projects</li>
              <li><CheckCircle /> Track progress easily</li>
              <li><CheckCircle /> Secure escrow payments</li>
            </ul>
          </div>
        </div>
      </div>

      <div className={cn(commonStyles.statsBox, themeStyles.statsBox)}>
        <div className={commonStyles.stat}>
          <div className={commonStyles.statNumber}>50K+</div>
          <div className={commonStyles.statLabel}>Active Freelancers</div>
        </div>
        <div className={commonStyles.stat}>
          <div className={commonStyles.statNumber}>10K+</div>
          <div className={commonStyles.statLabel}>Projects Completed</div>
        </div>
        <div className={commonStyles.stat}>
          <div className={commonStyles.statNumber}>$5M+</div>
          <div className={commonStyles.statLabel}>Total Earned</div>
        </div>
        <div className={commonStyles.stat}>
          <div className={commonStyles.statNumber}>4.8/5</div>
          <div className={commonStyles.statLabel}>Average Rating</div>
        </div>
      </div>
    </div>
  );

  // STEP 2: Platform Overview
  const Step2PlatformOverview = () => {
    const freelancerFeatures = [
      { icon: Search, title: 'Browse Projects', description: 'Explore thousands of projects matching your skills', highlight: 'interestedFeatures' },
      { icon: FileText, title: 'Submit Proposals', description: 'Send customized proposals with your rates and timeline', highlight: 'interestedFeatures' },
      { icon: MessageCircle, title: 'Real-time Messaging', description: 'Communicate instantly with clients', highlight: 'interestedFeatures' },
      { icon: DollarSign, title: 'Secure Payments', description: 'Get paid safely through escrow protection', highlight: 'interestedFeatures' },
      { icon: Star, title: 'Build Reputation', description: 'Earn reviews and climb the rankings', highlight: 'interestedFeatures' },
      { icon: CircleUserRound, title: 'Showcase Portfolio', description: 'Display your best work to attract clients', highlight: 'interestedFeatures' }
    ];

    const clientFeatures = [
      { icon: Briefcase, title: 'Post Projects', description: 'Create detailed project listings in minutes', highlight: 'interestedFeatures' },
      { icon: Search, title: 'Search Talent', description: 'Find the perfect freelancer for your needs', highlight: 'interestedFeatures' },
      { icon: FileText, title: 'Review Proposals', description: 'Compare bids and choose the best fit', highlight: 'interestedFeatures' },
      { icon: MessageCircle, title: 'Collaborate', description: 'Stay connected with your team', highlight: 'interestedFeatures' },
      { icon: DollarSign, title: 'Escrow Protection', description: 'Only release payment when satisfied', highlight: 'interestedFeatures' },
      { icon: Star, title: 'Leave Reviews', description: 'Build trust through honest feedback', highlight: 'interestedFeatures' }
    ];

    const features = onboardingData.role === 'freelancer' ? freelancerFeatures : clientFeatures;

    return (
      <div className={commonStyles.stepContent}>
        <div className={commonStyles.overviewHeader}>
          <h2>Key Features You&apos;ll Love</h2>
          <p>Click on features you&apos;re most interested in exploring first</p>
        </div>

        <div className={commonStyles.featuresGrid}>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isSelected = onboardingData.interestedFeatures.includes(feature.title);
            
            return (
              <div
                key={index}
                className={cn(
                  commonStyles.featureCard,
                  themeStyles.featureCard,
                  isSelected && commonStyles.featureCardSelected,
                  isSelected && themeStyles.featureCardSelected
                )}
                onClick={() => toggleFeature(feature.title)}
              >
                <Icon className={commonStyles.featureIcon} />
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
                {isSelected && <CheckCircle className={commonStyles.selectedBadge} />}
              </div>
            );
          })}
        </div>

        <div className={cn(commonStyles.tipBox, themeStyles.tipBox)}>
          <strong>💡 Pro Tip:</strong> {onboardingData.role === 'freelancer' 
            ? 'Complete your profile and add portfolio items to increase your chances of getting hired by 5x!'
            : 'Projects with detailed descriptions and clear budgets receive 3x more quality proposals!'}
        </div>
      </div>
    );
  };

  // STEP 3: Profile Setup Prompt
  const Step3ProfileSetup = () => (
    <div className={commonStyles.stepContent}>
      <div className={commonStyles.profileHeader}>
        <CircleUserRound className={commonStyles.profileIcon} />
        <h2>Complete Your Profile</h2>
        <p>A complete profile builds trust and {onboardingData.role === 'freelancer' ? 'helps you get hired faster' : 'attracts better freelancers'}</p>
      </div>

      <div className={commonStyles.profileChecklist}>
        <h3>Profile Completion Checklist</h3>
        
        <div className={cn(commonStyles.checklistItem, themeStyles.checklistItem)}>
          <div className={commonStyles.checklistNumber}>1</div>
          <div className={commonStyles.checklistContent}>
            <h4>Profile Photo</h4>
            <p>Add a professional headshot to increase trust</p>
          </div>
          <button className={cn(commonStyles.actionButton, themeStyles.actionButton)}>
            Add Photo <ArrowRight />
          </button>
        </div>

        <div className={cn(commonStyles.checklistItem, themeStyles.checklistItem)}>
          <div className={commonStyles.checklistNumber}>2</div>
          <div className={commonStyles.checklistContent}>
            <h4>About You</h4>
            <p>Write a compelling bio highlighting your {onboardingData.role === 'freelancer' ? 'skills and experience' : 'business and needs'}</p>
          </div>
          <button className={cn(commonStyles.actionButton, themeStyles.actionButton)}>
            Write Bio <ArrowRight />
          </button>
        </div>

        {onboardingData.role === 'freelancer' && (
          <>
            <div className={cn(commonStyles.checklistItem, themeStyles.checklistItem)}>
              <div className={commonStyles.checklistNumber}>3</div>
              <div className={commonStyles.checklistContent}>
                <h4>Skills & Expertise</h4>
                <p>Add skills so clients can find you easily</p>
              </div>
              <button className={cn(commonStyles.actionButton, themeStyles.actionButton)}>
                Add Skills <ArrowRight />
              </button>
            </div>

            <div className={cn(commonStyles.checklistItem, themeStyles.checklistItem)}>
              <div className={commonStyles.checklistNumber}>4</div>
              <div className={commonStyles.checklistContent}>
                <h4>Portfolio</h4>
                <p>Showcase your best work samples</p>
              </div>
              <button className={cn(commonStyles.actionButton, themeStyles.actionButton)}>
                Add Portfolio <ArrowRight />
              </button>
            </div>
          </>
        )}

        <div className={cn(commonStyles.checklistItem, themeStyles.checklistItem)}>
          <div className={commonStyles.checklistNumber}>{onboardingData.role === 'freelancer' ? '5' : '3'}</div>
          <div className={commonStyles.checklistContent}>
            <h4>Verification</h4>
            <p>Verify your email and phone for added security</p>
          </div>
          <button className={cn(commonStyles.actionButton, themeStyles.actionButton)}>
            Verify Now <ArrowRight />
          </button>
        </div>
      </div>

      <div className={cn(commonStyles.benefitsBox, themeStyles.benefitsBox)}>
        <h4>✨ Benefits of a Complete Profile:</h4>
        <ul>
          <li>Stand out from the competition</li>
          <li>{onboardingData.role === 'freelancer' ? 'Appear higher in search results' : 'Attract more qualified freelancers'}</li>
          <li>Build trust with {onboardingData.role === 'freelancer' ? 'clients' : 'freelancers'}</li>
          <li>Unlock premium features</li>
        </ul>
      </div>
    </div>
  );

  // STEP 4: First Action Guide
  const Step4FirstAction = () => (
    <div className={commonStyles.stepContent}>
      <div className={commonStyles.actionHeader}>
        <h2>Ready to Get Started?</h2>
        <p>Here&apos;s what you can do right now</p>
      </div>

      {onboardingData.role === 'freelancer' ? (
        <div className={commonStyles.actionsGrid}>
          <div className={cn(commonStyles.actionCard, themeStyles.actionCard)}>
            <Search className={commonStyles.actionIcon} />
            <h3>Browse Projects</h3>
            <p>Explore projects matching your skills and interests</p>
            <button className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}>
              Find Projects <ArrowRight />
            </button>
          </div>

          <div className={cn(commonStyles.actionCard, themeStyles.actionCard)}>
            <CircleUserRound className={commonStyles.actionIcon} />
            <h3>Complete Your Profile</h3>
            <p>Make a great first impression with a stellar profile</p>
            <button className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}>
              Edit Profile <ArrowRight />
            </button>
          </div>

          <div className={cn(commonStyles.actionCard, themeStyles.actionCard)}>
            <Star className={commonStyles.actionIcon} />
            <h3>Build Your Portfolio</h3>
            <p>Showcase your best work to attract clients</p>
            <button className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}>
              Add Portfolio <ArrowRight />
            </button>
          </div>
        </div>
      ) : (
        <div className={commonStyles.actionsGrid}>
          <div className={cn(commonStyles.actionCard, themeStyles.actionCard)}>
            <Briefcase className={commonStyles.actionIcon} />
            <h3>Post a Project</h3>
            <p>Create your first project listing and get proposals</p>
            <button className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}>
              Post Project <ArrowRight />
            </button>
          </div>

          <div className={cn(commonStyles.actionCard, themeStyles.actionCard)}>
            <Search className={commonStyles.actionIcon} />
            <h3>Search Freelancers</h3>
            <p>Browse our talent pool and find the perfect match</p>
            <button className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}>
              Search Talent <ArrowRight />
            </button>
          </div>

          <div className={cn(commonStyles.actionCard, themeStyles.actionCard)}>
            <CircleUserRound className={commonStyles.actionIcon} />
            <h3>Complete Your Profile</h3>
            <p>Build trust with detailed company information</p>
            <button className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}>
              Edit Profile <ArrowRight />
            </button>
          </div>
        </div>
      )}

      <div className={cn(commonStyles.quickTips, themeStyles.quickTips)}>
        <h3>Quick Tips for Success</h3>
        <div className={commonStyles.tipsGrid}>
          {onboardingData.role === 'freelancer' ? (
            <>
              <div className={commonStyles.tip}>
                <CheckCircle />
                <span>Submit proposals within 24 hours of posting for better visibility</span>
              </div>
              <div className={commonStyles.tip}>
                <CheckCircle />
                <span>Personalize each proposal - avoid copy-paste templates</span>
              </div>
              <div className={commonStyles.tip}>
                <CheckCircle />
                <span>Respond to client messages quickly to show professionalism</span>
              </div>
              <div className={commonStyles.tip}>
                <CheckCircle />
                <span>Deliver work on time to build your reputation</span>
              </div>
            </>
          ) : (
            <>
              <div className={commonStyles.tip}>
                <CheckCircle />
                <span>Provide clear project descriptions to get better proposals</span>
              </div>
              <div className={commonStyles.tip}>
                <CheckCircle />
                <span>Set realistic budgets based on project complexity</span>
              </div>
              <div className={commonStyles.tip}>
                <CheckCircle />
                <span>Review freelancer portfolios and ratings carefully</span>
              </div>
              <div className={commonStyles.tip}>
                <CheckCircle />
                <span>Communicate expectations clearly from the start</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // STEP 5: Help Resources
  const Step5HelpResources = () => (
    <div className={commonStyles.stepContent}>
      <div className={commonStyles.helpHeader}>
        <h2>We&apos;re Here to Help</h2>
        <p>Access resources and support whenever you need it</p>
      </div>

      <div className={commonStyles.resourcesGrid}>
        <div className={cn(commonStyles.resourceCard, themeStyles.resourceCard)}>
          <BookOpen className={commonStyles.resourceIcon} />
          <h3>Help Center</h3>
          <p>Browse articles and guides on every feature</p>
          <a href="/help" className={cn(commonStyles.resourceLink, themeStyles.resourceLink)}>
            Visit Help Center →
          </a>
        </div>

        <div className={cn(commonStyles.resourceCard, themeStyles.resourceCard)}>
          <Video className={commonStyles.resourceIcon} />
          <h3>Video Tutorials</h3>
          <p>Watch step-by-step video guides</p>
          <a href="/tutorials" className={cn(commonStyles.resourceLink, themeStyles.resourceLink)}>
            Watch Tutorials →
          </a>
        </div>

        <div className={cn(commonStyles.resourceCard, themeStyles.resourceCard)}>
          <Users className={commonStyles.resourceIcon} />
          <h3>Community Forum</h3>
          <p>Connect with other users and share tips</p>
          <a href="/community" className={cn(commonStyles.resourceLink, themeStyles.resourceLink)}>
            Join Community →
          </a>
        </div>

        <div className={cn(commonStyles.resourceCard, themeStyles.resourceCard)}>
          <MessageCircle className={commonStyles.resourceIcon} />
          <h3>24/7 Support</h3>
          <p>Get help from our support team anytime</p>
          <a href="/support" className={cn(commonStyles.resourceLink, themeStyles.resourceLink)}>
            Contact Support →
          </a>
        </div>
      </div>

      <div className={cn(commonStyles.finalBox, themeStyles.finalBox)}>
        <h3>🎉 You&apos;re All Set!</h3>
        <p>Remember, you can always access this tour again from your account settings.</p>
        
        <div className={commonStyles.formGroup}>
          <label className={commonStyles.checkboxLabel}>
            <input
              type="checkbox"
              checked={onboardingData.skipReminder}
              onChange={(e) => setOnboardingData({ ...onboardingData, skipReminder: e.target.checked })}
            />
            <span>Don&apos;t show this tour again</span>
          </label>
        </div>
      </div>
    </div>
  );

  // Handle completion
  const handleComplete = async () => {
    try {
      await api.users.completeOnboarding({
        user_id: userId,
        role: onboardingData.role,
        interested_features: onboardingData.interestedFeatures,
        skip_reminder: onboardingData.skipReminder,
        completed_at: new Date().toISOString()
      } as any);

      // Mark onboarding as complete in localStorage
      localStorage.setItem('onboarding_complete', 'true');

      if (onComplete) {
        onComplete();
      } else {
        // Redirect based on role
        if (onboardingData.role === 'freelancer') {
          router.push('/freelancer/dashboard');
        } else {
          router.push('/client/dashboard');
        }
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still redirect even if API fails
      router.push(onboardingData.role === 'freelancer' ? '/freelancer/dashboard' : '/client/dashboard');
    }
  };

  const handleCancel = () => {
    setShowSkipModal(true);
  };

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome',
      description: 'Welcome to MegiLance',
      component: <Step1Welcome />
    },
    {
      id: 'overview',
      title: 'Platform Overview',
      description: 'Key features you\'ll love',
      component: <Step2PlatformOverview />
    },
    {
      id: 'profile',
      title: 'Profile Setup',
      description: 'Complete your profile',
      component: <Step3ProfileSetup />
    },
    {
      id: 'action',
      title: 'First Steps',
      description: 'Get started now',
      component: <Step4FirstAction />
    },
    {
      id: 'help',
      title: 'Help & Resources',
      description: 'Support when you need it',
      component: <Step5HelpResources />
    }
  ];

  return (
    <>
      <WizardContainer
        title="Welcome to MegiLance"
        subtitle="Let's get you started in just 5 simple steps"
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onComplete={handleComplete}
        onCancel={handleCancel}
        canSkip={true}
      />
      <Modal
        isOpen={showSkipModal}
        title="Skip Tour"
        onClose={() => setShowSkipModal(false)}
        footer={
          <div className={commonStyles.modalButtonGroup}>
            <button onClick={() => setShowSkipModal(false)} className={commonStyles.modalBtnSecondary}>No, Continue</button>
            <button onClick={() => { setShowSkipModal(false); localStorage.setItem('onboarding_skipped', 'true'); router.push(onboardingData.role === 'freelancer' ? '/freelancer/dashboard' : '/client/dashboard'); }} className={commonStyles.modalBtnDanger}>Yes, Skip</button>
          </div>
        }
      >
        <p>Are you sure you want to skip the tour? You can always access it later from settings.</p>
      </Modal>
    </>
  );
}
