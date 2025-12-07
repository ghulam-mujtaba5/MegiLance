// @AI-HINT: Component to suggest upsells for proposals
'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { FaLightbulb, FaPlus, FaRocket } from 'react-icons/fa';
import Button from '@/app/components/Button/Button';
import api from '@/lib/api';

import commonStyles from './UpsellSuggestions.common.module.css';
import lightStyles from './UpsellSuggestions.light.module.css';
import darkStyles from './UpsellSuggestions.dark.module.css';

interface UpsellSuggestionsProps {
  projectDescription: string;
  proposalContent: string;
  onAdd: (suggestion: { title: string; description: string }) => void;
}

interface Suggestion {
  title: string;
  description: string;
  type: string;
}

const UpsellSuggestions: React.FC<UpsellSuggestionsProps> = ({
  projectDescription,
  proposalContent,
  onAdd,
}) => {
  const { resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const styles = {
    container: cn(commonStyles.container, themeStyles.container),
    header: cn(commonStyles.header, themeStyles.header),
    title: cn(commonStyles.title, themeStyles.title),
    list: cn(commonStyles.list, themeStyles.list),
    item: cn(commonStyles.item, themeStyles.item),
    itemContent: cn(commonStyles.itemContent, themeStyles.itemContent),
    itemTitle: cn(commonStyles.itemTitle, themeStyles.itemTitle),
    itemDesc: cn(commonStyles.itemDesc, themeStyles.itemDesc),
  };

  const handleGenerate = async () => {
    if (!projectDescription || !proposalContent) return;

    setLoading(true);
    try {
      const response = await api.aiWriting.generateUpsellSuggestions({
        project_description: projectDescription,
        proposal_content: proposalContent,
      });
      setSuggestions(response.suggestions);
    } catch (error) {
      console.error('Upsell generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!suggestions.length && !loading) {
    return (
      <div className="mt-4">
        <Button
          variant="secondary"
          onClick={handleGenerate}
          disabled={!proposalContent || proposalContent.length < 50}
          size="sm"
          className="w-full border-dashed"
        >
          <FaRocket className="mr-2 text-purple-500" />
          Get AI Upsell Suggestions
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <FaLightbulb className="text-yellow-500" />
        <h3 className={styles.title}>Boost Your Proposal Value</h3>
      </div>

      {loading ? (
        <div className="text-center py-4 text-sm text-gray-500">
          Analyzing project scope...
        </div>
      ) : (
        <div className={styles.list}>
          {suggestions.map((suggestion, idx) => (
            <div key={idx} className={styles.item}>
              <div className={styles.itemContent}>
                <div className={styles.itemTitle}>{suggestion.title}</div>
                <div className={styles.itemDesc}>{suggestion.description}</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAdd(suggestion)}
                className="ml-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <FaPlus />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpsellSuggestions;
