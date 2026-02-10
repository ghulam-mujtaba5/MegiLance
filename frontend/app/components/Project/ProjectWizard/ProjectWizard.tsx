// @AI-HINT: Project creation wizard - guides clients through posting a project. Enhanced with premium animations and 3D elements.
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { 
  FileText, Banknote, Users, CheckCircle,
  ArrowRight, ArrowLeft, Clock,
  Code, Smartphone, Paintbrush, PenLine, Megaphone, TrendingUp, Server, MoreHorizontal
} from 'lucide-react';
import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import Textarea from '@/app/components/Textarea/Textarea';
import Select from '@/app/components/Select/Select';
import TagsInput from '@/app/components/TagsInput/TagsInput';
import FileUpload from '@/app/components/FileUpload/FileUpload';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import ProjectAICopilot from './ProjectAICopilot';
import FeasibilityAnalyzer from '../FeasibilityAnalyzer/FeasibilityAnalyzer';

import commonStyles from './ProjectWizard.common.module.css';
import lightStyles from './ProjectWizard.light.module.css';
import darkStyles from './ProjectWizard.dark.module.css';

interface ProjectData {
  title: string;
  description: string;
  category: string;
  skills: string[];
  budgetMin: string;
  budgetMax: string;
  budgetType: 'fixed' | 'hourly';
  experienceLevel: string;
  duration: string;
  attachments: string[];
}

const steps = [
  { id: 1, title: 'Project Details', icon: FileText },
  { id: 2, title: 'Budget & Timeline', icon: Banknote },
  { id: 3, title: 'Skills Required', icon: Users },
  { id: 4, title: 'Review & Post', icon: CheckCircle },
];

const categories = [
  { value: 'WEB_DEVELOPMENT', label: 'Web Development', icon: Code },
  { value: 'MOBILE_DEVELOPMENT', label: 'Mobile Development', icon: Smartphone },
  { value: 'DESIGN', label: 'Design & Creative', icon: Paintbrush },
  { value: 'WRITING', label: 'Writing & Content', icon: PenLine },
  { value: 'MARKETING', label: 'Marketing & Sales', icon: Megaphone },
  { value: 'DATA_SCIENCE', label: 'Data Science & Analytics', icon: TrendingUp },
  { value: 'DEVOPS', label: 'DevOps & Cloud', icon: Server },
  { value: 'OTHER', label: 'Other', icon: MoreHorizontal },
];

const ProjectWizard: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [projectData, setProjectData] = useState<ProjectData>({
    title: '',
    description: '',
    category: '',
    skills: [],
    budgetMin: '',
    budgetMax: '',
    budgetType: 'fixed',
    experienceLevel: '',
    duration: '',
    attachments: [],
  });

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const styles = {
    container: cn(commonStyles.container, themeStyles.container),
    header: cn(commonStyles.header, themeStyles.header),
    title: cn(commonStyles.title, themeStyles.title),
    subtitle: cn(commonStyles.subtitle, themeStyles.subtitle),
    progressBar: cn(commonStyles.progressBar, themeStyles.progressBar),
    progressFill: cn(commonStyles.progressFill, themeStyles.progressFill),
    stepsIndicator: cn(commonStyles.stepsIndicator, themeStyles.stepsIndicator),
    step: cn(commonStyles.step, themeStyles.step),
    stepActive: cn(commonStyles.stepActive, themeStyles.stepActive),
    stepCompleted: cn(commonStyles.stepCompleted, themeStyles.stepCompleted),
    stepIcon: cn(commonStyles.stepIcon, themeStyles.stepIcon),
    stepTitle: cn(commonStyles.stepTitle, themeStyles.stepTitle),
    content: cn(commonStyles.content, themeStyles.content),
    formGrid: cn(commonStyles.formGrid, themeStyles.formGrid),
    actions: cn(commonStyles.actions, themeStyles.actions),
    budgetToggle: cn(commonStyles.budgetToggle, themeStyles.budgetToggle),
    budgetOption: cn(commonStyles.budgetOption, themeStyles.budgetOption),
    budgetOptionActive: cn(commonStyles.budgetOptionActive, themeStyles.budgetOptionActive),
    reviewSection: cn(commonStyles.reviewSection, themeStyles.reviewSection),
    reviewItem: cn(commonStyles.reviewItem, themeStyles.reviewItem),
    reviewLabel: cn(commonStyles.reviewLabel, themeStyles.reviewLabel),
    reviewValue: cn(commonStyles.reviewValue, themeStyles.reviewValue),
    backgroundOverlay: commonStyles.backgroundOverlay,
    orbTopRight: commonStyles.orbTopRight,
    orbBottomLeft: commonStyles.orbBottomLeft,
    particlesLayer: commonStyles.particlesLayer,
    floatingCubeWrapper: commonStyles.floatingCubeWrapper,
    floatingSphereWrapper: commonStyles.floatingSphereWrapper,
    fullWidth: commonStyles.fullWidth,
    fullWidthSpaced: commonStyles.fullWidthSpaced,
    budgetLabel: commonStyles.budgetLabel,
    inlineIcon: commonStyles.inlineIcon,
    trailingIcon: commonStyles.trailingIcon,
    reviewTitle: cn(commonStyles.reviewTitle, themeStyles.reviewTitle),
    errorMessage: cn(commonStyles.errorMessage, themeStyles.errorMessage),
  };

  const progress = (currentStep / steps.length) * 100;

  const getDurationDays = (duration: string): number => {
    switch (duration) {
      case 'less-than-week': return 5;
      case '1-2-weeks': return 10;
      case '2-4-weeks': return 20;
      case '1-3-months': return 60;
      case '3-6-months': return 120;
      case 'more-than-6-months': return 180;
      default: return 30;
    }
  };

  const handleAIApply = (data: any) => {
    setProjectData(prev => ({
      ...prev,
      title: data.title || prev.title,
      description: data.description || prev.description,
      skills: data.skills || prev.skills,
      category: data.category || prev.category,
      budgetMin: data.budgetMin || prev.budgetMin,
      budgetMax: data.budgetMax || prev.budgetMax,
    }));
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (currentStep) {
      case 1: // Project Details
        if (!projectData.title || projectData.title.length < 10) {
          newErrors.title = 'Title must be at least 10 characters';
        }
        if (!projectData.description || projectData.description.length < 100) {
          newErrors.description = 'Description must be at least 100 characters';
        }
        if (!projectData.category) {
          newErrors.category = 'Please select a category';
        }
        break;
      
      case 2: // Budget & Timeline
        if (!projectData.budgetMin || parseFloat(projectData.budgetMin) <= 0) {
          newErrors.budgetMin = 'Budget minimum must be greater than 0';
        }
        if (!projectData.budgetMax || parseFloat(projectData.budgetMax) <= 0) {
          newErrors.budgetMax = 'Budget maximum must be greater than 0';
        }
        if (parseFloat(projectData.budgetMin) > parseFloat(projectData.budgetMax)) {
          newErrors.budgetMax = 'Maximum must be greater than minimum';
        }
        if (!projectData.duration) {
          newErrors.duration = 'Please select project duration';
        }
        break;
      
      case 3: // Skills
        if (projectData.skills.length === 0) {
          newErrors.skills = 'Add at least 2 required skills';
        }
        if (!projectData.experienceLevel) {
          newErrors.experienceLevel = 'Select required experience level';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const project: any = await (api.projects as any).create?.({
        title: projectData.title,
        description: projectData.description,
        category: projectData.category,
        skills: projectData.skills,
        budget_min: parseFloat(projectData.budgetMin),
        budget_max: parseFloat(projectData.budgetMax),
        budget_type: projectData.budgetType,
        experience_level: projectData.experienceLevel,
        estimated_duration: projectData.duration,
        attachments: projectData.attachments,
        status: 'OPEN',
      });

      router.push(`/dashboard/projects?new=${project.id}`);
    } catch (error: any) {
      setErrors({ general: error.message || 'Failed to create project' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className={styles.container}>
        {/* Background Elements */}
        <div className={styles.backgroundOverlay}>
           <AnimatedOrb variant="blue" size={400} blur={80} opacity={0.15} className={styles.orbTopRight} />
           <AnimatedOrb variant="purple" size={300} blur={60} opacity={0.1} className={styles.orbBottomLeft} />
           <ParticlesSystem count={15} className={styles.particlesLayer} />
           <div className={styles.floatingCubeWrapper}>
             <FloatingCube size={40} />
           </div>
           <div className={styles.floatingSphereWrapper}>
             <FloatingSphere size={30} variant="gradient" />
           </div>
        </div>

        <ScrollReveal>
          <div className={styles.header}>
            <h1 className={styles.title}>Post a Project</h1>
            <p className={styles.subtitle}>
              Tell us about your project and find the perfect freelancer
            </p>
          </div>
        </ScrollReveal>

        {/* Progress Bar */}
        <ScrollReveal delay={0.1}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>

          {/* Steps Indicator */}
          <div className={styles.stepsIndicator}>
            {steps.map((step) => (
              <div
                key={step.id}
                className={cn(
                  styles.step,
                  currentStep === step.id && styles.stepActive,
                  currentStep > step.id && styles.stepCompleted
                )}
              >
                <div className={styles.stepIcon}>
                  {currentStep > step.id ? (
                    <CheckCircle size={24} />
                  ) : (
                    <step.icon size={24} />
                  )}
                </div>
                <div className={styles.stepTitle}>{step.title}</div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Step Content */}
        <StaggerContainer className={styles.content} key={currentStep}>
          {currentStep === 1 && (
            <div className={styles.formGrid}>
              <StaggerItem className={styles.fullWidth}>
                <Input
                  name="title"
                  label="Project Title"
                  placeholder="e.g., Build a responsive e-commerce website"
                  value={projectData.title}
                  onChange={(e) => setProjectData({ ...projectData, title: e.target.value })}
                  error={errors.title}
                  helpText={`${projectData.title.length} characters (minimum 10)`}
                />
              </StaggerItem>
              <StaggerItem className={styles.fullWidth}>
                <Textarea
                  name="description"
                  label="Project Description"
                  placeholder="Describe your project in detail. What needs to be done? What are your requirements? What is the expected outcome?"
                  value={projectData.description}
                  onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                  error={errors.description}
                  rows={8}
                  helpText={`${projectData.description.length}/1000 characters (minimum 100)`}
                />
              </StaggerItem>
              <StaggerItem className={styles.fullWidth}>
                <Select
                  id="category"
                  label="Project Category"
                  value={projectData.category}
                  onChange={(e) => setProjectData({ ...projectData, category: e.target.value })}
                  options={categories}
                />
              </StaggerItem>
              <StaggerItem className={styles.fullWidth}>
                <FileUpload
                  label="Attachments (Optional)"
                  accept="image/*,.pdf,.doc,.docx"
                  maxSize={10}
                  uploadType="document"
                  onUploadComplete={(url) => setProjectData({ 
                    ...projectData, 
                    attachments: [...projectData.attachments, url] 
                  })}
                />
              </StaggerItem>
            </div>
          )}

          {currentStep === 2 && (
            <div className={styles.formGrid}>
              <StaggerItem className={styles.fullWidth}>
                <label className={styles.budgetLabel}>Budget Type</label>
                <div className={styles.budgetToggle}>
                  <button
                    type="button"
                    className={cn(
                      styles.budgetOption,
                      projectData.budgetType === 'fixed' && styles.budgetOptionActive
                    )}
                    onClick={() => setProjectData({ ...projectData, budgetType: 'fixed' })}
                  >
                    <Banknote className={styles.inlineIcon} size={16} />
                    Fixed Price
                  </button>
                  <button
                    type="button"
                    className={cn(
                      styles.budgetOption,
                      projectData.budgetType === 'hourly' && styles.budgetOptionActive
                    )}
                    onClick={() => setProjectData({ ...projectData, budgetType: 'hourly' })}
                  >
                    <Clock className={styles.inlineIcon} size={16} />
                    Hourly Rate
                  </button>
                </div>
              </StaggerItem>
              <StaggerItem>
                <Input
                  name="budgetMin"
                  type="number"
                  label={`Minimum ${projectData.budgetType === 'hourly' ? 'Hourly Rate' : 'Budget'} (PKR)`}
                  placeholder="10000"
                  value={projectData.budgetMin}
                  onChange={(e) => setProjectData({ ...projectData, budgetMin: e.target.value })}
                  error={errors.budgetMin}
                />
              </StaggerItem>
              <StaggerItem>
                <Input
                  name="budgetMax"
                  type="number"
                  label={`Maximum ${projectData.budgetType === 'hourly' ? 'Hourly Rate' : 'Budget'} (PKR)`}
                  placeholder="50000"
                  value={projectData.budgetMax}
                  onChange={(e) => setProjectData({ ...projectData, budgetMax: e.target.value })}
                  error={errors.budgetMax}
                />
              </StaggerItem>
              <StaggerItem className={styles.fullWidth}>
                  value={projectData.duration}
                  onChange={(e) => setProjectData({ ...projectData, duration: e.target.value })}
                  options={[
                    { value: '', label: 'Select duration' },
                    { value: 'less-than-week', label: 'Less than 1 week' },
                    { value: '1-2-weeks', label: '1-2 weeks' },
                    { value: '2-4-weeks', label: '2-4 weeks' },
                    { value: '1-3-months', label: '1-3 months' },
                    { value: '3-6-months', label: '3-6 months' },
                    { value: 'more-than-6-months', label: 'More than 6 months' },
                  ]}
                />
              </StaggerItem>

              <StaggerItem className={styles.fullWidthSpaced}>
                 <FeasibilityAnalyzer 
                    projectDescription={projectData.description}
                    budgetMin={parseFloat(projectData.budgetMin) || 0}
                    budgetMax={parseFloat(projectData.budgetMax) || 0}
                    timelineDays={getDurationDays(projectData.duration)}
                 />
              </StaggerItem>
            </div>
          )}

          {currentStep === 3 && (
            <div className={styles.formGrid}>
              <StaggerItem className={styles.fullWidth}>
                <TagsInput
                  id="skills"
                  label="Required Skills (Add at least 2)"
                  placeholder="e.g., React, Node.js, MongoDB"
                  tags={projectData.skills}
                  onTagsChange={(skills) => setProjectData({ ...projectData, skills })}
                  error={errors.skills}
                />
              </StaggerItem>
              <StaggerItem className={styles.fullWidth}>
                <Select
                  id="experienceLevel"
                  label="Experience Level Required"
                  value={projectData.experienceLevel}
                  onChange={(e) => setProjectData({ ...projectData, experienceLevel: e.target.value })}
                  options={[
                    { value: '', label: 'Select level' },
                    { value: 'ENTRY', label: 'Entry Level - New freelancers welcome' },
                    { value: 'INTERMEDIATE', label: 'Intermediate - Some experience needed' },
                    { value: 'EXPERT', label: 'Expert - Only experienced professionals' },
                  ]}
                />
              </StaggerItem>
            </div>
          )}

          {currentStep === 4 && (
            <div className={styles.reviewSection}>
              <StaggerItem>
                <h3 className={styles.reviewTitle}>Review Your Project</h3>
              </StaggerItem>
              
              <StaggerItem className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Title:</span>
                <span className={styles.reviewValue}>{projectData.title}</span>
              </StaggerItem>
              
              <StaggerItem className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Description:</span>
                <span className={styles.reviewValue}>{projectData.description}</span>
              </StaggerItem>
              
              <StaggerItem className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Category:</span>
                <span className={styles.reviewValue}>
                  {categories.find(c => c.value === projectData.category)?.label}
                </span>
              </StaggerItem>
              
              <StaggerItem className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Budget:</span>
                <span className={styles.reviewValue}>
                  PKR {projectData.budgetMin} - {projectData.budgetMax} ({projectData.budgetType})
                </span>
              </StaggerItem>
              
              <StaggerItem className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Duration:</span>
                <span className={styles.reviewValue}>{projectData.duration}</span>
              </StaggerItem>
              
              <StaggerItem className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Required Skills:</span>
                <span className={styles.reviewValue}>{projectData.skills.join(', ')}</span>
              </StaggerItem>
              
              <StaggerItem className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Experience Level:</span>
                <span className={styles.reviewValue}>{projectData.experienceLevel}</span>
              </StaggerItem>
            </div>
          )}

          {errors.general && (
            <StaggerItem className={styles.errorMessage}>{errors.general}</StaggerItem>
          )}
        </StaggerContainer>

        {/* Actions */}
        <div className={styles.actions}>
          {currentStep > 1 && (
            <Button
              variant="secondary"
              onClick={handleBack}
              disabled={loading}
            >
              <ArrowLeft className={styles.inlineIcon} size={16} />
              Back
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleNext}
            isLoading={loading}
            disabled={loading}
          >
            {currentStep < steps.length ? (
              <>
                Next
                <ArrowRight className={styles.trailingIcon} size={16} />
              </>
            ) : (
              <>
                Post Project
                <CheckCircle className={styles.trailingIcon} size={16} />
              </>
            )}
          </Button>
        </div>
      </div>
    </PageTransition>
  );
};

export default ProjectWizard;
