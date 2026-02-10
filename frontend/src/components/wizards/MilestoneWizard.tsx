// @AI-HINT: Milestone creation wizard for breaking projects into trackable deliverables
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import WizardContainer from '@/app/components/Wizard/WizardContainer/WizardContainer';
import Modal from '@/app/components/Modal/Modal';
import commonStyles from './MilestoneWizard.common.module.css';
import lightStyles from './MilestoneWizard.light.module.css';
import darkStyles from './MilestoneWizard.dark.module.css';
import {
  CheckCircle,
  DollarSign,
  Calendar,
  Info,
  AlertTriangle
} from 'lucide-react';

type AmountType = 'fixed' | 'percentage';

interface AcceptanceCriterion {
  id: string;
  description: string;
}

interface MilestoneData {
  // Step 1: Details
  title: string;
  description: string;
  
  // Step 2: Amount & Date
  amountType: AmountType;
  amount: number;
  percentage?: number;
  dueDate: string;
  estimatedHours?: number;
  
  // Step 3: Acceptance Criteria
  acceptanceCriteria: AcceptanceCriterion[];
  requiresApproval: boolean;
  autoRelease: boolean;
  autoReleaseDays?: number;
}

interface MilestoneWizardProps {
  projectId: string;
  projectName: string;
  contractValue?: number;
  existingMilestones?: number;
  userId: string;
  onComplete?: (milestoneId: string) => void;
}

export default function MilestoneWizard({
  projectId,
  projectName,
  contractValue = 0,
  existingMilestones = 0,
  userId,
  onComplete
}: MilestoneWizardProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [milestoneData, setMilestoneData] = useState<MilestoneData>({
    title: '',
    description: '',
    amountType: 'percentage',
    amount: 0,
    percentage: 25,
    dueDate: '',
    acceptanceCriteria: [
      { id: '1', description: '' }
    ],
    requiresApproval: true,
    autoRelease: false
  });

  useEffect(() => {
    const draft = localStorage.getItem(`milestone_draft_${projectId}`);
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        setMilestoneData(parsedDraft);
      } catch (error) {
        console.error('Failed to parse draft:', error);
      }
    }
  }, [projectId]);

  const saveDraft = () => {
    localStorage.setItem(`milestone_draft_${projectId}`, JSON.stringify(milestoneData));
  };

  // Calculate amount based on type
  const calculateAmount = () => {
    if (milestoneData.amountType === 'percentage') {
      return contractValue * ((milestoneData.percentage || 0) / 100);
    }
    return milestoneData.amount;
  };

  // Add acceptance criterion
  const addCriterion = () => {
    const newCriterion: AcceptanceCriterion = {
      id: Date.now().toString(),
      description: ''
    };
    setMilestoneData({
      ...milestoneData,
      acceptanceCriteria: [...milestoneData.acceptanceCriteria, newCriterion]
    });
  };

  // Update criterion
  const updateCriterion = (id: string, description: string) => {
    setMilestoneData({
      ...milestoneData,
      acceptanceCriteria: milestoneData.acceptanceCriteria.map(c =>
        c.id === id ? { ...c, description } : c
      )
    });
  };

  // Remove criterion
  const removeCriterion = (id: string) => {
    if (milestoneData.acceptanceCriteria.length > 1) {
      setMilestoneData({
        ...milestoneData,
        acceptanceCriteria: milestoneData.acceptanceCriteria.filter(c => c.id !== id)
      });
    }
  };

  // STEP 1: Milestone Details
  const Step1Details = () => (
    <div className={commonStyles.stepContent}>
      <div className={commonStyles.projectInfo}>
        <CheckCircle className={commonStyles.icon} size={16} />
        <div>
          <div className={commonStyles.label}>Project:</div>
          <div className={commonStyles.value}>{projectName}</div>
        </div>
        <div>
          <div className={commonStyles.label}>Contract Value:</div>
          <div className={commonStyles.value}>${contractValue.toFixed(2)}</div>
        </div>
        <div>
          <div className={commonStyles.label}>Existing Milestones:</div>
          <div className={commonStyles.value}>{existingMilestones}</div>
        </div>
      </div>

      <div className={commonStyles.formGroup}>
        <label htmlFor="title">Milestone Title *</label>
        <input
          type="text"
          id="title"
          value={milestoneData.title}
          onChange={(e) => setMilestoneData({ ...milestoneData, title: e.target.value })}
          placeholder="e.g., Design Mockups, Frontend Development, Testing Phase"
          maxLength={100}
        />
        <small>{milestoneData.title.length}/100 characters</small>
      </div>

      <div className={commonStyles.formGroup}>
        <label htmlFor="description">Description *</label>
        <textarea
          id="description"
          value={milestoneData.description}
          onChange={(e) => setMilestoneData({ ...milestoneData, description: e.target.value })}
          placeholder="Describe what deliverables are included in this milestone..."
          rows={6}
          minLength={50}
        />
        <small>{milestoneData.description.length} characters (minimum 50)</small>
      </div>

      <div className={cn(commonStyles.tipBox, themeStyles.tipBox)}>
        <Info size={16} />
        <p><strong>💡 Tip:</strong> Be specific about deliverables. Clear milestones prevent disputes and ensure both parties are aligned on expectations.</p>
      </div>
    </div>
  );

  // STEP 2: Amount & Date
  const Step2AmountDate = () => (
    <div className={commonStyles.stepContent}>
      <div className={commonStyles.formGroup}>
        <label>Amount Type</label>
        <div className={commonStyles.amountTypeSelector}>
          <button
            type="button"
            className={cn(
              commonStyles.typeButton,
              themeStyles.typeButton,
              milestoneData.amountType === 'percentage' && commonStyles.typeButtonActive,
              milestoneData.amountType === 'percentage' && themeStyles.typeButtonActive
            )}
            onClick={() => setMilestoneData({ ...milestoneData, amountType: 'percentage' })}
          >
            Percentage
          </button>
          <button
            type="button"
            className={cn(
              commonStyles.typeButton,
              themeStyles.typeButton,
              milestoneData.amountType === 'fixed' && commonStyles.typeButtonActive,
              milestoneData.amountType === 'fixed' && themeStyles.typeButtonActive
            )}
            onClick={() => setMilestoneData({ ...milestoneData, amountType: 'fixed' })}
          >
            Fixed Amount
          </button>
        </div>
      </div>

      {milestoneData.amountType === 'percentage' ? (
        <div className={commonStyles.formGroup}>
          <label htmlFor="percentage">Percentage of Contract Value *</label>
          <div className={commonStyles.percentageInput}>
            <input
              type="range"
              id="percentage"
              min="1"
              max="100"
              value={milestoneData.percentage || 25}
              onChange={(e) => setMilestoneData({ ...milestoneData, percentage: parseInt(e.target.value) })}
              className={commonStyles.slider}
            />
            <div className={commonStyles.percentageValue}>
              {milestoneData.percentage}%
            </div>
          </div>
          <div className={cn(commonStyles.calculatedAmount, themeStyles.calculatedAmount)}>
            <DollarSign size={16} />
            <span>Calculated Amount: ${calculateAmount().toFixed(2)}</span>
          </div>
        </div>
      ) : (
        <div className={commonStyles.formGroup}>
          <label htmlFor="amount">Fixed Amount *</label>
          <div className={commonStyles.amountInput}>
            <span className={commonStyles.currencySymbol}>$</span>
            <input
              type="number"
              id="amount"
              value={milestoneData.amount || ''}
              onChange={(e) => setMilestoneData({ ...milestoneData, amount: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              step="0.01"
              min="0"
              max={contractValue}
            />
          </div>
          {milestoneData.amount > contractValue && (
            <small className={commonStyles.error}>Amount cannot exceed contract value (${contractValue.toFixed(2)})</small>
          )}
        </div>
      )}

      <div className={commonStyles.formRow}>
        <div className={commonStyles.formGroup}>
          <label htmlFor="dueDate">Due Date *</label>
          <div className={commonStyles.dateInput}>
            <Calendar className={commonStyles.dateIcon} size={16} />
            <input
              type="date"
              id="dueDate"
              value={milestoneData.dueDate}
              onChange={(e) => setMilestoneData({ ...milestoneData, dueDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div className={commonStyles.formGroup}>
          <label htmlFor="estimatedHours">Est. Hours (Optional)</label>
          <input
            type="number"
            id="estimatedHours"
            value={milestoneData.estimatedHours || ''}
            onChange={(e) => setMilestoneData({ ...milestoneData, estimatedHours: parseInt(e.target.value) || undefined })}
            placeholder="0"
            min="1"
          />
        </div>
      </div>

      <div className={cn(commonStyles.summaryCard, themeStyles.summaryCard)}>
        <h4>Milestone Summary</h4>
        <div className={commonStyles.summaryRow}>
          <span>Amount:</span>
          <strong>${calculateAmount().toFixed(2)}</strong>
        </div>
        <div className={commonStyles.summaryRow}>
          <span>Due Date:</span>
          <strong>{milestoneData.dueDate || 'Not set'}</strong>
        </div>
        {milestoneData.estimatedHours && (
          <div className={commonStyles.summaryRow}>
            <span>Estimated Hours:</span>
            <strong>{milestoneData.estimatedHours}h</strong>
          </div>
        )}
      </div>
    </div>
  );

  // STEP 3: Acceptance Criteria
  const Step3Criteria = () => (
    <div className={commonStyles.stepContent}>
      <div className={cn(commonStyles.infoBox, themeStyles.infoBox)}>
        <Info size={16} />
        <p>Acceptance criteria define what must be completed for this milestone to be approved. Be specific and measurable.</p>
      </div>

      <div className={commonStyles.criteriaSection}>
        <div className={commonStyles.criteriaHeader}>
          <h4>Acceptance Criteria</h4>
          <button
            type="button"
            onClick={addCriterion}
            className={cn(commonStyles.addButton, themeStyles.addButton)}
          >
            + Add Criterion
          </button>
        </div>

        {milestoneData.acceptanceCriteria.map((criterion, index) => (
          <div key={criterion.id} className={cn(commonStyles.criterionItem, themeStyles.criterionItem)}>
            <div className={commonStyles.criterionNumber}>{index + 1}</div>
            <input
              type="text"
              value={criterion.description}
              onChange={(e) => updateCriterion(criterion.id, e.target.value)}
              placeholder="Describe a specific, measurable requirement..."
              className={cn(commonStyles.criterionInput, themeStyles.criterionInput)}
              aria-label={`Acceptance criterion ${index + 1}`}
            />
            {milestoneData.acceptanceCriteria.length > 1 && (
              <button
                type="button"
                onClick={() => removeCriterion(criterion.id)}
                className={commonStyles.removeButton}
                aria-label="Remove acceptance criterion"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <div className={commonStyles.settingsSection}>
        <h4>Approval Settings</h4>
        
        <label className={commonStyles.checkboxLabel}>
          <input
            type="checkbox"
            checked={milestoneData.requiresApproval}
            onChange={(e) => setMilestoneData({ ...milestoneData, requiresApproval: e.target.checked })}
          />
          <div>
            <strong>Requires Approval</strong>
            <p>Client must explicitly approve before payment is released</p>
          </div>
        </label>

        <label className={commonStyles.checkboxLabel}>
          <input
            type="checkbox"
            checked={milestoneData.autoRelease}
            onChange={(e) => setMilestoneData({ ...milestoneData, autoRelease: e.target.checked })}
          />
          <div>
            <strong>Auto-Release Payment</strong>
            <p>Automatically release payment if client doesn&apos;t respond</p>
          </div>
        </label>

        {milestoneData.autoRelease && (
          <div className={cn(commonStyles.autoReleaseInput, themeStyles.autoReleaseInput)}>
            <label htmlFor="autoReleaseDays">Days before auto-release:</label>
            <select
              id="autoReleaseDays"
              value={milestoneData.autoReleaseDays || 7}
              onChange={(e) => setMilestoneData({ ...milestoneData, autoReleaseDays: parseInt(e.target.value) })}
            >
              <option value="3">3 days</option>
              <option value="5">5 days</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );

  // STEP 4: Review
  const Step4Review = () => (
    <div className={commonStyles.stepContent}>
      <div className={cn(commonStyles.reviewCard, themeStyles.reviewCard)}>
        <h3>Review Milestone</h3>

        <div className={commonStyles.reviewSection}>
          <h4>Details</h4>
          <div className={commonStyles.reviewRow}>
            <span className={commonStyles.reviewLabel}>Title:</span>
            <span className={commonStyles.reviewValue}>{milestoneData.title}</span>
          </div>
          <div className={commonStyles.reviewRow}>
            <span className={commonStyles.reviewLabel}>Description:</span>
            <span className={commonStyles.reviewValue}>{milestoneData.description}</span>
          </div>
        </div>

        <div className={commonStyles.reviewSection}>
          <h4>Payment & Timeline</h4>
          <div className={commonStyles.reviewRow}>
            <span className={commonStyles.reviewLabel}>Amount:</span>
            <span className={cn(commonStyles.reviewValue, commonStyles.highlightAmount)}>
              ${calculateAmount().toFixed(2)}
              {milestoneData.amountType === 'percentage' && ` (${milestoneData.percentage}% of contract)`}
            </span>
          </div>
          <div className={commonStyles.reviewRow}>
            <span className={commonStyles.reviewLabel}>Due Date:</span>
            <span className={commonStyles.reviewValue}>{milestoneData.dueDate}</span>
          </div>
          {milestoneData.estimatedHours && (
            <div className={commonStyles.reviewRow}>
              <span className={commonStyles.reviewLabel}>Est. Hours:</span>
              <span className={commonStyles.reviewValue}>{milestoneData.estimatedHours}h</span>
            </div>
          )}
        </div>

        <div className={commonStyles.reviewSection}>
          <h4>Acceptance Criteria ({milestoneData.acceptanceCriteria.filter(c => c.description).length})</h4>
          <ul className={commonStyles.criteriaList}>
            {milestoneData.acceptanceCriteria
              .filter(c => c.description)
              .map((criterion, index) => (
                <li key={criterion.id}>
                  <CheckCircle size={16} /> {criterion.description}
                </li>
              ))}
          </ul>
        </div>

        <div className={commonStyles.reviewSection}>
          <h4>Settings</h4>
          <div className={commonStyles.settingsGrid}>
            <div className={cn(commonStyles.settingBadge, milestoneData.requiresApproval && themeStyles.settingBadgeActive)}>
              {milestoneData.requiresApproval ? '✓' : '×'} Requires Approval
            </div>
            <div className={cn(commonStyles.settingBadge, milestoneData.autoRelease && themeStyles.settingBadgeActive)}>
              {milestoneData.autoRelease ? '✓' : '×'} Auto-Release ({milestoneData.autoReleaseDays || 7} days)
            </div>
          </div>
        </div>
      </div>

      <div className={cn(commonStyles.warningBox, themeStyles.warningBox)}>
        <AlertTriangle size={16} />
        <p><strong>Important:</strong> Once created, milestone amount and due date can only be modified with mutual agreement from both parties.</p>
      </div>
    </div>
  );

  // Validation
  const validateStep1 = async () => {
    if (!milestoneData.title || milestoneData.title.trim().length < 5) {
      showToast('Please enter a title (at least 5 characters)');
      return false;
    }
    if (!milestoneData.description || milestoneData.description.trim().length < 50) {
      showToast('Please enter a description (at least 50 characters)');
      return false;
    }
    return true;
  };

  const validateStep2 = async () => {
    const amount = calculateAmount();
    if (amount <= 0) {
      showToast('Milestone amount must be greater than $0');
      return false;
    }
    if (amount > contractValue) {
      showToast('Milestone amount cannot exceed contract value');
      return false;
    }
    if (!milestoneData.dueDate) {
      showToast('Please select a due date');
      return false;
    }
    return true;
  };

  const validateStep3 = async () => {
    const validCriteria = milestoneData.acceptanceCriteria.filter(c => c.description.trim());
    if (validCriteria.length === 0) {
      showToast('Please add at least one acceptance criterion');
      return false;
    }
    return true;
  };

  // Handle completion
  const handleComplete = async () => {
    setIsSubmitting(true);

    try {
      const payload = {
        project_id: projectId,
        user_id: userId,
        title: milestoneData.title,
        description: milestoneData.description,
        amount: calculateAmount(),
        due_date: milestoneData.dueDate,
        estimated_hours: milestoneData.estimatedHours,
        acceptance_criteria: milestoneData.acceptanceCriteria
          .filter(c => c.description.trim())
          .map(c => c.description),
        requires_approval: milestoneData.requiresApproval,
        auto_release: milestoneData.autoRelease,
        auto_release_days: milestoneData.autoReleaseDays
      };

      const result = await api.milestones.create(payload) as any;

      localStorage.removeItem(`milestone_draft_${projectId}`);
      
      if (onComplete) {
        onComplete(result.id);
      } else {
        router.push(`/projects/${projectId}?tab=milestones`);
      }
    } catch (error) {
      console.error('Error creating milestone:', error);
      showToast('Failed to create milestone. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const steps = [
    {
      id: 'details',
      title: 'Details',
      description: 'Milestone information',
      component: <Step1Details />,
      validate: validateStep1
    },
    {
      id: 'amount',
      title: 'Amount & Date',
      description: 'Payment and deadline',
      component: <Step2AmountDate />,
      validate: validateStep2
    },
    {
      id: 'criteria',
      title: 'Acceptance Criteria',
      description: 'Define requirements',
      component: <Step3Criteria />,
      validate: validateStep3
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Confirm details',
      component: <Step4Review />
    }
  ];

  return (
    <>
      <WizardContainer
        title="Create Milestone"
        subtitle={`Project: ${projectName}`}
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onComplete={handleComplete}
        onCancel={handleCancel}
        isLoading={isSubmitting}
        saveProgress={saveDraft}
      />
      <Modal
        isOpen={showCancelModal}
        title="Cancel Milestone Creation"
        onClose={() => setShowCancelModal(false)}
        footer={
          <>
            <button onClick={() => setShowCancelModal(false)}>Continue Editing</button>
            <button onClick={() => { saveDraft(); setShowCancelModal(false); router.back(); }}>Yes, Cancel</button>
          </>
        }
      >
        <p>Are you sure you want to cancel? Your progress will be saved as a draft.</p>
      </Modal>
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, padding: '12px 24px',
          borderRadius: 8, color: '#fff', zIndex: 9999, fontSize: 14,
          backgroundColor: toast.type === 'success' ? '#27AE60' : '#e81123',
        }}>
          {toast.message}
        </div>
      )}
    </>
  );
}
