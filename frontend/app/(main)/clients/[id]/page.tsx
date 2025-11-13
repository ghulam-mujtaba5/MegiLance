// @AI-HINT: Public client profile page
import UserProfile from '@/app/components/Profile/UserProfile/UserProfile';

export const metadata = {
  title: 'Client Profile - MegiLance',
  description: 'View client profile and history',
};

export default function ClientProfilePage({ params }: { params: { id: string } }) {
  return <UserProfile userId={params.id} />;
}
