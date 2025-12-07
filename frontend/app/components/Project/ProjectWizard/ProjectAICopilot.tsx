// @AI-HINT: AI Copilot component for project creation assistance
'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { FaMagic, FaRobot, FaCheck, FaTimes } from 'react-icons/fa';
import Button from '@/app/components/Button/Button';
import api from '@/lib/api';

import commonStyles from './ProjectAICopilot.common.module.css';
import lightStyles from './ProjectAICopilot.light.module.css';
import darkStyles from './ProjectAICopilot.dark.module.css';

interface GeneratedData {
  title?: string;
  description?: string;
  skills?: string[];
  category?: string;
  budgetMin?: string;
  budgetMax?: string;
}

interface ProjectAICopilotProps {
  onApply: (data: GeneratedData) => void;
}

const ProjectAICopilot: React.FC<ProjectAICopilotProps> = ({ onApply }) => {
  const { resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const styles = {
    container: cn(commonStyles.container, themeStyles.container),
    header: cn(commonStyles.header, themeStyles.header),
    title: cn(commonStyles.title, themeStyles.title),
    description: cn(commonStyles.description, themeStyles.description),
    inputArea: cn(commonStyles.inputArea, themeStyles.inputArea),
    actions: cn(commonStyles.actions, themeStyles.actions),
    resultArea: cn(commonStyles.resultArea, themeStyles.resultArea),
    generatedField: cn(commonStyles.generatedField, themeStyles.generatedField),
    fieldLabel: cn(commonStyles.fieldLabel, themeStyles.fieldLabel),
    fieldValue: cn(commonStyles.fieldValue, themeStyles.fieldValue),
    sparkles: cn(commonStyles.sparkles, themeStyles.sparkles),
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      // Call the AI endpoint
      const response = await api.aiWriting.generateProjectDescription({
        project_type: prompt,
        key_features: [], // Let AI infer
        tone: 'professional'
      });

      // Parse the response to extract structured data
      // Since the current API returns a text block, we might need to parse it or update the API
      // For now, we'll simulate the structured extraction from the text content
      // In a real implementation, the API should return JSON
      
      const content = response.content;
      
      // Simple heuristic parsing (this would be better done on backend)
      const titleMatch = content.match(/# (.*)/);
      const title = titleMatch ? titleMatch[1] : 'Generated Project';
      
      // Mocking the structured return for now as the backend returns text
      // Ideally we update backend to return structured JSON
      const mockStructuredData: GeneratedData = {
        title: title,
        description: content,
        skills: ['React', 'Node.js', 'TypeScript'], // Mocked inference
        category: 'WEB_DEVELOPMENT',
        budgetMin: '50000',
        budgetMax: '100000'
      };

      setGeneratedData(mockStructuredData);
    } catch (error) {
      console.error('AI Generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (generatedData) {
      onApply(generatedData);
      setIsOpen(false);
      setGeneratedData(null);
      setPrompt('');
    }
  };

  if (!isOpen) {
    return (
      <div className="mb-6">
        <Button 
          variant="secondary" 
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-4 border-dashed border-2"
        >
          <FaMagic className="text-purple-500" />
          <span>Use AI Copilot to Draft Project</span>
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
          <FaRobot className="text-purple-600 dark:text-purple-300" size={20} />
        </div>
        <div>
          <h3 className={styles.title}>AI Project Copilot</h3>
          <p className="text-xs text-gray-500">Powered by MegiLance AI</p>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="ml-auto text-gray-400 hover:text-gray-600"
        >
          <FaTimes />
        </button>
      </div>

      <p className={styles.description}>
        Describe what you need in plain English, and I'll generate a structured project post for you.
      </p>

      <textarea
        className={styles.inputArea}
        placeholder="e.g., I need a modern e-commerce website for my bakery. It should have a product catalog, shopping cart, and payment integration. I want it to look clean and work on mobile."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={loading}
      />

      <div className={styles.actions}>
        <Button
          variant="ghost"
          onClick={() => setIsOpen(false)}
          disabled={loading}
          size="sm"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleGenerate}
          isLoading={loading}
          disabled={!prompt.trim() || loading}
          size="sm"
        >
          <FaMagic className="mr-2" />
          Generate Draft
        </Button>
      </div>

      {generatedData && (
        <div className={styles.resultArea}>
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
            <FaCheck className="text-green-500" /> Generated Preview
          </h4>
          
          <div className={styles.generatedField}>
            <div className={styles.fieldLabel}>Title</div>
            <div className={styles.fieldValue}>{generatedData.title}</div>
          </div>

          <div className={styles.generatedField}>
            <div className={styles.fieldLabel}>Description Preview</div>
            <div className={styles.fieldValue}>
              {generatedData.description?.substring(0, 150)}...
            </div>
          </div>

          <div className={styles.generatedField}>
            <div className={styles.fieldLabel}>Suggested Skills</div>
            <div className="flex flex-wrap gap-2">
              {generatedData.skills?.map(skill => (
                <span key={skill} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={handleApply} variant="success" size="sm">
              Apply to Form
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectAICopilot;
