// @AI-HINT: Premium Card component with 3D hover effects, glassmorphism, and billionaire-grade styling. Supports multiple variants for stunning UI.

'use client';

import React, { useRef, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import commonStyles from './Card.common.module.css';
import lightStyles from './Card.light.module.css';
import darkStyles from './Card.dark.module.css';

export interface CardProps {
  title?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outline' | 'filled' | 'glass' | 'premium' | 'holographic';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  enable3D?: boolean;
  intensity3D?: number;
}

const Card: React.FC<CardProps> = ({ 
  title, 
  icon: Icon, 
  children, 
  className = '',
  variant = 'default',
  size = 'md',
  loading = false,
  enable3D = false,
  intensity3D = 10
}) => {
  const { resolvedTheme } = useTheme();
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');
  const [shine, setShine] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !enable3D) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -intensity3D;
    const rotateY = ((x - centerX) / centerX) * intensity3D;
    
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    setShine({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  }, [enable3D, intensity3D]);

  const handleMouseLeave = useCallback(() => {
    if (!enable3D) return;
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setShine({ x: 50, y: 50 });
  }, [enable3D]);

  if (!resolvedTheme) {
    return null; // Don't render until theme is resolved to prevent flash
  }

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
  const is3DEnabled = enable3D || variant === 'premium' || variant === 'holographic';

  return (
    <div 
      ref={cardRef}
      className={cn(
        commonStyles.card,
        themeStyles.card,
        commonStyles[`variant-${variant}`],
        themeStyles[`variant-${variant}`],
        commonStyles[`size-${size}`],
        loading && commonStyles.loading,
        is3DEnabled && commonStyles.card3D,
        className
      )}
      style={is3DEnabled ? { transform } : undefined}
      onMouseMove={is3DEnabled ? handleMouseMove : undefined}
      onMouseLeave={is3DEnabled ? handleMouseLeave : undefined}
    >
      {/* Premium shine overlay for 3D effect */}
      {is3DEnabled && (
        <div 
          className={commonStyles.shineOverlay}
          style={{
            background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255, 255, 255, 0.15), transparent 50%)`
          }}
        />
      )}
      
      {title && (
        <div className={cn(commonStyles.cardHeader, themeStyles.cardHeader)}>
          {Icon && <Icon className={cn(commonStyles.cardIcon, themeStyles.cardIcon)} size={24} />}
          <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>{title}</h3>
        </div>
      )}
      <div className={cn(commonStyles.cardContent, themeStyles.cardContent)}>
        {children}
      </div>
    </div>
  );
};

export default Card;