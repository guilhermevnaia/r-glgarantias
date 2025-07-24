/**
 * Utility function to combine CSS classes efficiently
 * Optimized for performance with strict type checking
 */
export function cn(...classes: (string | undefined | null | false | 0 | "")[]): string {
  return classes.filter(Boolean).join(' ');
}