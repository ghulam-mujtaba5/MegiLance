import * as React from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import base from './Input.base.module.css';
import light from './Input.light.module.css';
import dark from './Input.dark.module.css';

// @AI-HINT: This is a standardized, reusable Input component for the MegiLance platform.
// It is built with a per-component CSS module structure for theme-awareness (light/dark).
// It strictly follows the design specifications outlined in the MegiLance Brand Playbook.

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? dark : light;
  return (
    <input
      type={type}
      className={cn(base.input, themeStyles.input, className)}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
