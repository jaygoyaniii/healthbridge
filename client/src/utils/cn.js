import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility to merge tailwind classes safely without style conflicts.
 * Uses clsx for conditional classes and tailwind-merge to override duplicates.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
