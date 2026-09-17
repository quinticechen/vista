
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Keeps meta descriptions within a length search engines won't truncate awkwardly.
// Only meant for text pulled from user-authored content (article bodies, hero
// descriptions, etc.) -- short, already-curated copy doesn't need this.
export function truncateDescription(text: string, maxLength = 160): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    return format(parseISO(dateString), 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}
