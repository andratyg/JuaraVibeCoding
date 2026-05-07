import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(date: Date | null | undefined): string {
  if (!date) return '--:--';
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

export function formatDate(date: Date | null | undefined): string {
  if (!date) return 'No Date';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}
