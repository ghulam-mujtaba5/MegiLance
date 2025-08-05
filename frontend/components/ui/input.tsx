import * as React from 'react';

// @AI-HINT: This is a standardized, reusable Input component based on shadcn/ui.
// It is fully theme-aware and uses a cn utility for merging Tailwind classes.

// A robust, reusable cn utility is required for this component. If not present, create it in `lib/utils.ts`.
// Example: `import { type ClassValue, clsx } from "clsx";`
//          `import { twMerge } from "tailwind-merge";`
//          `export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }`

// Mock cn function if lib/utils is not available, to be replaced later.
const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
