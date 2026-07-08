'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
	'bg-crunchy-accent text-white hover:bg-crunchy-pink-deep shadow-kawaii hover:shadow-kawaii-lg',
  secondary:
	'bg-white text-crunchy-dark border-2 border-crunchy-pink hover:bg-crunchy-pink-soft',
  ghost: 'bg-transparent text-crunchy-dark hover:bg-crunchy-pink-soft'
};

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg'
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
	return (
  	<button
    	ref={ref}
    	disabled={disabled || loading}
    	className={cn(
      	'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
      	variants[variant],
      	sizes[size],
      	className
    	)}
    	{...props}
  	>
    	{loading ? (
      	<span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
    	) : (
      	children
    	)}
  	</button>
	);
  }
);

Button.displayName = 'Button';

