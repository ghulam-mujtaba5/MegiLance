import os

file_path = os.path.join("frontend", "app", "(portal)", "freelancer", "projects", "[id]", "ProjectDetails.tsx")

content = """'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/Button';
import { Card } from '@/app/components/Card';
import { Badge } from '@/app/components/Badge';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  MapPin, 
  Briefcase, 
  CheckCircle, 
  Flag,
  Share2,
  Heart,
  ArrowLeft
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ProjectDetailsProps {
  id: string;
}

interface Project {
  id: number;
  title: string;
  description: string;
  category: string;
  budget_type: 'fixed' | 'hourly';
  budget_min: number;
  budget_max: number;
  experience_level: string;
  estimated_duration: string;
  skills: string[];
  client_id: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Client {
  id: number;
  name: string;
  email: string;
  location?: string;
  joined_at: string;
  // Add other client fields as needed
}

export default function ProjectDetails({ id }: ProjectDetailsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch project details
        const projectData = await api.projects.get(parseInt(id));
        setProject(projectData);

        // Fetch client details if we have a client_id
        if (projectData.client_id) {
          try {
            const clientData = await api.users.get(projectData.client_id);
            setClient(clientData);
          } catch (error) {
            console.error('Failed to fetch client details:', error);
            // Don't block the UI if client fetch fails
          }
        }
      } catch (error) {
        console.error('Failed to fetch project:', error);
        toast({
          title: 'Error',
          description: 'Failed to load project details',
          variant: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, toast]);

  const handleSubmitProposal = () => {
    router.push(`/portal/freelancer/submit-proposal?projectId=${id}`);
  };

  const handleSaveJob = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement save job functionality
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      toast({
        title: 'Success',
        description: 'Job saved to your favorites',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save job',
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Project not found</h3>
        <Button 
          variant="ghost" 
          className="mt-4"
          onClick={() => router.back()}
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-4 -ml-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {project.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center">
              <Briefcase className="w-4 h-4 mr-1.5" />
              {project.category}
            </span>
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1.5" />
              Posted {formatDistanceToNow(new Date(project.created_at))} ago
            </span>
            <span className="flex items-center">
              <MapPin className="w-4 h-4 mr-1.5" />
              Remote
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleSaveJob} isLoading={isSaving}>
            <Heart className="w-4 h-4 mr-2" />
            Save Job
          </Button>
          <Button variant="primary" onClick={handleSubmitProposal}>
            Submit Proposal
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Project Description
            </h2>
            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
              {project.description}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Skills Required
            </h2>
            <div className="flex flex-wrap gap-2">
              {project.skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Activity on this Job
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">Proposals</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">Less than 5</div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">Last Viewed</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">2 hours ago</div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">Interviewing</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">0</div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">Invites Sent</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">0</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Project Details
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {project.budget_type === 'fixed' ? 'Fixed Price' : 'Hourly Rate'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    ${project.budget_min.toLocaleString()} - ${project.budget_max.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Experience Level
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {project.experience_level}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Project Duration
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {project.estimated_duration}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              About the Client
            </h3>
            {client ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {client.name}
                    </div>
                    {client.location && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {client.location}
                      </div>
                    )}
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Payment Method Verified
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    5.0 of 12 reviews
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    15 Jobs Posted
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Clock className="w-4 h-4 text-gray-400" />
                    Member since {new Date(client.joined_at).getFullYear()}
                  </div>
                </div>
              </div>
            ) : (
               <div className="text-sm text-gray-500">Client information unavailable</div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Share this Job
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                Copy Link
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
"""

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Successfully updated {file_path}")
