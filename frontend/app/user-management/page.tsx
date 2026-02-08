// @AI-HINT: User Management page scaffold using premium EmptyState and global Toaster.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { welcomeWaveAnimation } from '@/app/components/Animations/LottieAnimation';
import { useToaster } from '@/app/components/Toast/ToasterProvider';
import Button from '@/app/components/Button/Button';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { Users, UserPlus } from 'lucide-react';

import commonStyles from './UserManagement.common.module.css';
import lightStyles from './UserManagement.light.module.css';
import darkStyles from './UserManagement.dark.module.css';

const UserManagementPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const { notify } = useToaster();

  if (!resolvedTheme) return null;

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <PageTransition>
      <main className={cn(commonStyles.page, themeStyles.page)}>
        <div className={commonStyles.container}>
          <ScrollReveal>
            <header className={commonStyles.header}>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>User Management</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Invite teammates, assign roles, and manage permissions.
              </p>
            </header>
          </ScrollReveal>
          
          <ScrollReveal delay={0.1}>
            <EmptyState
              title="No users yet"
              description="Invite your team to collaborate with appropriate roles and permissions."
              icon={<Users size={48} />}
              animationData={welcomeWaveAnimation}
              animationWidth={120}
              animationHeight={120}
              action={
                <Button
                  variant="primary"
                  iconBefore={<UserPlus size={18} />}
                  onClick={() => notify({ 
                    title: 'Invite user', 
                    description: 'Invitation flow coming soon.', 
                    variant: 'info', 
                    duration: 3000 
                  })}
                >
                  Invite User
                </Button>
              }
            />
          </ScrollReveal>
        </div>
      </main>
    </PageTransition>
  );
};

export default UserManagementPage;