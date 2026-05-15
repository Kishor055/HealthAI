
import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && React.isValidElement(icon) && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            {React.cloneElement(icon as React.ReactElement<any>, {
              className: 'h-4 w-4 text-muted-foreground',
            })}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            icon ? 'pl-10' : '',
            className
          )}
          ref={ref}
          suppressHydrationWarning
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
