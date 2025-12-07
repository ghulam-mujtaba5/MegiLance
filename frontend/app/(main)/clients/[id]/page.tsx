// @AI-HINT: Public client profile page
import UserProfile from '@/app/components/Profile/UserProfile/UserProfile';
import { BASE_URL } from '@/lib/seo';

export const metadata = {
  title: 'Client Profile | MegiLance',
  description: 'View client profile, job history, and ratings on MegiLance.',
  openGraph: {
    title: 'Client Profile - MegiLance',
    description: 'View client profile and history on MegiLance.',
    url: `${BASE_URL}/clients`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ClientProfilePage({ params }: { params: { id: string } }) {
  return <UserProfile userId={params.id} />;
}
