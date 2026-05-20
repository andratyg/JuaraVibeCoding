import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(date: Date | null | undefined): string {
  if (!date) return '--:--';
  return date.toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

export function formatDate(date: Date | null | undefined): string {
  if (!date) return 'Tanpa Tanggal';
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short'
  });
}
