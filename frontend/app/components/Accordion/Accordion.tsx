// @AI-HINT: This is a reusable accordion component for displaying collapsible content, like FAQs.
'use client';

import React, { useState, useContext, createContext, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './Accordion.base.module.css';
import lightStyles from './Accordion.light.module.css';
import darkStyles from './Accordion.dark.module.css';

// @AI-HINT: The Accordion is now context-aware to allow for 'single' or 'multiple' open items.

interface AccordionContextType {
  openItems: string[];
  toggleItem: (id: string) => void;
  type: 'single' | 'multiple';
}

const AccordionContext = createContext<AccordionContextType | null>(null);

const useAccordion = () => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('useAccordion must be used within an Accordion component');
  }
  return context;
};

interface AccordionItemProps {
  value: string; // Unique value for this item
  title: string;
  children: React.ReactNode;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({ value, title, children }) => {
  const { openItems, toggleItem } = useAccordion();
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
  const contentId = useId();
  const buttonId = useId();

  const isOpen = openItems.includes(value);

  return (
    <div className={cn(commonStyles.accordionItem, themeStyles.accordionItem, isOpen && commonStyles.open)}>
      <h3>
                <button
          id={buttonId}
          onClick={() => toggleItem(value)}
          aria-expanded={isOpen}
          aria-controls={contentId}
          className={cn(commonStyles.accordionTrigger, themeStyles.accordionTrigger)}
        >
          <span className={commonStyles.accordionTitle}>{title}</span>
          <motion.span 
            className={cn(commonStyles.accordionIcon, themeStyles.accordionIcon)}
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            aria-hidden="true"
          />
        </button>
      </h3>
            <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={contentId}
            role="region"
            aria-labelledby={buttonId}
            className={commonStyles.accordionContent}
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: 'auto' },
              collapsed: { opacity: 0, height: 0 },
            }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className={cn(commonStyles.accordionContentText, themeStyles.accordionContentText)}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface AccordionProps {
  children: React.ReactNode;
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  className?: string;
}

const Accordion: React.FC<AccordionProps> = ({ 
  children, 
  type = 'single', 
  defaultValue, 
  className 
}) => {
  const [openItems, setOpenItems] = useState<string[]>(() => {
    if (defaultValue) {
      return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
    }
    return [];
  });

  const toggleItem = (id: string) => {
    if (type === 'single') {
      setOpenItems(openItems.includes(id) ? [] : [id]);
    } else {
      setOpenItems(prev => 
        prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
    }
  };

  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, type }}>
      <div className={cn(commonStyles.accordionRoot, themeStyles.accordionRoot, className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

export default Accordion;
