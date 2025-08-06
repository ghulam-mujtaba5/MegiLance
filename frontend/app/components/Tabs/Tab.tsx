// @AI-HINT: This is the individual Tab component. It's designed to be composed within the Tabs.List component. It handles its own styling, accessibility attributes, and interactions, and receives its state from the parent Tabs context.

'use client';

import React, { forwardRef, ReactNode, useContext } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { TabsContext, useTabs } from './Tabs';

import commonStyles from './Tab.common.module.css';
import lightStyles from './Tab.light.module.css';
import darkStyles from './Tab.dark.module.css';

export interface TabProps {
  children: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
  // Props injected by Tabs.List
  index?: number;
}

const Tab = forwardRef<HTMLButtonElement, TabProps>(({ children, disabled, icon, index, ...props }, ref) => {
  const { selectedIndex, setSelectedIndex, tabsId, themeStyles } = useTabs();
  const { theme } = useTheme();

  const isSelected = index === selectedIndex;

  const handleClick = () => {
    if (!disabled && index !== undefined) {
      setSelectedIndex(index);
    }
  };

  const componentStyles = theme === 'light' ? lightStyles : darkStyles;

  const tabClasses = cn(
    commonStyles.tab,
    componentStyles.tab,
    isSelected && commonStyles.tabSelected,
    isSelected && componentStyles.tabSelected,
    disabled && commonStyles.tabDisabled,
    disabled && componentStyles.tabDisabled
  );

  return (
    <button
      ref={ref}
      role="tab"
      type="button"
      id={`tab-${tabsId}-${index}`}
      aria-controls={`tabpanel-${tabsId}-${index}`}
      aria-selected={isSelected}
      tabIndex={isSelected ? 0 : -1}
      onClick={handleClick}
      disabled={disabled}
      className={tabClasses}
      {...props}
    >
      {icon && <span className={commonStyles.tabIcon}>{icon}</span>}
      <span className={commonStyles.tabLabel}>{children}</span>
    </button>
  );
});

Tab.displayName = 'Tab';

export default Tab;
