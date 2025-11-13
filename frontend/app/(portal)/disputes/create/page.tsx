// @AI-HINT: Route page for dispute resolution wizard
import { Metadata } from 'next';
import DisputeWizard from '@/src/components/wizards/DisputeWizard';

export const metadata: Metadata = {
  title: 'File Dispute - MegiLance',
  description: 'Submit a dispute for resolution'
};

export default function CreateDisputePage({
  searchParams
}: {
  searchParams: { contract?: string; project?: string; party?: string }
}) {
  const contractId = searchParams.contract || '';
  const projectName = searchParams.project;
  const otherPartyName = searchParams.party;

  // Get user ID from session (replace with actual auth)
  const userId = 'current-user-id';

  if (!contractId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Contract ID Required</h1>
        <p>Please select a contract to file a dispute.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
      <DisputeWizard
        contractId={contractId}
        projectName={projectName}
        otherPartyName={otherPartyName}
        userId={userId}
      />
    </div>
  );
}
