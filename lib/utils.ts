import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCLP(value: number): string {
  return new Intl.NumberFormat('es-CL', {
	style: 'currency',
	currency: 'CLP',
	maximumFractionDigits: 0
  }).format(value);
}

export const PRODUCTO_LABELS: Record<string, string> = {
  bibimbap: 'BIB',
  japchae: 'JAP',
  pollo: 'POLLO',
  otro: 'MENU',
};

export function slugify(text: string): string {
  return text
	.toString()
	.normalize('NFD')
	.replace(/[\u0300-\u036f]/g, '')
	.toLowerCase()
	.trim()
	.replace(/\s+/g, '-')
	.replace(/[^\w-]+/g, '');
}

