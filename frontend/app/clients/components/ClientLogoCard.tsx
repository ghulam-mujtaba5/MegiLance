// @AI-HINT: Reusable client logo card with hover effect, project count, and accessible labeling.
'use client';
import React from 'react';
import Image from 'next/image';
import styles from '../Clients.common.module.css';

export interface ClientLogoCardProps {
  name: string;
  src: string;
  industry: string;
  projectCount?: number;
  description?: string | null;
}

const ClientLogoCard: React.FC<ClientLogoCardProps> = ({ name, src, industry, projectCount, description }) => {
  return (
    <figure className={styles.logoCard} aria-labelledby={`logo-${name}`} data-industry={industry}>
      <Image src={src} alt={name} width={140} height={100} className={styles.logo} />
      <figcaption id={`logo-${name}`} className={styles.logoCaption}>
        <span className={styles.logoName}>{name}</span>
        <span className={styles.logoIndustry}>{industry}</span>
        {projectCount !== undefined && projectCount > 0 && (
          <span className={styles.logoProjects}>{projectCount} projects</span>
        )}
      </figcaption>
      {description && (
        <span className={styles.srOnly}>{description}</span>
      )}
    </figure>
  );
};

export default ClientLogoCard;
