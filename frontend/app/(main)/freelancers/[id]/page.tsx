// @AI-HINT: Public freelancer profile page
import UserProfile from '@/app/components/Profile/UserProfile/UserProfile';

export const metadata = {
  title: 'Freelancer Profile - MegiLance',
  description: 'View freelancer profile and portfolio',
};

export default function FreelancerProfilePage({ params }: { params: { id: string } }) {
  return <UserProfile userId={params.id} />;
}
