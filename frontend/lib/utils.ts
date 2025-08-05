import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// @AI-HINT: This is a standard utility function for combining CSS classes with Tailwind CSS.
// It uses `clsx` to handle conditional classes and `tailwind-merge` to resolve conflicting styles.

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
