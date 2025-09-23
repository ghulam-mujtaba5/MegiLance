// Thin wrapper to preserve legacy import path '@/app/components/Logo/Logo'
// Re-exports the MegiLanceLogo component.
'use client';
import React from 'react';
import MegiLanceLogo from '@/app/components/MegiLanceLogo/MegiLanceLogo';

const Logo: React.FC<{ className?: string }> = (props) => <MegiLanceLogo {...props} />;
export default Logo;
