
import React, { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface OptimizedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  touched?: boolean;
  required?: boolean;
}

export const OptimizedInput = forwardRef<HTMLInputElement, OptimizedInputProps>(
  ({ className, label, error, touched, required, ...props }, ref) => {
    const hasError = error && touched;

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={props.id} className={cn(
            "text-sm font-medium",
            hasError && "text-red-600",
            required && "after:content-['*'] after:ml-0.5 after:text-red-500"
          )}>
            {label}
          </Label>
        )}
        <div className="relative">
          <Input
            ref={ref}
            className={cn(
              "transition-colors",
              hasError && "border-red-500 focus:border-red-500 focus:ring-red-500",
              className
            )}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${props.id}-error` : undefined}
            {...props}
          />
          {hasError && (
            <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
          )}
        </div>
        {hasError && (
          <p id={`${props.id}-error`} className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

OptimizedInput.displayName = "OptimizedInput";
