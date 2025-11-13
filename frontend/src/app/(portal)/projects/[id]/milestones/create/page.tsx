// @AI-HINT: Route page for milestone creation wizard
import { Metadata } from 'next';
import MilestoneWizard from '@/components/wizards/MilestoneWizard';

export const metadata: Metadata = {
  title: 'Create Milestone - MegiLance',
  description: 'Add a new project milestone'
};

export default function CreateMilestonePage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { project?: string; value?: string; existing?: string }
}) {
  const projectId = params.id;
  const projectName = searchParams.project || 'Project';
  const contractValue = parseFloat(searchParams.value || '0');
  const existingMilestones = parseInt(searchParams.existing || '0');

  // Get user ID from session (replace with actual auth)
  const userId = 'current-user-id';

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
      <MilestoneWizard
        projectId={projectId}
        projectName={projectName}
        contractValue={contractValue}
        existingMilestones={existingMilestones}
        userId={userId}
      />
    </div>
  );
}
