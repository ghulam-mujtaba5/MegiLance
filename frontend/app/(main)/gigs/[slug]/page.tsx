// @AI-HINT: Page entry point for gig detail
import GigDetail from './GigDetail';

export default function GigDetailPage() {
  return <GigDetail />;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  // In a real app, fetch gig data here for dynamic meta
  const slug = params.slug;
  const title = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `${title} | MegiLance Services`,
    description: `Professional freelance service - ${title}. Order now on MegiLance.`,
  };
}
