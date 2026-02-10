// @AI-HINT: Route page for new message wizard
import { Metadata } from 'next';
import MessagingWizard from '@/src/components/wizards/MessagingWizard';
import commonStyles from './NewMessage.common.module.css';

export const metadata: Metadata = {
  title: 'New Message - MegiLance',
  description: 'Send a new message'
};

export default function NewMessagePage() {
  // Get user info from session (replace with actual auth)
  const userId = 'current-user-id';
  const userType = 'client'; // or 'freelancer'

  return (
    <div className={commonStyles.pageContainer}>
      <MessagingWizard
        userId={userId}
        userType={userType}
      />
    </div>
  );
}
