// @AI-HINT: Route page for portfolio upload wizard
import PortfolioUploadWizard from '@/components/wizards/PortfolioUploadWizard';

export default function PortfolioUploadPage({
  searchParams
}: {
  searchParams: { userId: string }
}) {
  return (
    <PortfolioUploadWizard
      userId={searchParams.userId}
    />
  );
}
