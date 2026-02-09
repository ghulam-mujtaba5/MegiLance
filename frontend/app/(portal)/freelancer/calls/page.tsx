// @AI-HINT: Video calls page - Schedule, join, and manage video meetings
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { videoCallsApi } from '@/lib/api';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import Modal from '@/app/components/Modal/Modal';
import Button from '@/app/components/Button/Button';
import Loader from '@/app/components/Loader/Loader';
import commonStyles from './VideoCalls.common.module.css';
import lightStyles from './VideoCalls.light.module.css';
import darkStyles from './VideoCalls.dark.module.css';

interface VideoCall {
  id: string;
  room_id: string;
  title: string;
  participants: Participant[];
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  duration?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  has_recording: boolean;
}

interface Participant {
  id: string;
  name: string;
  avatar_url?: string;
  role: string;
}

export default function VideoCallsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [calls, setCalls] = useState<VideoCall[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  
  // New call form
  const [newCall, setNewCall] = useState({
    title: '',
    scheduled_at: '',
    participant_ids: [] as string[],
  });

  // Join by code
  const [roomCode, setRoomCode] = useState('');
  const [endCallTarget, setEndCallTarget] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    setMounted(true);
    loadCalls();
  }, []);

  const loadCalls = async () => {
    try {
      setLoading(true);
      const response = await videoCallsApi.getHistory().catch(() => ({ calls: [] })) as any;
      
      // Use API data if available, otherwise fall back to demo data
      let callsData: VideoCall[] = [];
      
      if (response && (response.calls?.length > 0 || Array.isArray(response) && response.length > 0)) {
        callsData = response.calls || response;
      } else {
        // Demo data for display when no real calls exist
        callsData = [
          {
            id: '1',
            room_id: 'MEET-ABC123',
            title: 'Project Kickoff Meeting',
            participants: [
              { id: '1', name: 'John Smith', role: 'Client' },
              { id: '2', name: 'Sarah Johnson', role: 'Freelancer' },
            ],
            scheduled_at: new Date(Date.now() + 3600000).toISOString(),
            status: 'scheduled',
            has_recording: false,
          },
          {
            id: '2',
            room_id: 'MEET-XYZ789',
            title: 'Weekly Sync',
            participants: [
              { id: '1', name: 'Tech Solutions Team', role: 'Client' },
              { id: '2', name: 'Me', role: 'Freelancer' },
            ],
            scheduled_at: new Date(Date.now() + 86400000).toISOString(),
            status: 'scheduled',
            has_recording: false,
          },
          {
            id: '3',
            room_id: 'MEET-DEF456',
            title: 'Design Review',
            participants: [
              { id: '1', name: 'Creative Agency', role: 'Client' },
            ],
            started_at: new Date(Date.now() - 86400000).toISOString(),
            ended_at: new Date(Date.now() - 86400000 + 2700000).toISOString(),
            duration: 45,
            status: 'completed',
            has_recording: true,
          },
          {
            id: '4',
            room_id: 'MEET-GHI321',
            title: 'API Integration Discussion',
            participants: [
              { id: '1', name: 'Enterprise Corp', role: 'Client' },
              { id: '2', name: 'Dev Team Lead', role: 'Tech Lead' },
            ],
            started_at: new Date(Date.now() - 172800000).toISOString(),
            ended_at: new Date(Date.now() - 172800000 + 3600000).toISOString(),
            duration: 60,
            status: 'completed',
            has_recording: true,
          },
        ];
      }

      setCalls(callsData);
    } catch (error) {
      console.error('Failed to load calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleCall = async () => {
    try {
      await videoCallsApi.createRoom({
        participant_ids: newCall.participant_ids,
        scheduled_at: newCall.scheduled_at,
      });
      setShowScheduleModal(false);
      setNewCall({ title: '', scheduled_at: '', participant_ids: [] });
      loadCalls();
    } catch (error) {
      console.error('Failed to schedule call:', error);
    }
  };

  const handleJoinCall = async (roomId: string) => {
    try {
      await videoCallsApi.joinRoom(roomId);
      // In production, this would open a video call interface
      window.open(`/call/${roomId}`, '_blank');
    } catch (error) {
      console.error('Failed to join call:', error);
    }
  };

  const handleJoinByCode = async () => {
    if (!roomCode.trim()) return;
    handleJoinCall(roomCode.trim());
    setShowJoinModal(false);
    setRoomCode('');
  };

  const handleEndCall = async (roomId: string) => {
    setEndCallTarget(null);
    try {
      await videoCallsApi.endCall(roomId);
      loadCalls();
      showToast('Call ended successfully.');
    } catch (error) {
      console.error('Failed to end call:', error);
      showToast('Failed to end call.', 'error');
    }
  };

  const handleViewRecording = async (roomId: string) => {
    try {
      const recording = await videoCallsApi.getRecording(roomId) as any;
      if (recording?.url) {
        window.open(recording.url, '_blank');
      }
    } catch (error) {
      console.error('Failed to get recording:', error);
      showToast('Recording not available.', 'error');
    }
  };

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const formatCallTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff > 0 && diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `In ${mins} min`;
    }
    
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const upcomingCalls = calls.filter(c => c.status === 'scheduled' || c.status === 'in_progress');
  const pastCalls = calls.filter(c => c.status === 'completed' || c.status === 'cancelled');

  const displayCalls = activeTab === 'upcoming' ? upcomingCalls : pastCalls;

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        {/* Header */}
        <ScrollReveal className={commonStyles.header}>
          <div>
            <h1 className={cn(commonStyles.title, themeStyles.title)}>Video Calls</h1>
            <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
              Schedule and manage video meetings with clients
            </p>
          </div>
          <div className={commonStyles.headerActions}>
            <button
              className={cn(commonStyles.secondaryButton, themeStyles.secondaryButton)}
              onClick={() => setShowJoinModal(true)}
            >
              🔗 Join by Code
            </button>
            <button
              className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}
              onClick={() => setShowScheduleModal(true)}
            >
              + Schedule Call
            </button>
          </div>
        </ScrollReveal>

        {/* Quick Actions */}
        <ScrollReveal delay={0.1} className={commonStyles.quickActions}>
          <button
            className={cn(commonStyles.quickAction, themeStyles.quickAction)}
            onClick={() => setShowScheduleModal(true)}
          >
            <span className={commonStyles.quickActionIcon}>📹</span>
            <span className={commonStyles.quickActionLabel}>Start Instant Meeting</span>
          </button>
          <button
            className={cn(commonStyles.quickAction, themeStyles.quickAction)}
            onClick={() => setShowScheduleModal(true)}
          >
            <span className={commonStyles.quickActionIcon}>📅</span>
            <span className={commonStyles.quickActionLabel}>Schedule for Later</span>
          </button>
          <button
            className={cn(commonStyles.quickAction, themeStyles.quickAction)}
            onClick={() => setShowJoinModal(true)}
          >
            <span className={commonStyles.quickActionIcon}>🔗</span>
            <span className={commonStyles.quickActionLabel}>Join with Code</span>
          </button>
        </ScrollReveal>

        {/* Tabs */}
        <ScrollReveal delay={0.2} className={cn(commonStyles.tabs, themeStyles.tabs)}>
          <button
            className={cn(
              commonStyles.tab, 
              themeStyles.tab, 
              activeTab === 'upcoming' && commonStyles.activeTab,
              activeTab === 'upcoming' && themeStyles.activeTab
            )}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming ({upcomingCalls.length})
          </button>
          <button
            className={cn(
              commonStyles.tab, 
              themeStyles.tab, 
              activeTab === 'history' && commonStyles.activeTab,
              activeTab === 'history' && themeStyles.activeTab
            )}
            onClick={() => setActiveTab('history')}
          >
            History ({pastCalls.length})
          </button>
        </ScrollReveal>

        {/* Calls List */}
        <div className={commonStyles.callsList}>
          {displayCalls.length === 0 ? (
            <ScrollReveal delay={0.3} className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
              <span className={commonStyles.emptyIcon}>
                {activeTab === 'upcoming' ? '📅' : '📹'}
              </span>
              <p>
                {activeTab === 'upcoming' 
                  ? 'No upcoming calls scheduled'
                  : 'No call history yet'}
              </p>
              {activeTab === 'upcoming' && (
                <button
                  className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}
                  onClick={() => setShowScheduleModal(true)}
                >
                  Schedule your first call
                </button>
              )}
            </ScrollReveal>
          ) : (
            <StaggerContainer delay={0.3}>
              {displayCalls.map((call) => (
                <StaggerItem key={call.id} className={cn(commonStyles.callCard, themeStyles.callCard)}>
                  <div className={commonStyles.callHeader}>
                    <div className={commonStyles.callInfo}>
                      <h3 className={cn(commonStyles.callTitle, themeStyles.callTitle)}>
                        {call.title}
                      </h3>
                      <span className={cn(commonStyles.roomCode, themeStyles.roomCode)}>
                        {call.room_id}
                      </span>
                    </div>
                    <span className={cn(
                      commonStyles.status,
                      commonStyles[`status${call.status.charAt(0).toUpperCase() + call.status.slice(1).replace('_', '')}`],
                      themeStyles[`status${call.status.charAt(0).toUpperCase() + call.status.slice(1).replace('_', '')}`]
                    )}>
                      {call.status === 'in_progress' ? '🔴 Live' : call.status}
                    </span>
                  </div>

                  <div className={commonStyles.callBody}>
                    <div className={commonStyles.participants}>
                      <span className={themeStyles.participantsLabel}>Participants:</span>
                      <div className={commonStyles.participantsList}>
                        {call.participants.map((p, i) => (
                          <span key={i} className={cn(commonStyles.participant, themeStyles.participant)}>
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className={cn(commonStyles.callMeta, themeStyles.callMeta)}>
                      {call.scheduled_at && (
                        <span>📅 {formatCallTime(call.scheduled_at)}</span>
                      )}
                      {call.duration && (
                        <span>⏱️ {formatDuration(call.duration)}</span>
                      )}
                      {call.has_recording && (
                        <span className={commonStyles.hasRecording}>📼 Recording available</span>
                      )}
                    </div>
                  </div>

                  <div className={commonStyles.callActions}>
                    {call.status === 'scheduled' && (
                      <button
                        className={cn(commonStyles.joinButton, themeStyles.joinButton)}
                        onClick={() => handleJoinCall(call.room_id)}
                      >
                        📹 Join Call
                      </button>
                    )}
                    {call.status === 'in_progress' && (
                      <>
                        <button
                          className={cn(commonStyles.joinButton, themeStyles.joinButton)}
                          onClick={() => handleJoinCall(call.room_id)}
                        >
                          📹 Rejoin
                        </button>
                        <button
                          className={cn(commonStyles.endButton, themeStyles.endButton)}
                          onClick={() => setEndCallTarget(call.room_id)}
                        >
                          End Call
                        </button>
                      </>
                    )}
                    {call.status === 'completed' && call.has_recording && (
                      <button
                        className={cn(commonStyles.actionButton, themeStyles.actionButton)}
                        onClick={() => handleViewRecording(call.room_id)}
                      >
                        📼 View Recording
                      </button>
                    )}
                    <button className={cn(commonStyles.actionButton, themeStyles.actionButton)}>
                      📋 Copy Link
                    </button>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className={cn(commonStyles.modal, themeStyles.modal)}>
            <div className={cn(commonStyles.modalContent, themeStyles.modalContent)}>
              <div className={commonStyles.modalHeader}>
                <h2>Schedule Video Call</h2>
                <button
                  className={cn(commonStyles.closeButton, themeStyles.closeButton)}
                  onClick={() => setShowScheduleModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className={commonStyles.modalBody}>
                <div className={commonStyles.formGroup}>
                  <label>Meeting Title</label>
                  <input
                    type="text"
                    value={newCall.title}
                    onChange={(e) => setNewCall({ ...newCall, title: e.target.value })}
                    className={cn(commonStyles.input, themeStyles.input)}
                    placeholder="e.g., Project Discussion"
                  />
                </div>

                <div className={commonStyles.formGroup}>
                  <label>Date & Time</label>
                  <input
                    type="datetime-local"
                    value={newCall.scheduled_at}
                    onChange={(e) => setNewCall({ ...newCall, scheduled_at: e.target.value })}
                    className={cn(commonStyles.input, themeStyles.input)}
                  />
                </div>

                <div className={commonStyles.formGroup}>
                  <label>Invite Participants (optional)</label>
                  <input
                    type="text"
                    placeholder="Enter email addresses separated by commas"
                    className={cn(commonStyles.input, themeStyles.input)}
                  />
                  <p className={cn(commonStyles.hint, themeStyles.hint)}>
                    Participants will receive an email invitation with the meeting link
                  </p>
                </div>
              </div>

              <div className={commonStyles.modalFooter}>
                <button
                  className={cn(commonStyles.secondaryButton, themeStyles.secondaryButton)}
                  onClick={() => setShowScheduleModal(false)}
                >
                  Cancel
                </button>
                <button
                  className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}
                  onClick={handleScheduleCall}
                >
                  Schedule Call
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Join Modal */}
        {showJoinModal && (
          <div className={cn(commonStyles.modal, themeStyles.modal)}>
            <div className={cn(commonStyles.modalContent, themeStyles.modalContent, commonStyles.modalSmall)}>
              <div className={commonStyles.modalHeader}>
                <h2>Join by Code</h2>
                <button
                  className={cn(commonStyles.closeButton, themeStyles.closeButton)}
                  onClick={() => setShowJoinModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className={commonStyles.modalBody}>
                <div className={commonStyles.formGroup}>
                  <label>Meeting Code</label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className={cn(commonStyles.input, themeStyles.input, commonStyles.codeInput)}
                    placeholder="MEET-XXXXXX"
                  />
                </div>
              </div>

              <div className={commonStyles.modalFooter}>
                <button
                  className={cn(commonStyles.secondaryButton, themeStyles.secondaryButton)}
                  onClick={() => setShowJoinModal(false)}
                >
                  Cancel
                </button>
                <button
                  className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}
                  onClick={handleJoinByCode}
                  disabled={!roomCode.trim()}
                >
                  Join Call
                </button>
              </div>
            </div>
          </div>
        )}

        {/* End Call Confirmation Modal */}
        <Modal isOpen={endCallTarget !== null} title="End Call" onClose={() => setEndCallTarget(null)}>
          <p>Are you sure you want to end this call? All participants will be disconnected.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <Button variant="secondary" onClick={() => setEndCallTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => endCallTarget && handleEndCall(endCallTarget)}>End Call</Button>
          </div>
        </Modal>

        {/* Toast */}
        {toast && (
          <div className={cn(commonStyles.toast, themeStyles.toast, toast.type === 'error' && commonStyles.toastError, toast.type === 'error' && themeStyles.toastError)}>
            {toast.message}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
