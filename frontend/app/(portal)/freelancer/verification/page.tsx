// @AI-HINT: Verification Center - ID verification and trust badges
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './Verification.common.module.css';
import lightStyles from './Verification.light.module.css';
import darkStyles from './Verification.dark.module.css';

interface VerificationItem {
  id: string;
  type: 'identity' | 'email' | 'phone' | 'payment' | 'skills' | 'address';
  name: string;
  description: string;
  status: 'verified' | 'pending' | 'unverified' | 'failed';
  verifiedAt?: string;
  badge?: string;
  required: boolean;
}

interface VerificationTier {
  id: string;
  name: string;
  level: number;
  requirements: string[];
  benefits: string[];
  badgeColor: string;
  achieved: boolean;
}

export default function VerificationPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [tiers, setTiers] = useState<VerificationTier[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<VerificationItem | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchVerificationData();
  }, []);

  const fetchVerificationData = async () => {
    setLoading(true);
    try {
      const mockVerifications: VerificationItem[] = [
        {
          id: 'v1',
          type: 'email',
          name: 'Email Verification',
          description: 'Verify your email address to receive notifications',
          status: 'verified',
          verifiedAt: '2025-01-01T00:00:00Z',
          badge: '✉️',
          required: true
        },
        {
          id: 'v2',
          type: 'phone',
          name: 'Phone Verification',
          description: 'Add SMS authentication for extra security',
          status: 'verified',
          verifiedAt: '2025-01-05T00:00:00Z',
          badge: '📱',
          required: false
        },
        {
          id: 'v3',
          type: 'identity',
          name: 'Identity Verification',
          description: 'Verify your identity with government-issued ID',
          status: 'pending',
          badge: '🪪',
          required: true
        },
        {
          id: 'v4',
          type: 'payment',
          name: 'Payment Method',
          description: 'Add a verified payment method for transactions',
          status: 'verified',
          verifiedAt: '2025-01-10T00:00:00Z',
          badge: '💳',
          required: true
        },
        {
          id: 'v5',
          type: 'skills',
          name: 'Skills Assessment',
          description: 'Pass skill tests to earn verified badges',
          status: 'unverified',
          badge: '🎯',
          required: false
        },
        {
          id: 'v6',
          type: 'address',
          name: 'Address Verification',
          description: 'Verify your business or home address',
          status: 'unverified',
          badge: '📍',
          required: false
        }
      ];

      const mockTiers: VerificationTier[] = [
        {
          id: 'basic',
          name: 'Basic',
          level: 1,
          requirements: ['Email verified'],
          benefits: ['Create profile', 'Browse jobs', 'Send messages'],
          badgeColor: '#94a3b8',
          achieved: true
        },
        {
          id: 'verified',
          name: 'Verified',
          level: 2,
          requirements: ['Email verified', 'Phone verified', 'Payment method added'],
          benefits: ['Submit proposals', 'Priority in search', 'Verified badge'],
          badgeColor: '#3b82f6',
          achieved: true
        },
        {
          id: 'trusted',
          name: 'Trusted',
          level: 3,
          requirements: ['Identity verified', 'Skills assessment passed', '5+ completed jobs'],
          benefits: ['Top search ranking', 'Reduced fees', 'Premium support', 'Trusted badge'],
          badgeColor: '#8b5cf6',
          achieved: false
        },
        {
          id: 'elite',
          name: 'Elite',
          level: 4,
          requirements: ['All verifications complete', '20+ completed jobs', '4.8+ rating'],
          benefits: ['Featured profile', 'Dedicated manager', 'Exclusive opportunities', 'Elite badge'],
          badgeColor: '#f59e0b',
          achieved: false
        }
      ];

      setVerifications(mockVerifications);
      setTiers(mockTiers);
    } catch (error) {
      console.error('Failed to fetch verification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (verification: VerificationItem) => {
    if (verification.type === 'identity' || verification.type === 'address') {
      setSelectedVerification(verification);
      setShowUploadModal(true);
    } else if (verification.type === 'skills') {
      // Redirect to skills assessment
      window.location.href = '/freelancer/assessments';
    }
  };

  const handleUpload = async () => {
    if (!selectedVerification) return;
    
    setUploading(true);
    try {
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setVerifications(prev => prev.map(v => 
        v.id === selectedVerification.id ? { ...v, status: 'pending' as const } : v
      ));
      
      setShowUploadModal(false);
      setSelectedVerification(null);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return '✅';
      case 'pending': return '⏳';
      case 'failed': return '❌';
      default: return '○';
    }
  };

  const verifiedCount = verifications.filter(v => v.status === 'verified').length;
  const totalCount = verifications.length;
  const progressPercent = Math.round((verifiedCount / totalCount) * 100);

  const currentTier = tiers.filter(t => t.achieved).pop();
  const nextTier = tiers.find(t => !t.achieved);

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>Verification Center</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Build trust and unlock more opportunities by verifying your profile
          </p>
        </div>
      </div>

      {loading ? (
        <div className={cn(commonStyles.loading, themeStyles.loading)}>Loading verification status...</div>
      ) : (
        <>
          {/* Progress Overview */}
          <div className={cn(commonStyles.progressCard, themeStyles.progressCard)}>
            <div className={commonStyles.progressHeader}>
              <div>
                <h2 className={cn(commonStyles.progressTitle, themeStyles.progressTitle)}>
                  Verification Progress
                </h2>
                <p className={cn(commonStyles.progressSubtitle, themeStyles.progressSubtitle)}>
                  {verifiedCount} of {totalCount} verifications complete
                </p>
              </div>
              {currentTier && (
                <div className={commonStyles.currentTier}>
                  <span className={cn(commonStyles.tierBadge, themeStyles.tierBadge)} style={{ backgroundColor: currentTier.badgeColor }}>
                    {currentTier.name}
                  </span>
                </div>
              )}
            </div>
            <div className={commonStyles.progressBar}>
              <div 
                className={cn(commonStyles.progressFill, themeStyles.progressFill)} 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {nextTier && (
              <p className={cn(commonStyles.nextTierHint, themeStyles.nextTierHint)}>
                Complete more verifications to reach <strong>{nextTier.name}</strong> tier
              </p>
            )}
          </div>

          {/* Tiers Overview */}
          <div className={cn(commonStyles.tiersSection, themeStyles.tiersSection)}>
            <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Trust Tiers</h3>
            <div className={commonStyles.tiersGrid}>
              {tiers.map((tier, index) => (
                <div 
                  key={tier.id} 
                  className={cn(
                    commonStyles.tierCard, 
                    themeStyles.tierCard,
                    tier.achieved && commonStyles.tierAchieved,
                    tier.achieved && themeStyles.tierAchieved
                  )}
                >
                  <div 
                    className={commonStyles.tierIcon}
                    style={{ backgroundColor: tier.badgeColor }}
                  >
                    {tier.achieved ? '✓' : index + 1}
                  </div>
                  <h4 className={cn(commonStyles.tierName, themeStyles.tierName)}>{tier.name}</h4>
                  <ul className={commonStyles.tierBenefits}>
                    {tier.benefits.slice(0, 2).map((benefit, idx) => (
                      <li key={idx} className={cn(commonStyles.tierBenefit, themeStyles.tierBenefit)}>
                        {benefit}
                      </li>
                    ))}
                    {tier.benefits.length > 2 && (
                      <li className={cn(commonStyles.tierBenefit, themeStyles.tierBenefit)}>
                        +{tier.benefits.length - 2} more
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Items */}
          <div className={commonStyles.verificationsSection}>
            <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Verifications</h3>
            <div className={commonStyles.verificationsList}>
              {verifications.map(verification => (
                <div key={verification.id} className={cn(commonStyles.verificationCard, themeStyles.verificationCard)}>
                  <div className={commonStyles.verificationIcon}>
                    {verification.badge}
                  </div>
                  <div className={commonStyles.verificationInfo}>
                    <div className={commonStyles.verificationHeader}>
                      <h4 className={cn(commonStyles.verificationName, themeStyles.verificationName)}>
                        {verification.name}
                        {verification.required && (
                          <span className={commonStyles.requiredBadge}>Required</span>
                        )}
                      </h4>
                      <span className={cn(
                        commonStyles.status,
                        commonStyles[`status${verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}`]
                      )}>
                        {getStatusIcon(verification.status)} {verification.status}
                      </span>
                    </div>
                    <p className={cn(commonStyles.verificationDesc, themeStyles.verificationDesc)}>
                      {verification.description}
                    </p>
                    {verification.verifiedAt && (
                      <span className={cn(commonStyles.verifiedDate, themeStyles.verifiedDate)}>
                        Verified on {new Date(verification.verifiedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className={commonStyles.verificationAction}>
                    {verification.status === 'unverified' && (
                      <button
                        className={cn(commonStyles.verifyButton, themeStyles.verifyButton)}
                        onClick={() => handleVerify(verification)}
                      >
                        Verify
                      </button>
                    )}
                    {verification.status === 'pending' && (
                      <span className={cn(commonStyles.pendingLabel, themeStyles.pendingLabel)}>
                        Under Review
                      </span>
                    )}
                    {verification.status === 'failed' && (
                      <button
                        className={cn(commonStyles.retryButton, themeStyles.retryButton)}
                        onClick={() => handleVerify(verification)}
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Upload Modal */}
      {showUploadModal && selectedVerification && (
        <div className={commonStyles.modalOverlay} onClick={() => !uploading && setShowUploadModal(false)}>
          <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={e => e.stopPropagation()}>
            <div className={commonStyles.modalHeader}>
              <h2 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>
                {selectedVerification.name}
              </h2>
              <button 
                className={commonStyles.closeButton} 
                onClick={() => !uploading && setShowUploadModal(false)}
                disabled={uploading}
              >
                ×
              </button>
            </div>
            <div className={commonStyles.modalContent}>
              <p className={cn(commonStyles.modalDesc, themeStyles.modalDesc)}>
                {selectedVerification.type === 'identity' 
                  ? 'Please upload a clear photo of your government-issued ID (passport, driver\'s license, or national ID card).'
                  : 'Please upload a document proving your address (utility bill, bank statement, etc.).'
                }
              </p>
              <div className={cn(commonStyles.uploadArea, themeStyles.uploadArea)}>
                <input type="file" accept="image/*,.pdf" className={commonStyles.fileInput} />
                <div className={commonStyles.uploadPlaceholder}>
                  <span className={commonStyles.uploadIcon}>📄</span>
                  <span>Click to upload or drag and drop</span>
                  <span className={cn(commonStyles.uploadHint, themeStyles.uploadHint)}>
                    PNG, JPG, or PDF up to 10MB
                  </span>
                </div>
              </div>
              <div className={cn(commonStyles.securityNote, themeStyles.securityNote)}>
                <span>🔒</span>
                <span>Your documents are encrypted and handled securely. We never share your personal information.</span>
              </div>
            </div>
            <div className={commonStyles.modalActions}>
              <button
                className={cn(commonStyles.cancelButton, themeStyles.cancelButton)}
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                className={cn(commonStyles.submitButton, themeStyles.submitButton)}
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Submit for Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
