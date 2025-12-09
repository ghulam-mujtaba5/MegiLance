import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import commonStyles from './Loading.common.module.css';
import lightStyles from './Loading.light.module.css';
import darkStyles from './Loading.dark.module.css';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({ size = 'md', text, className }) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.container, className)}>
      <Loader2 className={cn(commonStyles.spinner, commonStyles[size], themeStyles.spinner)} />
      {text && <p className={cn(commonStyles.text, themeStyles.text)}>{text}</p>}
    </div>
  );
};

export default Loading;
