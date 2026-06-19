import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

const Input = forwardRef(
  ({ className, label, error, success, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn('flex flex-col w-full', className)}>
        {label && (
          <label htmlFor={inputId} className="mb-1.5 text-sm font-medium text-heading">
            {label}
          </label>
        )}
        
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-muted">
              {leftIcon}
            </div>
          )}
          
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'input-base w-full transition-colors duration-200',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
              success && !error && 'border-green-500 focus:ring-green-500 focus:border-green-500'
            )}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 text-muted">
              {rightIcon}
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <p className={cn('mt-1.5 text-sm', error ? 'text-red-500' : 'text-muted')}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
