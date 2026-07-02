import { ReactNode } from 'react';
import { cn } from '@/utils';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <div
      className={cn(
        'animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out fill-mode-both',
        className
      )}
    >
      {children}
    </div>
  );
}
