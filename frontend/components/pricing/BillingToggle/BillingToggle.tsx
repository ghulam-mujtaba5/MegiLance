/* AI-HINT: This component provides a stylish, accessible toggle switch for users to select between monthly and yearly billing options. It manages its own state and provides a callback for parent components to react to changes. */

'use client';

import React from 'react';
import styles from './BillingToggle.module.css';
import lightStyles from './BillingToggle.light.module.css';
import darkStyles from './BillingToggle.dark.module.css';

interface BillingToggleProps {
  billingCycle: 'monthly' | 'yearly';
  setBillingCycle: (cycle: 'monthly' | 'yearly') => void;
}

export const BillingToggle: React.FC<BillingToggleProps> = ({ billingCycle, setBillingCycle }) => {
  const isYearly = billingCycle === 'yearly';

  const handleToggle = () => {
    setBillingCycle(isYearly ? 'monthly' : 'yearly');
  };

  return (
    <div className={`${styles.toggleWrapper} ${lightStyles.theme} ${darkStyles.theme}`}>
      <label 
        className={`${styles.toggleLabel} ${!isYearly ? styles.toggleLabelActive : ''}`}
        onClick={() => setBillingCycle('monthly')}
      >
        Monthly
      </label>
      <div className={styles.toggle} onClick={handleToggle}>
        <input
          type="checkbox"
          id="billing-toggle"
          className={styles.toggleCheckbox}
          checked={isYearly}
          onChange={handleToggle}
          aria-label="Toggle billing cycle"
        />
        <label htmlFor="billing-toggle" className={styles.toggleSlider}></label>
      </div>
      <label 
        className={`${styles.toggleLabel} ${isYearly ? styles.toggleLabelActive : ''}`}
        onClick={() => setBillingCycle('yearly')}
      >
        Yearly
      </label>
      <div className={styles.toggleDiscount}>
        Save 20%
      </div>
    </div>
  );
};
