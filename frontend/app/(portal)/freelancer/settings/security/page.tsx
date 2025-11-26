// @AI-HINT: Security settings page - 2FA setup, active sessions, backup codes, login alerts
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { twoFactorApi } from '@/lib/api';
import commonStyles from './Security.common.module.css';
import lightStyles from './Security.light.module.css';
import darkStyles from './Security.dark.module.css';

interface TwoFactorStatus {
  enabled: boolean;
  method?: string;
  verified_at?: string;
}

interface Session {
  id: string;
  device: string;
  browser: string;
  ip_address: string;
  location: string;
  last_active: string;
  is_current: boolean;
}

interface BackupCode {
  code: string;
  used: boolean;
}

export default function SecuritySettingsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'2fa' | 'sessions' | 'alerts'>('2fa');
  
  // 2FA State
  const [twoFAStatus, setTwoFAStatus] = useState<TwoFactorStatus | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  
  // Sessions State
  const [sessions, setSessions] = useState<Session[]>([]);
  
  // Alerts State
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [unknownDeviceAlert, setUnknownDeviceAlert] = useState(true);
  const [passwordChangeAlert, setPasswordChangeAlert] = useState(true);

  useEffect(() => {
    setMounted(true);
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      const [statusRes] = await Promise.all([
        twoFactorApi.getStatus().catch(() => ({ enabled: false })),
      ]);
      setTwoFAStatus(statusRes);
      
      // Mock sessions data (would come from API)
      setSessions([
        {
          id: '1',
          device: 'Windows PC',
          browser: 'Chrome 120',
          ip_address: '192.168.1.100',
          location: 'New York, US',
          last_active: new Date().toISOString(),
          is_current: true
        },
        {
          id: '2',
          device: 'iPhone 15',
          browser: 'Safari Mobile',
          ip_address: '192.168.1.105',
          location: 'New York, US',
          last_active: new Date(Date.now() - 3600000).toISOString(),
          is_current: false
        }
      ]);
    } catch (error) {
      console.error('Failed to load security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      const response = await twoFactorApi.enable();
      setQrCode(response.qr_code || '');
      setSecret(response.secret || '');
      setShowSetup(true);
    } catch (error) {
      console.error('Failed to enable 2FA:', error);
    }
  };

  const handleVerify2FA = async () => {
    try {
      await twoFactorApi.verify(verificationCode);
      setTwoFAStatus({ enabled: true, method: 'authenticator' });
      setShowSetup(false);
      setVerificationCode('');
      // Get backup codes
      const codesRes = await twoFactorApi.getBackupCodes();
      setBackupCodes(codesRes.codes || []);
      setShowBackupCodes(true);
    } catch (error) {
      console.error('Failed to verify 2FA:', error);
      alert('Invalid verification code');
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication?')) return;
    try {
      await twoFactorApi.disable();
      setTwoFAStatus({ enabled: false });
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (!confirm('This will invalidate your existing backup codes. Continue?')) return;
    try {
      const response = await twoFactorApi.regenerateBackupCodes();
      setBackupCodes(response.codes || []);
      setShowBackupCodes(true);
    } catch (error) {
      console.error('Failed to regenerate backup codes:', error);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    if (!confirm('End this session?')) return;
    // API call would go here
    setSessions(sessions.filter(s => s.id !== sessionId));
  };

  const handleTerminateAllSessions = async () => {
    if (!confirm('This will log you out of all other devices. Continue?')) return;
    // API call would go here
    setSessions(sessions.filter(s => s.is_current));
  };

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={cn(commonStyles.loading, themeStyles.loading)}>Loading security settings...</div>
      </div>
    );
  }

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>Security Settings</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Manage your account security and authentication
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={cn(commonStyles.tabs, themeStyles.tabs)}>
        <button
          className={cn(commonStyles.tab, themeStyles.tab, activeTab === '2fa' && commonStyles.activeTab, activeTab === '2fa' && themeStyles.activeTab)}
          onClick={() => setActiveTab('2fa')}
        >
          🔐 Two-Factor Auth
        </button>
        <button
          className={cn(commonStyles.tab, themeStyles.tab, activeTab === 'sessions' && commonStyles.activeTab, activeTab === 'sessions' && themeStyles.activeTab)}
          onClick={() => setActiveTab('sessions')}
        >
          📱 Active Sessions
        </button>
        <button
          className={cn(commonStyles.tab, themeStyles.tab, activeTab === 'alerts' && commonStyles.activeTab, activeTab === 'alerts' && themeStyles.activeTab)}
          onClick={() => setActiveTab('alerts')}
        >
          🔔 Login Alerts
        </button>
      </div>

      {/* 2FA Tab */}
      {activeTab === '2fa' && (
        <div className={commonStyles.tabContent}>
          <div className={cn(commonStyles.card, themeStyles.card)}>
            <div className={commonStyles.cardHeader}>
              <div className={commonStyles.statusRow}>
                <div>
                  <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>
                    Two-Factor Authentication
                  </h3>
                  <p className={cn(commonStyles.cardDescription, themeStyles.cardDescription)}>
                    Add an extra layer of security to your account
                  </p>
                </div>
                <span className={cn(
                  commonStyles.statusBadge,
                  twoFAStatus?.enabled ? commonStyles.statusEnabled : commonStyles.statusDisabled,
                  twoFAStatus?.enabled ? themeStyles.statusEnabled : themeStyles.statusDisabled
                )}>
                  {twoFAStatus?.enabled ? '✓ Enabled' : '✗ Disabled'}
                </span>
              </div>
            </div>

            {!twoFAStatus?.enabled && !showSetup && (
              <div className={commonStyles.setupPrompt}>
                <div className={cn(commonStyles.infoBox, themeStyles.infoBox)}>
                  <span className={commonStyles.infoIcon}>ℹ️</span>
                  <p>
                    Two-factor authentication adds an extra layer of security by requiring a code 
                    from your authenticator app in addition to your password.
                  </p>
                </div>
                <button
                  className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}
                  onClick={handleEnable2FA}
                >
                  Enable Two-Factor Authentication
                </button>
              </div>
            )}

            {showSetup && (
              <div className={commonStyles.setupFlow}>
                <div className={commonStyles.setupSteps}>
                  <div className={commonStyles.setupStep}>
                    <span className={cn(commonStyles.stepNumber, themeStyles.stepNumber)}>1</span>
                    <div>
                      <h4>Install an authenticator app</h4>
                      <p className={themeStyles.mutedText}>
                        Download Google Authenticator, Authy, or any TOTP-compatible app
                      </p>
                    </div>
                  </div>

                  <div className={commonStyles.setupStep}>
                    <span className={cn(commonStyles.stepNumber, themeStyles.stepNumber)}>2</span>
                    <div>
                      <h4>Scan the QR code</h4>
                      <div className={cn(commonStyles.qrContainer, themeStyles.qrContainer)}>
                        {qrCode ? (
                          <img src={qrCode} alt="QR Code" className={commonStyles.qrCode} />
                        ) : (
                          <div className={commonStyles.qrPlaceholder}>
                            <span>QR Code</span>
                          </div>
                        )}
                      </div>
                      <p className={themeStyles.mutedText}>
                        Or enter this code manually: <code className={cn(commonStyles.secretCode, themeStyles.secretCode)}>{secret}</code>
                      </p>
                    </div>
                  </div>

                  <div className={commonStyles.setupStep}>
                    <span className={cn(commonStyles.stepNumber, themeStyles.stepNumber)}>3</span>
                    <div>
                      <h4>Enter verification code</h4>
                      <div className={commonStyles.verifyInput}>
                        <input
                          type="text"
                          placeholder="000000"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className={cn(commonStyles.codeInput, themeStyles.codeInput)}
                          maxLength={6}
                        />
                        <button
                          className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}
                          onClick={handleVerify2FA}
                          disabled={verificationCode.length !== 6}
                        >
                          Verify & Enable
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  className={cn(commonStyles.secondaryButton, themeStyles.secondaryButton)}
                  onClick={() => setShowSetup(false)}
                >
                  Cancel
                </button>
              </div>
            )}

            {twoFAStatus?.enabled && !showSetup && (
              <div className={commonStyles.enabledState}>
                <div className={cn(commonStyles.successBox, themeStyles.successBox)}>
                  <span className={commonStyles.successIcon}>✓</span>
                  <div>
                    <strong>Two-factor authentication is enabled</strong>
                    <p>Your account is protected with an authenticator app</p>
                  </div>
                </div>

                <div className={commonStyles.twoFAActions}>
                  <button
                    className={cn(commonStyles.secondaryButton, themeStyles.secondaryButton)}
                    onClick={handleRegenerateBackupCodes}
                  >
                    View Backup Codes
                  </button>
                  <button
                    className={cn(commonStyles.dangerButton, themeStyles.dangerButton)}
                    onClick={handleDisable2FA}
                  >
                    Disable 2FA
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Backup Codes Modal */}
          {showBackupCodes && backupCodes.length > 0 && (
            <div className={cn(commonStyles.modal, themeStyles.modal)}>
              <div className={cn(commonStyles.modalContent, themeStyles.modalContent)}>
                <h3>Backup Codes</h3>
                <p className={themeStyles.mutedText}>
                  Save these codes in a safe place. Each code can only be used once.
                </p>
                <div className={commonStyles.backupCodesGrid}>
                  {backupCodes.map((code, index) => (
                    <code key={index} className={cn(commonStyles.backupCode, themeStyles.backupCode)}>
                      {code}
                    </code>
                  ))}
                </div>
                <div className={commonStyles.modalActions}>
                  <button
                    className={cn(commonStyles.secondaryButton, themeStyles.secondaryButton)}
                    onClick={() => {
                      navigator.clipboard.writeText(backupCodes.join('\n'));
                      alert('Codes copied to clipboard');
                    }}
                  >
                    Copy All
                  </button>
                  <button
                    className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}
                    onClick={() => setShowBackupCodes(false)}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className={commonStyles.tabContent}>
          <div className={cn(commonStyles.card, themeStyles.card)}>
            <div className={commonStyles.cardHeader}>
              <div>
                <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>Active Sessions</h3>
                <p className={cn(commonStyles.cardDescription, themeStyles.cardDescription)}>
                  Manage devices where you're currently logged in
                </p>
              </div>
              {sessions.length > 1 && (
                <button
                  className={cn(commonStyles.dangerButton, themeStyles.dangerButton)}
                  onClick={handleTerminateAllSessions}
                >
                  End All Other Sessions
                </button>
              )}
            </div>

            <div className={commonStyles.sessionsList}>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    commonStyles.sessionItem,
                    themeStyles.sessionItem,
                    session.is_current && commonStyles.currentSession,
                    session.is_current && themeStyles.currentSession
                  )}
                >
                  <div className={commonStyles.sessionIcon}>
                    {session.device.includes('iPhone') || session.device.includes('Android') ? '📱' : '💻'}
                  </div>
                  <div className={commonStyles.sessionInfo}>
                    <div className={commonStyles.sessionDevice}>
                      {session.device}
                      {session.is_current && (
                        <span className={cn(commonStyles.currentBadge, themeStyles.currentBadge)}>
                          Current
                        </span>
                      )}
                    </div>
                    <div className={cn(commonStyles.sessionMeta, themeStyles.sessionMeta)}>
                      <span>{session.browser}</span>
                      <span>•</span>
                      <span>{session.ip_address}</span>
                      <span>•</span>
                      <span>{session.location}</span>
                    </div>
                    <div className={cn(commonStyles.sessionTime, themeStyles.sessionTime)}>
                      Last active: {new Date(session.last_active).toLocaleString()}
                    </div>
                  </div>
                  {!session.is_current && (
                    <button
                      className={cn(commonStyles.endSessionButton, themeStyles.endSessionButton)}
                      onClick={() => handleTerminateSession(session.id)}
                    >
                      End Session
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className={commonStyles.tabContent}>
          <div className={cn(commonStyles.card, themeStyles.card)}>
            <div className={commonStyles.cardHeader}>
              <div>
                <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>Login Alerts</h3>
                <p className={cn(commonStyles.cardDescription, themeStyles.cardDescription)}>
                  Get notified about account activity
                </p>
              </div>
            </div>

            <div className={commonStyles.alertsList}>
              <div className={cn(commonStyles.alertItem, themeStyles.alertItem)}>
                <div className={commonStyles.alertInfo}>
                  <h4>New login alerts</h4>
                  <p className={themeStyles.mutedText}>
                    Get notified when your account is accessed from a new location
                  </p>
                </div>
                <label className={commonStyles.toggle}>
                  <input
                    type="checkbox"
                    checked={loginAlerts}
                    onChange={(e) => setLoginAlerts(e.target.checked)}
                  />
                  <span className={cn(commonStyles.toggleSlider, themeStyles.toggleSlider)}></span>
                </label>
              </div>

              <div className={cn(commonStyles.alertItem, themeStyles.alertItem)}>
                <div className={commonStyles.alertInfo}>
                  <h4>Unknown device alerts</h4>
                  <p className={themeStyles.mutedText}>
                    Get notified when a login is detected from an unrecognized device
                  </p>
                </div>
                <label className={commonStyles.toggle}>
                  <input
                    type="checkbox"
                    checked={unknownDeviceAlert}
                    onChange={(e) => setUnknownDeviceAlert(e.target.checked)}
                  />
                  <span className={cn(commonStyles.toggleSlider, themeStyles.toggleSlider)}></span>
                </label>
              </div>

              <div className={cn(commonStyles.alertItem, themeStyles.alertItem)}>
                <div className={commonStyles.alertInfo}>
                  <h4>Password change alerts</h4>
                  <p className={themeStyles.mutedText}>
                    Get notified when your password is changed
                  </p>
                </div>
                <label className={commonStyles.toggle}>
                  <input
                    type="checkbox"
                    checked={passwordChangeAlert}
                    onChange={(e) => setPasswordChangeAlert(e.target.checked)}
                  />
                  <span className={cn(commonStyles.toggleSlider, themeStyles.toggleSlider)}></span>
                </label>
              </div>
            </div>

            <div className={commonStyles.cardFooter}>
              <button className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}>
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
