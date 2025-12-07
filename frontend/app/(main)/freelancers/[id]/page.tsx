// @AI-HINT: Public freelancer profile page
import UserProfile from '@/app/components/Profile/UserProfile/UserProfile';
import { BASE_URL } from '@/lib/seo';

export const metadata = {
  title: 'Freelancer Profile | MegiLance',
  description: 'View freelancer profile, portfolio, and skills on MegiLance.',
  openGraph: {
    title: 'Freelancer Profile - MegiLance',
    description: 'Hire this freelancer on MegiLance. View portfolio and reviews.',
    url: `${BASE_URL}/freelancers`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function FreelancerProfilePage({ params }: { params: { id: string } }) {
  return <UserProfile userId={params.id} />;
}
