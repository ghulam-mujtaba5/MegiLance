// @AI-HINT: Public Job Details page
import React from 'react';
import JobDetails from './JobDetails';

export const metadata = {
  title: 'Job Details | MegiLance',
  description: 'View job details and apply.',
};

export default function Page({ params }: { params: { id: string } }) {
  return <JobDetails jobId={params.id} />;
}
