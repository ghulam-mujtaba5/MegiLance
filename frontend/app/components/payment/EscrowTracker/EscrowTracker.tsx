// @AI-HINT: Escrow payment tracker - visualizes payment stages and milestones
'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { 
  FaCheckCircle, FaClock, FaLock, FaUnlock,
  FaExclamationTriangle, FaDownload 
} from 'react-icons/fa';
import Button from '@/app/components/Button/Button';

import commonStyles from './EscrowTracker.common.module.css';
import lightStyles from './EscrowTracker.light.module.css';
import darkStyles from './EscrowTracker.dark.module.css';

interface Milestone {
  id: number;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'paid' | 'disputed';
  submittedDate?: string;
  approvedDate?: string;
  paidDate?: string;
}

interface EscrowTrackerProps {
  contractId: number;
  totalAmount: number;
  milestones: Milestone[];
  userRole: 'client' | 'freelancer';
  onReleaseFunds?: (milestoneId: number) => void;
  onDispute?: (milestoneId: number) => void;
  onDownloadInvoice?: (milestoneId: number) => void;
}

const EscrowTracker: React.FC<EscrowTrackerProps> = ({
  contractId,
  totalAmount,
  milestones,
  userRole,
  onReleaseFunds,
  onDispute,
  onDownloadInvoice
}) => {
  const { resolvedTheme } = useTheme();
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const styles = {
    container: cn(commonStyles.container, themeStyles.container),
    header: cn(commonStyles.header, themeStyles.header),
    title: cn(commonStyles.title, themeStyles.title),
    summary: cn(commonStyles.summary, themeStyles.summary),
    summaryItem: cn(commonStyles.summaryItem, themeStyles.summaryItem),
    timeline: cn(commonStyles.timeline, themeStyles.timeline),
    milestone: cn(commonStyles.milestone, themeStyles.milestone),
    milestoneActive: cn(commonStyles.milestoneActive, themeStyles.milestoneActive),
    milestoneIcon: cn(commonStyles.milestoneIcon, themeStyles.milestoneIcon),
    milestoneContent: cn(commonStyles.milestoneContent, themeStyles.milestoneContent),
    milestoneHeader: cn(commonStyles.milestoneHeader, themeStyles.milestoneHeader),
    milestoneTitle: cn(commonStyles.milestoneTitle, themeStyles.milestoneTitle),
    milestoneStatus: cn(commonStyles.milestoneStatus, themeStyles.milestoneStatus),
    milestoneDetails: cn(commonStyles.milestoneDetails, themeStyles.milestoneDetails),
    milestoneActions: cn(commonStyles.milestoneActions, themeStyles.milestoneActions),
    statusBadge: cn(commonStyles.statusBadge, themeStyles.statusBadge),
  };

  const getStatusIcon = (status: Milestone['status']) => {
    switch (status) {
      case 'pending':
        return <FaClock />;
      case 'in_progress':
        return <FaClock className="text-blue-500" />;
      case 'submitted':
        return <FaLock className="text-yellow-500" />;
      case 'approved':
        return <FaUnlock className="text-green-500" />;
      case 'paid':
        return <FaCheckCircle className="text-green-500" />;
      case 'disputed':
        return <FaExclamationTriangle className="text-red-500" />;
      default:
        return <FaClock />;
    }
  };

  const getStatusColor = (status: Milestone['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-700';
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'disputed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const calculateProgress = () => {
    const paidAmount = milestones
      .filter(m => m.status === 'paid')
      .reduce((sum, m) => sum + m.amount, 0);
    return (paidAmount / totalAmount) * 100;
  };

  const formatCurrency = (amount: number) => {
    return `PKR ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Escrow Payment Tracker</h2>
        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className="label">Total Contract Value</span>
            <span className="value">{formatCurrency(totalAmount)}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className="label">Paid</span>
            <span className="value text-green-600">
              {formatCurrency(milestones.filter(m => m.status === 'paid').reduce((sum, m) => sum + m.amount, 0))}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className="label">Remaining</span>
            <span className="value">
              {formatCurrency(milestones.filter(m => m.status !== 'paid').reduce((sum, m) => sum + m.amount, 0))}
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
          <div 
            className="bg-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${calculateProgress()}%` }}
          />
        </div>
        <p className="text-sm text-center mt-2">{calculateProgress().toFixed(0)}% Complete</p>
      </div>

      <div className={styles.timeline}>
        {milestones.map((milestone, index) => (
          <div
            key={milestone.id}
            className={cn(
              styles.milestone,
              selectedMilestone === milestone.id && styles.milestoneActive
            )}
            onClick={() => setSelectedMilestone(milestone.id)}
          >
            <div className={styles.milestoneIcon}>
              {getStatusIcon(milestone.status)}
            </div>

            <div className={styles.milestoneContent}>
              <div className={styles.milestoneHeader}>
                <h3 className={styles.milestoneTitle}>
                  Milestone {index + 1}: {milestone.description}
                </h3>
                <span className={cn(styles.statusBadge, getStatusColor(milestone.status))}>
                  {milestone.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className={styles.milestoneDetails}>
                <div>
                  <strong>Amount:</strong> {formatCurrency(milestone.amount)}
                </div>
                <div>
                  <strong>Due Date:</strong> {formatDate(milestone.dueDate)}
                </div>
                {milestone.submittedDate && (
                  <div>
                    <strong>Submitted:</strong> {formatDate(milestone.submittedDate)}
                  </div>
                )}
                {milestone.paidDate && (
                  <div>
                    <strong>Paid:</strong> {formatDate(milestone.paidDate)}
                  </div>
                )}
              </div>

              {selectedMilestone === milestone.id && (
                <div className={styles.milestoneActions}>
                  {userRole === 'client' && milestone.status === 'submitted' && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => onReleaseFunds?.(milestone.id)}
                    >
                      <FaUnlock className="mr-2" />
                      Release Funds
                    </Button>
                  )}

                  {userRole === 'freelancer' && milestone.status === 'approved' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onDispute?.(milestone.id)}
                    >
                      <FaExclamationTriangle className="mr-2" />
                      Request Payment
                    </Button>
                  )}

                  {milestone.status === 'paid' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onDownloadInvoice?.(milestone.id)}
                    >
                      <FaDownload className="mr-2" />
                      Download Invoice
                    </Button>
                  )}

                  {(userRole === 'client' || userRole === 'freelancer') && 
                   milestone.status !== 'paid' && 
                   milestone.status !== 'disputed' && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onDispute?.(milestone.id)}
                    >
                      <FaExclamationTriangle className="mr-2" />
                      Raise Dispute
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EscrowTracker;
