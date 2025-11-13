// @AI-HINT: Project creation page for clients to post new projects
import { Metadata } from 'next';
import ProjectWizard from '@/app/components/Project/ProjectWizard/ProjectWizard';

export const metadata: Metadata = {
  title: 'Post a Project | MegiLance',
  description: 'Post your project and find the perfect freelancer for your needs',
};

export default function CreateProjectPage() {
  return (
    <div className="min-h-screen py-8">
      <ProjectWizard />
    </div>
  );
}
