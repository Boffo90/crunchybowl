'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, className, id, ...props }, ref) => {
	return (
  	<div className="w-full">
    	{label && (
      	<label
        	htmlFor={id}
        	className="block mb-2 text-sm font-semibold text-crunchy-dark"
      	>
        	{label}
      	</label>
    	)}
    	<input
      	ref={ref}
      	id={id}
      	className={cn(
        	'w-full rounded-2xl border-2 border-crunchy-pink-soft bg-white px-4 py-3 outline-none focus:border-crunchy-accent transition-colors',
        	error && 'border-red-400 focus:border-red-500',
        	className
      	)}
      	{...props}
    	/>
    	{error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  	</div>
	);
  }
);

Input.displayName = 'Input';

