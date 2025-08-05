// @AI-HINT: This component displays a feed of recent user and system activities. It's designed to be clear, scannable, and informative, enhancing user engagement and providing transparency, which are hallmarks of a premium SaaS experience.

import React from 'react';
import { ActivityItem } from '../../types';
import {
  Briefcase,
  CheckCircle,
  Clock,
  DollarSign,
  MessageSquare,
  UserPlus,
} from 'lucide-react';
import './DashboardActivityFeed.common.css';
import './DashboardActivityFeed.light.css';
import './DashboardActivityFeed.dark.css';

interface DashboardActivityFeedProps {
  activities: ActivityItem[];
}

const getActivityIcon = (type: ActivityItem['type']) => {
  const iconProps = { size: 20, className: 'ActivityItem-icon-svg' };
  switch (type) {
    case 'new_project':
      return <Briefcase {...iconProps} />;
    case 'new_client':
      return <UserPlus {...iconProps} />;
    case 'project_milestone':
      return <CheckCircle {...iconProps} />;
    case 'new_message':
      return <MessageSquare {...iconProps} />;
    case 'payment_received':
      return <DollarSign {...iconProps} />;
    case 'deadline_approaching':
      return <Clock {...iconProps} />;
    default:
      return null;
  }
};

const DashboardActivityFeed: React.FC<DashboardActivityFeedProps> = ({ activities }) => {
  return (
    <div className="DashboardSection">
      <div className="DashboardSection-header">
        <h2>Activity Feed</h2>
        <a href="/activity" className="DashboardSection-view-all">View All</a>
      </div>
      <div className="DashboardActivityFeed-list">
        {activities.map((activity) => (
          <div key={activity.id} className="ActivityItem">
            <div className={`ActivityItem-icon ActivityItem-icon--${activity.type}`}>
              {getActivityIcon(activity.type)}
            </div>
            <div className="ActivityItem-content">
              <p className="ActivityItem-message" dangerouslySetInnerHTML={{ __html: activity.message }}></p>
              <span className="ActivityItem-time">{activity.timestamp}</span>
            </div>
            {activity.amount && (
              <div className="ActivityItem-amount">
                {activity.amount}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardActivityFeed;
