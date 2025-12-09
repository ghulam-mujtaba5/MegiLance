// @AI-HINT: Public Job Details page
import React from 'react';
import JobDetails from './JobDetails';

export const metadata = {
  title: 'Job Details | MegiLance',
  description: 'View job details and apply.',
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <JobDetails jobId={resolvedParams.id} />;
}
